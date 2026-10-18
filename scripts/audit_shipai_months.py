"""Cross-check every public URL before updating the index; offline reruns use cache."""
import datetime, json, pathlib, subprocess, time
from blogger_archive import collect, sitemap, SOURCE

INDEX = pathlib.Path('data/bible-posts.json')

def write(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for attempt in range(6):
        try:
            tmp.replace(path)
            break
        except PermissionError:
            if attempt == 5: raise
            time.sleep(1)

def main(update=False):
    original = json.loads(INDEX.read_text(encoding='utf-8'))
    old = {p['url']: p for p in original['posts'] if p['source'] == SOURCE}
    report = {'checked_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'errors': []}
    try:
        found, total = collect()
        urls, pages = sitemap()
        missing_feed = sorted(urls - found.keys())
        missing_sitemap = sorted(found.keys() - urls)
        lost = sorted(old.keys() - found.keys())
        complete = not (missing_feed or missing_sitemap or lost)
        imported = found if complete and update else old
        all_months = sorted({p['date'][:7] for p in found.values()} | {p['date'][:7] for p in old.values()})
        months = {}
        # Include empty months between the earliest and latest publication.
        y,m = map(int, all_months[0].split('-'))
        while f'{y:04}-{m:02}' <= all_months[-1]:
            key = f'{y:04}-{m:02}'
            fp = {u for u,p in found.items() if p['date'][:7] == key}
            ip = {u for u,p in imported.items() if p['date'][:7] == key}
            months[key] = {'discovered': len(fp), 'imported': len(ip), 'added': len((fp & ip) - old.keys()), 'missing': len(fp-ip), 'failed': 0, 'missing_urls': sorted(fp-ip)}
            y,m = (y+1,1) if m == 12 else (y,m+1)
        years = {}
        for key, row in months.items():
            year = years.setdefault(key[:4], dict.fromkeys(['discovered','imported','added','missing','failed'],0))
            for k in year: year[k] += row[k]
        report.update({'complete': complete, 'feed_total': total, 'verified_public_total': len(found), 'declared_total_difference': total-len(found), 'source_total_verified': total == len(found), 'sitemap_count': len(urls), 'sitemap_pages': pages, 'original_count': len(old), 'indexed_count': len(imported), 'added_count': len(imported.keys()-old.keys()), 'missing_count': len(found.keys()-imported.keys()), 'missing_urls': sorted(found.keys()-imported.keys()), 'sitemap_only_urls': missing_feed, 'feed_only_urls': missing_sitemap, 'lost_existing_urls': lost, 'monthly': months, 'yearly': years})
        if not complete:
            raise RuntimeError('URL sets differ; index left unchanged')
        candidate = dict(original)
        candidate['posts'] = [p for p in original['posts'] if p['source'] != SOURCE] + sorted(found.values(), key=lambda p:(p['date'],p['url']), reverse=True)
        candidate['count'] = len(candidate['posts'])
        write('data/shipai-discovered.json', {'posts': sorted(found.values(),key=lambda p:p['url'])})
        result = subprocess.run(['node','scripts/check_bible.cjs'], capture_output=True, text=True, encoding='utf-8')
        if result.returncode:
            raise RuntimeError('Bible validator failed: ' + (result.stderr or result.stdout)[-4000:])
        report['chapter_review'] = json.loads(result.stdout)
        report['chapter_review_count'] = len(report['chapter_review'])
        if update:
            write(INDEX, candidate)
    except Exception as exc:
        report['complete'] = False
        report['errors'].append(str(exc))
        write('data/shipai-monthly-audit.json', report)
        raise
    write('data/shipai-monthly-audit.json', report)
    print(json.dumps({k:v for k,v in report.items() if k not in ['monthly','chapter_review']},ensure_ascii=False))

if __name__ == '__main__':
    main()
