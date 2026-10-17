#!/usr/bin/env python3
"""Index public Blogger post metadata; original articles remain at their authors' sites."""
import json,re,time,urllib.request,urllib.parse,pathlib,datetime
SOURCES=[("石牌・天母每日讀經心得","https://tjcshipaiandtianmu.blogspot.com"),("如鷹展翅","https://isaiahkao.blogspot.com")]
OUT=pathlib.Path("data/bible-posts.json")
def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (Bible reflection indexer)"})
    with urllib.request.urlopen(req,timeout=35) as res:return json.load(res)
def collect(name,base):
    posts=[];seen=set();start=1;complete=False;reported_total=None
    for page in range(300):
        q=urllib.parse.urlencode({"alt":"json","start-index":start,"max-results":150})
        try:data=fetch(base+"/feeds/posts/default?"+q)
        except Exception as exc:
            print("ERROR",name,start,str(exc));break
        feed=data.get("feed",{})\n        if reported_total is None:\n            try:reported_total=int(feed.get("openSearch$totalResults",{}).get("$t"))\n            except (TypeError,ValueError,AttributeError):pass\n        entries=feed.get("entry",[])
        if not entries:\n            complete=True\n            break
        new=0
        for e in entries:
            link=next((x.get("href") for x in e.get("link",[]) if x.get("rel")=="alternate"),None)
            if not link or link in seen:continue
            seen.add(link);new+=1
            posts.append({"source":name,"title":e.get("title",{}).get("$t",""),"url":link,"date":e.get("published",{}).get("$t","")[:10]})
        print(name,"page",page+1,"entries",len(entries),"total",len(posts))
        if new==0:\n            raise RuntimeError(f"{name}: repeated page at start-index {start}; refusing partial archive")\n        if len(entries)<150:\n            complete=True\n            break
        start+=len(entries);time.sleep(.35)
    if not complete or (reported_total is not None and len(posts)<reported_total):\n        raise RuntimeError(f"{name}: incomplete archive, got {len(posts)} of {reported_total}; refusing partial update")\n    return posts
def main():
    all_posts=[];failures=[]
    for name,base in SOURCES:
        p=collect(name,base)
        if not p:failures.append(name)
        all_posts.extend(p)
    if failures:raise RuntimeError("Source returned no articles: "+", ".join(failures))
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({"sources":SOURCES,"count":len(all_posts),"posts":all_posts},ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print("Wrote",len(all_posts),"posts to",OUT)
if __name__=="__main__":main()
