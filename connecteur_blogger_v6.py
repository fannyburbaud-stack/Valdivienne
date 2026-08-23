import argparse,json,re,urllib.parse,urllib.request
def get(u):
    with urllib.request.urlopen(u,timeout=60) as r:return json.load(r)
def items(base,p):
    out=[];token=None
    while True:
        q=dict(p)
        if token:q["pageToken"]=token
        d=get(base+"?"+urllib.parse.urlencode(q));out+=d.get("items",[]);token=d.get("nextPageToken")
        if not token:return out
ap=argparse.ArgumentParser();ap.add_argument("--blog",default="https://pierreplumecoeur.blogspot.com/");ap.add_argument("--api-key",required=True);ap.add_argument("--out",default="blogger-export-v6.json");a=ap.parse_args()
bid=get("https://www.googleapis.com/blogger/v3/blogs/byurl?"+urllib.parse.urlencode({"url":a.blog,"key":a.api_key}))["id"];p={"key":a.api_key,"maxResults":50}
posts=items(f"https://www.googleapis.com/blogger/v3/blogs/{bid}/posts",dict(p,fetchBodies="true",fetchImages="true",status="live"));pages=items(f"https://www.googleapis.com/blogger/v3/blogs/{bid}/pages",dict(p,fetchBodies="true",status="live"))
for x in posts+pages:x["extractedImageUrls"]=list(dict.fromkeys(re.findall(r'<img[^>]+src=["\']([^"\']+)',x.get("content",""),re.I)))
json.dump({"blogId":bid,"posts":posts,"pages":pages},open(a.out,"w",encoding="utf-8"),ensure_ascii=False,indent=2);print(len(posts),"articles +",len(pages),"pages")