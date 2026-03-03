"""Parse mIRC log files into structured logistics records."""

import re
from typing import Dict, List, Optional

from app.ingestion.mirc_patterns import PATTERN_PARSERS


# Timestamp pattern for mIRC log lines
MIRC_LINE = re.compile(r"\[(\d{2}:\d{2}:\d{2})\]\s*(?:<([^>]+)>)?\s*(.*)")


def parse_mirc_log(content: str) -> List[Dict]:
    """Parse an mIRC log file into a list of structured records.

    Each record contains:
    - type: message classification
    - data: extracted structured fields
    - confidence: 1.0 for regex match, 0.5-0.8 for NLP
    - raw_text: original line text
    - sender: mIRC username if present
    - timestamp: time from the log line
    """
    records = []
    current_logstat_context = None

    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue

        # Extract timestamp and sender
        line_match = MIRC_LINE.match(line)
        if line_match:
            timestamp = line_match.group(1)
            sender = line_match.group(2)
            message = line_match.group(3)
        else:
            timestamp = None
            sender = None
            message = line

        # Try each pattern parser
        matched = False
        for pattern_name, parser_func in PATTERN_PARSERS:
            result = parser_func(line)
            if result:
                if pattern_name == "LOGSTAT_HEADER":
                    current_logstat_context = result
                    records.append(
                        {
                            "type": "LOGSTAT_HEADER",
                            "data": result,
                            "confidence": 1.0,
                            "raw_text": line,
                            "sender": sender or result.get("sender"),
                            "timestamp": timestamp,
                        }
                    )
                else:
                    record_data = result.copy()
                    if current_logstat_context:
                        record_data["logstat_unit"] = current_logstat_context.get(
                            "unit"
                        )
                        record_data["logstat_dtg"] = current_logstat_context.get("dtg")

                    records.append(
                        {
                            "type": result.get("type", pattern_name),
                            "data": record_data,
                            "confidence": 1.0,
                            "raw_text": line,
                            "sender": sender,
                            "timestamp": timestamp,
                        }
                    )
                matched = True
                break

        # If no regex matched, try NLP-based extraction
        if not matched and message and len(message) > 10:
            nlp_result = _nlp_extract(message)
            if nlp_result:
                records.append(
                    {
                        "type": nlp_result.get("type", "GENERAL"),
                        "data": nlp_result,
                        "confidence": nlp_result.get("confidence", 0.5),
                        "raw_text": line,
                        "sender": sender,
                        "timestamp": timestamp,
                    }
                )

    return records


def _nlp_extract(text: str) -> Optional[Dict]:
    """Use spaCy NLP to extract entities from unmatched text.

    Falls back to keyword matching if spaCy is unavailable.
    """
    text_lower = text.lower()

    # Keyword-based classification with confidence scores
    supply_keywords = [
        "ammo",
        "ammunition",
        "fuel",
        "water",
        "rations",
        "meals",
        "supply",
        "class",
        "resupply",
        "requisition",
        "shortage",
        "on hand",
        "dos",
        "days of supply",
    ]
    equip_keywords = [
        "vehicle",
        "hmmwv",
        "mtvr",
        "lav",
        "aav",
        "tank",
        "readiness",
        "deadline",
        "nmcm",
        "nmcs",
        "mission capable",
        "maintenance",
        "equipment",
    ]
    transport_keywords = [
        "convoy",
        "movement",
        "en route",
        "departure",
        "arrival",
        "destination",
        "msr",
        "route",
        "transport",
    ]

    supply_score = sum(1 for kw in supply_keywords if kw in text_lower)
    equip_score = sum(1 for kw in equip_keywords if kw in text_lower)
    transport_score = sum(1 for kw in transport_keywords if kw in text_lower)

    max_score = max(supply_score, equip_score, transport_score)

    if max_score == 0:
        return None

    # Determine type based on keyword matches
    if supply_score == max_score:
        msg_type = "SUPPLY"
    elif equip_score == max_score:
        msg_type = "EQUIPMENT"
    else:
        msg_type = "TRANSPORTATION"

    # Calculate confidence based on keyword density
    confidence = min(0.5 + (max_score * 0.1), 0.8)

    result = {
        "type": msg_type,
        "raw_message": text,
        "confidence": confidence,
        "extraction_method": "keyword_nlp",
    }

    # Try spaCy for entity extraction
    try:
        import spacy

        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)

        entities = {}
        for ent in doc.ents:
            if ent.label_ in ("QUANTITY", "CARDINAL"):
                entities["quantity"] = ent.text
            elif ent.label_ in ("ORG", "GPE"):
                entities.setdefault("locations", []).append(ent.text)
            elif ent.label_ == "DATE":
                entities["date"] = ent.text

        if entities:
            result["entities"] = entities
            result["confidence"] = min(result["confidence"] + 0.1, 0.8)
            result["extraction_method"] = "spacy_nlp"

    except (ImportError, OSError):
        # spaCy not available; rely on keyword extraction only
        pass

    return result
