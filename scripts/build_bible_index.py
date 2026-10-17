#!/usr/bin/env python3
"""Verify the complete Shipai archive before merging; retain other sources."""
from audit_shipai_months import main
if __name__ == '__main__':
    main(update=True)
