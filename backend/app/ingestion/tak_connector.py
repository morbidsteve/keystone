"""TAK server connector service.

Manages connections to TAK servers and processes incoming CoT messages.
Supports both REST API polling and direct TCP/SSL connections for
real-time CoT message ingestion.
"""

import logging
import ssl
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.ingestion.tak_parser import matches_cot_filter, parse_cot_message

logger = logging.getLogger(__name__)

# In-memory connection status tracking (per-process)
_connection_states: Dict[int, Dict[str, Any]] = {}


class TAKConnector:
    """Manages connection to a TAK server and processes incoming CoT messages.

    Supports two modes of operation:
    1. REST API polling: Periodically queries the TAK server's REST API
       for recent CoT messages.
    2. Direct TCP/SSL: Maintains a persistent connection for real-time
       CoT message streaming (future enhancement).

    The REST API mode uses the standard TAK Server Marti API endpoints:
    - GET /Marti/api/cot/xml/{uid}      - Get specific CoT event
    - GET /Marti/api/missions/all        - List missions/channels
    - GET /Marti/api/cot/search          - Search CoT events by criteria
    """

    def __init__(self) -> None:
        self._clients: Dict[int, httpx.AsyncClient] = {}

    async def connect(self, connection) -> bool:
        """Establish connection to a TAK server.

        For REST API mode, validates connectivity by hitting the
        server's health/version endpoint.

        Args:
            connection: TAKConnection model instance.

        Returns:
            True if connection succeeds, False otherwise.
        """
        connection_id = connection.id
        base_url = self._build_base_url(connection)

        try:
            ssl_context = self._build_ssl_context(connection)

            client = httpx.AsyncClient(
                base_url=base_url,
                verify=ssl_context if ssl_context else (not connection.use_tls),
                timeout=httpx.Timeout(30.0, connect=10.0),
                headers=self._build_headers(connection),
            )

            # Test connectivity with a lightweight request
            response = await client.get("/Marti/api/version")
            if response.status_code in (200, 401, 403):
                # 401/403 means server is reachable but auth may need config
                self._clients[connection_id] = client
                _connection_states[connection_id] = {
                    "status": "connected",
                    "connected_at": datetime.now(timezone.utc).isoformat(),
                    "last_error": None,
                    "messages_received": 0,
                    "last_poll": None,
                }
                logger.info(
                    f"Connected to TAK server: {connection.name} "
                    f"({connection.host}:{connection.api_port})"
                )
                return True

            _connection_states[connection_id] = {
                "status": "error",
                "last_error": f"Unexpected status code: {response.status_code}",
                "connected_at": None,
                "messages_received": 0,
                "last_poll": None,
            }
            await client.aclose()
            return False

        except httpx.ConnectError as exc:
            error_msg = f"Connection refused: {connection.host}:{connection.api_port}"
            logger.warning(f"TAK connect failed for {connection.name}: {error_msg}")
            _connection_states[connection_id] = {
                "status": "error",
                "last_error": error_msg,
                "connected_at": None,
                "messages_received": 0,
                "last_poll": None,
            }
            return False

        except httpx.TimeoutException:
            error_msg = f"Connection timeout: {connection.host}:{connection.api_port}"
            logger.warning(f"TAK connect timeout for {connection.name}: {error_msg}")
            _connection_states[connection_id] = {
                "status": "error",
                "last_error": error_msg,
                "connected_at": None,
                "messages_received": 0,
                "last_poll": None,
            }
            return False

        except Exception as exc:
            error_msg = f"Connection error: {str(exc)}"
            logger.exception(f"TAK connect error for {connection.name}")
            _connection_states[connection_id] = {
                "status": "error",
                "last_error": error_msg,
                "connected_at": None,
                "messages_received": 0,
                "last_poll": None,
            }
            return False

    async def disconnect(self, connection_id: int) -> None:
        """Disconnect from a TAK server and clean up resources.

        Args:
            connection_id: ID of the TAKConnection to disconnect.
        """
        client = self._clients.pop(connection_id, None)
        if client:
            await client.aclose()

        _connection_states[connection_id] = {
            "status": "disconnected",
            "last_error": None,
            "connected_at": None,
            "messages_received": _connection_states.get(
                connection_id, {}
            ).get("messages_received", 0),
            "last_poll": _connection_states.get(connection_id, {}).get(
                "last_poll"
            ),
        }
        logger.info(f"Disconnected from TAK server (connection_id={connection_id})")

    async def poll_messages(
        self,
        connection,
        since: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Poll a TAK server REST API for recent CoT messages.

        Uses TAK Server REST API endpoints:
        - GET /Marti/api/cot/search?start=...&end=...&type=...

        Args:
            connection: TAKConnection model instance.
            since: Only return messages after this timestamp. Defaults to
                   5 minutes ago if not specified.

        Returns:
            List of parsed CoT message dictionaries.
        """
        connection_id = connection.id
        client = self._clients.get(connection_id)

        if not client:
            logger.warning(
                f"No active client for connection {connection_id}, "
                "attempting reconnect"
            )
            connected = await self.connect(connection)
            if not connected:
                return []
            client = self._clients.get(connection_id)
            if not client:
                return []

        # Default to last 5 minutes
        if since is None:
            since = datetime.now(timezone.utc).replace(
                second=0, microsecond=0
            )
            # Subtract 5 minutes manually to avoid timedelta import
            since = since.replace(
                minute=max(0, since.minute - 5)
            )

        params: Dict[str, str] = {
            "start": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "end": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        # Apply CoT type filter if configured
        if connection.cot_types_filter:
            # TAK API accepts comma-separated type patterns
            params["type"] = ",".join(connection.cot_types_filter)

        try:
            response = await client.get(
                "/Marti/api/cot/search", params=params
            )

            if response.status_code != 200:
                logger.warning(
                    f"TAK poll returned {response.status_code} "
                    f"for connection {connection.name}"
                )
                return []

            # TAK server returns XML or JSON depending on Accept header
            content_type = response.headers.get("content-type", "")

            messages = []
            if "xml" in content_type or response.text.strip().startswith("<"):
                messages = self._parse_xml_response(
                    response.text, connection
                )
            else:
                # Attempt JSON parsing
                messages = self._parse_json_response(
                    response.json(), connection
                )

            # Update state
            state = _connection_states.get(connection_id, {})
            state["last_poll"] = datetime.now(timezone.utc).isoformat()
            state["messages_received"] = state.get(
                "messages_received", 0
            ) + len(messages)
            state["status"] = "connected"
            _connection_states[connection_id] = state

            logger.info(
                f"Polled {len(messages)} messages from {connection.name}"
            )
            return messages

        except httpx.TimeoutException:
            logger.warning(f"TAK poll timeout for {connection.name}")
            self._update_state_error(
                connection_id, "Poll request timed out"
            )
            return []

        except Exception as exc:
            logger.exception(f"TAK poll error for {connection.name}")
            self._update_state_error(connection_id, str(exc))
            return []

    async def test_connection(self, connection) -> Dict[str, Any]:
        """Test connectivity to a TAK server without persistent connection.

        Args:
            connection: TAKConnection model instance.

        Returns:
            Dictionary with test results including status, latency, and
            server version if available.
        """
        base_url = self._build_base_url(connection)
        start_time = datetime.now(timezone.utc)

        try:
            ssl_context = self._build_ssl_context(connection)

            async with httpx.AsyncClient(
                base_url=base_url,
                verify=ssl_context if ssl_context else (not connection.use_tls),
                timeout=httpx.Timeout(15.0, connect=10.0),
                headers=self._build_headers(connection),
            ) as client:
                response = await client.get("/Marti/api/version")

            elapsed = (
                datetime.now(timezone.utc) - start_time
            ).total_seconds()

            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "latency_ms": round(elapsed * 1000, 1),
                    "server_info": response.text[:500],
                    "message": "Connection successful",
                }
            elif response.status_code in (401, 403):
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "latency_ms": round(elapsed * 1000, 1),
                    "message": (
                        "Server reachable but authentication failed. "
                        "Check API token or client certificate."
                    ),
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "latency_ms": round(elapsed * 1000, 1),
                    "message": f"Unexpected response: HTTP {response.status_code}",
                }

        except httpx.ConnectError:
            return {
                "success": False,
                "status_code": None,
                "latency_ms": None,
                "message": (
                    f"Connection refused: {connection.host}:{connection.api_port}. "
                    "Verify host and port are correct."
                ),
            }
        except httpx.TimeoutException:
            return {
                "success": False,
                "status_code": None,
                "latency_ms": None,
                "message": "Connection timed out after 15 seconds.",
            }
        except Exception as exc:
            return {
                "success": False,
                "status_code": None,
                "latency_ms": None,
                "message": f"Error: {str(exc)}",
            }

    async def process_message(
        self, cot_data: Dict[str, Any], connection
    ) -> Dict[str, Any]:
        """Process a parsed CoT message into KEYSTONE data records.

        Takes a parsed CoT message (from tak_parser) and transforms it
        into records suitable for insertion into KEYSTONE's supply,
        equipment, and transportation tables.

        Args:
            cot_data: Parsed CoT message dictionary.
            connection: TAKConnection model instance for context.

        Returns:
            Processing result with counts of created records.
        """
        result = {
            "uid": cot_data.get("uid"),
            "category": cot_data.get("category"),
            "supply_records": 0,
            "equipment_records": 0,
            "position_updated": False,
        }

        # Process logistics data if present
        logistics = cot_data.get("logistics", [])
        if logistics:
            result["supply_records"] = len(logistics)

        equipment = cot_data.get("equipment", [])
        if equipment:
            result["equipment_records"] = len(equipment)

        # Position update
        if cot_data.get("position"):
            result["position_updated"] = True

        return result

    def get_connection_status(self, connection_id: int) -> Dict[str, Any]:
        """Return current connection status for a TAK connection.

        Args:
            connection_id: ID of the TAKConnection.

        Returns:
            Status dictionary with connection state, message counts,
            and error information.
        """
        return _connection_states.get(
            connection_id,
            {
                "status": "disconnected",
                "last_error": None,
                "connected_at": None,
                "messages_received": 0,
                "last_poll": None,
            },
        )

    def _build_base_url(self, connection) -> str:
        """Build the base URL for TAK server REST API calls."""
        scheme = "https" if connection.use_tls else "http"
        return f"{scheme}://{connection.host}:{connection.api_port}"

    def _build_headers(self, connection) -> Dict[str, str]:
        """Build HTTP headers for TAK server requests."""
        headers: Dict[str, str] = {
            "Accept": "application/xml",
        }
        if connection.api_token:
            headers["Authorization"] = f"Bearer {connection.api_token}"
        return headers

    def _build_ssl_context(self, connection) -> Optional[ssl.SSLContext]:
        """Build SSL context for TLS connections with client certificates.

        By default, certificates are verified. Only disable verification
        when the connection explicitly sets verify_tls=False (e.g., for
        self-signed certs in tactical environments).
        """
        if not connection.use_tls:
            return None

        ctx = ssl.create_default_context()

        if connection.cert_file:
            try:
                ctx.load_cert_chain(connection.cert_file)
            except (FileNotFoundError, ssl.SSLError) as exc:
                logger.warning(
                    f"Failed to load client cert {connection.cert_file}: {exc}"
                )

        # Only disable TLS verification if explicitly requested
        verify_tls = getattr(connection, "verify_tls", True)
        if not verify_tls:
            logger.warning(
                "TLS certificate verification DISABLED for connection. "
                "This should only be used for self-signed certs in tactical environments."
            )
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

        return ctx

    def _parse_xml_response(
        self, xml_text: str, connection
    ) -> List[Dict[str, Any]]:
        """Parse an XML response containing multiple CoT events."""
        messages = []

        # TAK server may wrap events in a container element
        # or return individual events
        try:
            # Try parsing as a single document
            xml_text = xml_text.strip()

            # If it starts with <events>, parse the wrapper
            if xml_text.startswith("<events"):
                import defusedxml.ElementTree as ET

                root = ET.fromstring(xml_text)
                for event_elem in root.findall("event"):
                    event_xml = ET.tostring(
                        event_elem, encoding="unicode"
                    )
                    parsed = parse_cot_message(event_xml)
                    if parsed and self._passes_filters(parsed, connection):
                        messages.append(parsed)
            else:
                # Try parsing as individual events
                # Split on </event> to handle concatenated events
                event_chunks = xml_text.split("</event>")
                for chunk in event_chunks:
                    chunk = chunk.strip()
                    if not chunk:
                        continue
                    if not chunk.endswith("</event>"):
                        chunk += "</event>"
                    parsed = parse_cot_message(chunk)
                    if parsed and self._passes_filters(parsed, connection):
                        messages.append(parsed)

        except Exception as exc:
            logger.warning(f"Error parsing XML response: {exc}")

        return messages

    def _parse_json_response(
        self, json_data: Any, connection
    ) -> List[Dict[str, Any]]:
        """Parse a JSON response from TAK server.

        Some TAK server versions support JSON output for CoT data.
        """
        messages = []

        if isinstance(json_data, list):
            items = json_data
        elif isinstance(json_data, dict):
            items = json_data.get("data", json_data.get("events", []))
            if not isinstance(items, list):
                items = [items]
        else:
            return []

        for item in items:
            if isinstance(item, dict):
                # If the item contains raw XML, parse it
                xml_content = item.get("xmlDetail", item.get("xml", ""))
                if xml_content:
                    parsed = parse_cot_message(xml_content)
                    if parsed and self._passes_filters(parsed, connection):
                        messages.append(parsed)

        return messages

    def _passes_filters(
        self, parsed_message: Dict[str, Any], connection
    ) -> bool:
        """Check if a parsed message passes the connection's filters."""
        cot_type = parsed_message.get("cot_type", "")

        # Apply CoT type filter
        if connection.cot_types_filter:
            if not matches_cot_filter(
                cot_type, connection.cot_types_filter
            ):
                return False

        # Apply channel filter
        if connection.channel_filter:
            group_name = parsed_message.get("group_name", "")
            if (
                group_name
                and connection.channel_filter.lower()
                not in group_name.lower()
            ):
                return False

        return True

    def _update_state_error(
        self, connection_id: int, error_msg: str
    ) -> None:
        """Update connection state with an error."""
        state = _connection_states.get(connection_id, {})
        state["status"] = "error"
        state["last_error"] = error_msg
        _connection_states[connection_id] = state


# Module-level singleton
tak_connector = TAKConnector()
