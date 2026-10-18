#!/usr/bin/env python3
"""Refresh 如鷹展翅 while retaining every other Bible source."""
import update_prping as indexer

indexer.BASE = "https://isaiahkao.blogspot.com"
indexer.SOURCE = "如鷹展翅"
indexer.REPORT = indexer.pathlib.Path("data/isaiah-index-status.json")

if __name__ == "__main__":
    indexer.main()
