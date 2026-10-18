#!/usr/bin/env python3
"""Incrementally index public metadata from 牧養主的羊 without changing other sources."""
import datetime as dt
import json
import pathlib
import time
import urllib.parse
import urllib.request

BASE = "https://prping.blogspot.com"
SOURCE = "牧養主的羊"
INDEX = pathlib.Path("data/bible-posts.json")
REPORT = pathlib.Path("data/prping-index-status.json")

def get_page(start, limit=100):
    query = urllib.parse.urlencode({
        "alt": "json", "start-index": start, "max-results": limit,
        "orderby": "published"
    })
    url = BASE + "/feeds/posts/summary?" + query
    req = urllib.request.Request(url, headers={"User-Agent": "Bible reflections metadata index/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as response:
                return json.load(response)["feed"]
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)

def extract(feed):
    result = []
    for entry in feed.get("entry", []):
        link = next((x.get("href") for x in entry.get("link", []) if x.get("rel") == "alternate"), None)
        if not link or not link.startswith(BASE + "/"):
            continue
        result.append({
            "source": SOURCE,
            "title": entry["title"]["$t"],
            "url": link,
            "date": entry["published"]["$t"][:10]
        })
    return result

def main():
    original = json.loads(INDEX.read_text(encoding="utf-8"))
    previous = {p["url"]: p for p in original["posts"] if p["source"] == SOURCE}
    found = {}
    first = get_page(1)
    total = int(first.get("openSearch$totalResults", {}).get("$t", 0))
    if not total:
        raise RuntimeError("Blogger returned no public posts; keeping existing index")
    for start in range(1, total + 1, 100):
        feed = first if start == 1 else get_page(start)
        posts = extract(feed)
        if not posts:
            raise RuntimeError(f"Empty Blogger page at {start}; keeping existing index")
        for post in posts:
            if post["url"] in found:
                raise RuntimeError(f"Repeated Blogger page at {start}; keeping existing index")
            found[post["url"]] = post
        print(f"牧養主的羊: {len(found)}/{total}", flush=True)
        time.sleep(.35)
    # Keep all previously indexed posts even if a later feed stops exposing them.
    merged = dict(previous)
    merged.update(found)
    if len(found) < total:
        raise RuntimeError(f"Feed incomplete: {len(found)}/{total}; keeping existing index")
    posts = [p for p in original["posts"] if p["source"] != SOURCE]
    posts.extend(sorted(merged.values(), key=lambda p: (p["date"], p["url"]), reverse=True))
    updated = dict(original)
    updated["posts"] = posts
    updated["count"] = len(posts)
    sources = [s for s in original.get("sources", []) if s[0] != SOURCE]
    sources.append([SOURCE, BASE])
    updated["sources"] = sources
    INDEX.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps({
        "checked_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": SOURCE, "feed_total": total, "fetched": len(found),
        "indexed": len(merged), "new": len(set(merged)-set(previous)),
        "all_sources_total": len(posts)
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
