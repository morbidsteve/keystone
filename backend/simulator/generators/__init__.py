"""Data generators for the KEYSTONE simulator.

Generators produce periodic data payloads (mIRC chat batches, Excel reports,
TAK position updates) based on current simulation state. They are called by
the engine on each tick and return payloads only when their interval is due.

Submodules
----------
- ``mirc``         -- mIRC log content (LOGSTATs, supply requests, convoys, chatter)
- ``excel``        -- Excel workbooks (.xlsx) for upload to the ingestion endpoint
- ``tak``          -- TAK Cursor-on-Target XML events
- ``manual_entry`` -- Direct REST API payloads matching Pydantic schemas
- ``gcss_mc``      -- Stub for future GCSS-MC feed integration
"""

from simulator.generators.mirc import (
    format_dtg,
    generate_chatter,
    generate_convoy_update,
    generate_equipment_status,
    generate_logstat_block,
    generate_mirc_log_batch,
    generate_supply_request,
)
from simulator.generators.excel import (
    generate_convoy_manifest_excel,
    generate_equipment_excel,
    generate_logstat_excel,
)
from simulator.generators.tak import (
    generate_convoy_cot,
    generate_equipment_cot,
    generate_position_cot,
    generate_supply_cot,
)
from simulator.generators.manual_entry import (
    generate_equipment_update_payload,
    generate_movement_payload,
    generate_supply_update_payload,
)

__all__ = [
    # mIRC
    "format_dtg",
    "generate_chatter",
    "generate_convoy_update",
    "generate_equipment_status",
    "generate_logstat_block",
    "generate_mirc_log_batch",
    "generate_supply_request",
    # Excel
    "generate_convoy_manifest_excel",
    "generate_equipment_excel",
    "generate_logstat_excel",
    # TAK CoT
    "generate_convoy_cot",
    "generate_equipment_cot",
    "generate_position_cot",
    "generate_supply_cot",
    # Manual API entry
    "generate_equipment_update_payload",
    "generate_movement_payload",
    "generate_supply_update_payload",
]
