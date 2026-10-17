"""Resumable public metadata collector. Never stores article bodies."""
import hashlib, json, os, pathlib, time, urllib.request, urllib.parse
import xml.etree.ElementTree as ET

BASE = 'https://tjcshipaiandtianmu.blogspot.com'
SOURCE = '石牌・天母每日讀經心得'
CACHE = pathlib.Path(os.environ.get('BLOGGER_CACHE_DIR', '.cache/blogger'))

def request(url, kind):
    CACHE.mkdir(parents=True, exist_ok=True)
    target = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if target.exists():
        return json.loads(target.read_text(encoding='utf-8'))
    for attempt in range(4):
        try:
            time.sleep(.4 + attempt)
            req = urllib.request.Request(url, headers={'User-Agent': 'Church metadata archive audit/1.0'})
            with urllib.request.urlopen(req, timeout=45) as response:
                raw = response.read()
            if kind == 'feed':
                feed = json.loads(raw)['feed']
                value = {'total': int(feed['openSearch$totalResults']['$t']), 'posts': []}
                for entry in feed.get('entry', []):
                    link = next(x['href'] for x in entry['link'] if x['rel'] == 'alternate')
                    value['posts'].append({'source': SOURCE, 'title': entry['title']['$t'], 'url': link, 'date': entry['published']['$t'][:10]})
            else:
                root = ET.fromstring(raw)
                value = {'type': root.tag.split('}')[-1], 'urls': [e.text.strip() for e in root.iter() if e.tag.split('}')[-1] == 'loc' and e.text]}
            target.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
            return value
        except Exception:
            if attempt == 3:
                raise

def collect():
    posts = {}
    start, batch, total = 1, 100, None
    while True:
        query = urllib.parse.urlencode({'alt': 'json', 'start-index': start, 'max-results': batch, 'orderby': 'published'})
        try:
            page = request(BASE + '/feeds/posts/summary?' + query, 'feed')
            if total is None:
                total = page['total']
            if page['total'] != total:
                raise RuntimeError('Feed changed during audit; use a fresh cache')
            entries = page['posts']
            new = {p['url']: p for p in entries if p['url'] not in posts}
            if not entries or len(new) != len(entries):
                raise RuntimeError('Empty or repeated feed page')
        except Exception:
            if batch > 10:
                batch = max(10, batch // 2)
                continue
            # Blogger may truncate deep start-index pagination. Resume with a
            # publication-date window, overlapping a day and deduplicating URLs.
            if not posts:
                raise
            import datetime
            boundary = min(p['date'] for p in posts.values())
            end = (datetime.date.fromisoformat(boundary) + datetime.timedelta(days=1)).isoformat()
            q = urllib.parse.urlencode({'alt':'json','max-results':100,'orderby':'published','published-max':end+'T00:00:00+08:00'})
            tail = request(BASE + '/feeds/posts/summary?' + q, 'feed')
            recovered = {p['url']:p for p in tail['posts'] if p['url'] not in posts}
            if not recovered:
                public_urls, _ = sitemap()
                if set(posts) == public_urls:
                    break
                raise RuntimeError('No progress using date-window recovery')
            posts.update(recovered)
            print('Date recovery', boundary, len(recovered), flush=True)
            start = len(posts) + 1
            if len(posts) == total:
                break
            continue
        posts.update(new)
        print('Feed', start, len(entries), 'collected', len(posts), '/', total, flush=True)
        start += len(entries)
        if start > total:
            break
    if len(posts) != total and set(posts) != sitemap()[0]:
        raise RuntimeError('Feed count mismatch without sitemap verification')
    return posts, total

def sitemap():
    pending, seen, urls = [BASE + '/sitemap.xml'], set(), set()
    while pending:
        url = pending.pop(0)
        if url in seen:
            continue
        if len(seen) >= 1000 or not url.startswith(BASE + '/'):
            raise RuntimeError('Invalid sitemap traversal')
        seen.add(url)
        page = request(url, 'xml')
        if page['type'] == 'sitemapindex':
            pending.extend(page['urls'])
        elif page['type'] == 'urlset':
            urls.update(u for u in page['urls'] if u.startswith(BASE + '/') and u.endswith('.html'))
        else:
            raise RuntimeError('Unexpected sitemap type')
    if not urls:
        raise RuntimeError('Empty sitemap')
    return urls, len(seen)
