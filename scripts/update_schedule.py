#!/usr/bin/env python3
"""Resolve the current Taipei-month tab from a public Google Sheet.

The script runs in GitHub Actions on the first day of every month. It tries to
find the current month's worksheet tab and writes data/current-schedule.json for
the static site.
"""

from __future__ import annotations

import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

SHEET_ID = "1v5f3u7T6WJdnyNquAHzpJmtDCVfqmUd4l-j72Ah0Kcw"
HTMLVIEW_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/htmlview"
OUTPUT_PATH = Path("data/current-schedule.json")
TAIPEI = ZoneInfo("Asia/Taipei")
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)


def fetch_text(url: str, timeout: int = 30) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def normalize(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"[\s_\-./年月號份()（）\[\]【】]", "", value).lower()


def candidate_names(year: int, month: int) -> list[str]:
    m = str(month)
    mm = f"{month:02d}"
    roc_year = year - 1911
    return [
        f"{year}年{m}月",
        f"{year}年{mm}月",
        f"{year}年{m}月份",
        f"{year}/{m}",
        f"{year}/{mm}",
        f"{year}-{m}",
        f"{year}-{mm}",
        f"{year}.{m}",
        f"{roc_year}年{m}月",
        f"{roc_year}年{mm}月",
        f"{m}月",
        f"{mm}月",
        f"{m}月份",
        f"{mm}月份",
        m,
        mm,
    ]


def discover_gid_from_html(year: int, month: int) -> tuple[str, str] | None:
    """Try to discover a matching tab name and gid from the public htmlview."""
    page = fetch_text(HTMLVIEW_URL)
    candidates = candidate_names(year, month)
    normalized = {normalize(name): name for name in candidates}

    # Match anchor-like fragments where gid and visible label are near each other.
    patterns = [
        r'href="([^"]*?gid=(\d+)[^"]*)"[^>]*>(.*?)</a>',
        r"href='([^']*?gid=(\d+)[^']*)'[^>]*>(.*?)</a>",
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, page, flags=re.I | re.S):
            gid = match.group(2)
            label = normalize(match.group(3))
            if label in normalized:
                return normalized[label], f"{HTMLVIEW_URL}?gid={gid}"

    # Google sometimes renders sheet-tab metadata in script/data payloads rather
    # than anchors. Search a bounded window around a candidate label for gid.
    for normalized_name, original_name in normalized.items():
        for raw_name in (original_name, html.escape(original_name)):
            for label_match in re.finditer(re.escape(raw_name), page, flags=re.I):
                start = max(0, label_match.start() - 800)
                end = min(len(page), label_match.end() + 800)
                window = page[start:end]
                gid_match = re.search(r"gid(?:=|%3D|\D{1,20})(\d+)", window, flags=re.I)
                if gid_match:
                    return original_name, f"{HTMLVIEW_URL}?gid={gid_match.group(1)}"

    return None


def gviz_url(sheet_name: str) -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq"
        f"?tqx=out%3Ahtml&sheet={quote(sheet_name, safe='')}"
    )


def looks_like_valid_sheet(body: str) -> bool:
    lower = body.lower()
    invalid_markers = (
        "invalid query",
        "unable to parse query string",
        "sheet does not exist",
        "requested document was not found",
        "not found",
    )
    return "<table" in lower and not any(marker in lower for marker in invalid_markers)


def discover_by_probe(year: int, month: int) -> tuple[str, str] | None:
    """Probe common worksheet names through the gviz HTML endpoint."""
    for name in candidate_names(year, month):
        url = gviz_url(name)
        try:
            body = fetch_text(url)
        except (HTTPError, URLError, TimeoutError):
            continue
        if looks_like_valid_sheet(body):
            return name, url
    return None


def write_metadata(now: datetime, sheet_name: str, url: str) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "month": f"{now.year}-{now.month:02d}",
        "sheetName": sheet_name,
        "url": url,
        "source": "github-action",
        "updatedAt": now.isoformat(timespec="seconds"),
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    now = datetime.now(TAIPEI)
    resolved: tuple[str, str] | None = None

    try:
        resolved = discover_gid_from_html(now.year, now.month)
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"htmlview discovery failed: {exc}", file=sys.stderr)

    if resolved is None:
        resolved = discover_by_probe(now.year, now.month)

    if resolved is None:
        print(
            f"Could not find a worksheet for {now.year}-{now.month:02d}. "
            "No metadata file was changed.",
            file=sys.stderr,
        )
        return 1

    sheet_name, url = resolved
    write_metadata(now, sheet_name, url)
    print(f"Resolved {now.year}-{now.month:02d} -> {sheet_name}: {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
