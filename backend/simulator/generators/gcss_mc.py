"""GCSS-MC (Global Combat Support System — Marine Corps) feed generator stub.

This module will generate simulated data in the format expected by the
GCSS-MC integration pipeline once that ingestion pathway is implemented.

GCSS-MC is the Marine Corps' authoritative logistics ERP system. It provides:
- Real-time supply chain visibility (warehouse, in-transit, on-hand)
- Equipment readiness reporting (ERS/TERS)
- Maintenance work-order tracking
- Fuel transaction records
- Ammunition accountability

TODO: Implement GCSS-MC data generators once the ingestion endpoint is
      defined. Expected data formats:
      - GCSS-MC Transaction Interface (TI) flat-file records
      - Equipment readiness snapshots (JSON or XML)
      - Fuel/ammo accountability exports (CSV)
      - Maintenance work-order status feeds

TODO: Coordinate with the backend team on API schema for
      ``POST /api/v1/ingestion/gcss-mc``.

TODO: Add support for simulating GCSS-MC outages and stale-data
      scenarios (common in austere environments).
"""
