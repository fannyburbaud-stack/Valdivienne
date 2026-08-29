import json,re,html,os
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BLOG="https://pierreplumecoeur.blogspot.com/"
PLACES_URL=BLOG+"p/index-lieux.html"
NAMES_URL=BLOG+"p/index-noms-de-famille.html"
FEED=BLOG+"feeds/posts/default?alt=json&max-results=500"

S=requests.Session()
S.headers["User-Agent"]="Valdivienne-Museum-Sync/1.0"

def text(s): return re.sub(r"\s+"," ",BeautifulSoup(s or "","html.parser").get_text(" ",strip=True))

def image_from_html(raw):
    soup=BeautifulSoup(raw or "","html.parser")
    img=soup.find("img")
    return img.get("src") or img.get("data-src") if img else ""

def feed():
    r=S.get(FEED,timeout=40);r.raise_for_status();d=r.json()
    out=[]
    for e in d.get("feed",{}).get("entry",[]):
        raw=e.get("content",{}).get("$t","")
        cats=[c.get("term","") for c in e.get("category",[])]
        links=e.get("link",[])
        url=next((x.get("href") for x in links if x.get("rel")=="alternate"),"")
        out.append({"id":e.get("id",{}).get("$t","").split(".")[-1],
                    "title":e.get("title",{}).get("$t",""),
                    "published":e.get("published",{}).get("$t","")[:10],
                    "url":url,"content":raw,"excerpt":text(raw)[:320],
                    "labels":cats,"image":image_from_html(raw)})
    return out

def index(url,kind):
    r=S.get(url,timeout=40);r.raise_for_status();s=BeautifulSoup(r.text,"html.parser")
    names=[]
    # Index pages are structured as headings followed by links. Collect visible headings.
    for h in s.find_all(["h2","h3","h4"]):
        n=h.get_text(" ",strip=True)
        if n and len(n)<120:names.append({"name":n,"count":0})
    # Also collect groups from bold/plain text when headings are absent.
    seen=set();out=[]
    for x in names:
        k=x["name"].lower()
        if k not in seen:seen.add(k);out.append(x)
    return out

def main():
    arts=feed()
    places=index(PLACES_URL,"place")
    names=index(NAMES_URL,"name")
    # Try to associate places using index headings / article labels/text.
    place_names=[p["name"] for p in places]
    for a in arts:
        blob=(a["title"]+" "+a["excerpt"]+" "+" ".join(a["labels"])).lower()
        hit=next((p for p in place_names if p.lower() in blob),None)
        if hit:a["place"]=hit
    data={"version":"1.0","updated":__import__("datetime").date.today().isoformat(),
          "articles":arts,"places":places,"names":names,
          "markers":[{"name":"Valdivienne","lat":46.4941513378445,"lng":0.6059439265576438,"category":"Territoire"}]}
    os.makedirs("data",exist_ok=True)
    with open("data/data.json","w",encoding="utf-8") as f:json.dump(data,f,ensure_ascii=False)
if __name__=="__main__":main()
