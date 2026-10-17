#!/usr/bin/env python3
"""Audit Blogger post sitemaps by publication month. Does not overwrite article index."""
import collections,datetime,json,re,urllib.request,xml.etree.ElementTree as ET,pathlib
BASE="https://tjcshipaiandtianmu.blogspot.com"
OUT=pathlib.Path("data/shipai-monthly-audit.json")
def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=45) as r:return r.read()
def month(url):
 m=re.search(r"/(20\\d{2})/(0[1-9]|1[0-2])/",url)
 return "-".join(m.groups()) if m else None
def main():
 existing=json.loads(pathlib.Path("data/bible-posts.json").read_text(encoding="utf-8"))["posts"]
 indexed={p["url"] for p in existing if p.get("source")=="石牌・天母每日讀經心得"}
 pending=[BASE+"/sitemap.xml"];seen=set();urls=set();errors=[]
 while pending and len(seen)<1000:
  url=pending.pop(0)
  if url in seen:continue
  seen.add(url)
  try:
   root=ET.fromstring(fetch(url))
   locs=[e.text.strip() for e in root.iter() if e.tag.endswith("}loc") and e.text]
   if root.tag.endswith("sitemapindex"):
    pending.extend(u for u in locs if "sitemap" in u and "tjcshipaiandtianmu.blogspot.com" in u)
   elif root.tag.endswith("urlset"):
    urls.update(u for u in locs if "tjcshipaiandtianmu.blogspot.com" in u and month(u) and u.endswith(".html"))
   else:errors.append({"url":url,"error":"unexpected sitemap type"})
  except Exception as e:errors.append({"url":url,"error":str(e)})
 if pending:errors.append({"error":"sitemap traversal limit"})
 months=collections.defaultdict(lambda:{"sitemap":0,"indexed":0,"missing":0})
 for u in urls:months[month(u)]["sitemap"]+=1
 for u in indexed:months[month(u) or "unknown"]["indexed"]+=1
 missing=sorted(urls-indexed)
 for u in missing:months[month(u)]["missing"]+=1
 report={"checked_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"sitemap_count":len(urls),"indexed_count":len(indexed),"missing_count":len(missing),"sitemap_pages":len(seen),"errors":errors,"monthly":dict(sorted(months.items())),"missing_urls":missing}
 OUT.parent.mkdir(exist_ok=True)
 OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
 print("Found",len(urls),"sitemap URLs;",len(indexed),"indexed;",len(missing),"missing")
 if errors or not urls:raise RuntimeError("Sitemap audit incomplete. See report errors.")
if __name__=="__main__":main()
