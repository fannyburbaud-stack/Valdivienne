const $=id=>document.getElementById(id);
let DB=JSON.parse(localStorage.getItem("v61db")||"[]");
let F=JSON.parse(localStorage.getItem("v61fav")||"[]");
function show(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0);if(id==="photos")photos();if(id==="collections")collections();if(id==="places")places();if(id==="timeline")timeline();if(id==="genealogy")gene();if(id==="favorites")favorites();if(id==="search")search()}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function strip(s){return String(s||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function save(){localStorage.setItem("v61db",JSON.stringify(DB))}
function imgList(html){let d=document.createElement("div");d.innerHTML=html||"";let a=[...d.querySelectorAll("img")].map(i=>i.getAttribute("data-src")||i.getAttribute("src")||i.getAttribute("data-original")||"");[...d.querySelectorAll("img[srcset],source[srcset]")].forEach(i=>(i.getAttribute("srcset")||"").split(",").forEach(v=>a.push(v.trim().split(/\s+/)[0])));[...d.querySelectorAll("a[href]")].forEach(link=>{let u=link.href||"";if(/\.(jpe?g|png|gif|webp)(\?|$)/i.test(u))a.push(u)});return [...new Set(a.filter(u=>/^https?:\/\//i.test(u)))].slice(0,V6CONFIG.imageMaxPerArticle)}
function bestImage(a){return a.imageUrls?.[0]||""}
function fav(id){F=F.includes(id)?F.filter(x=>x!==id):F.concat(id);localStorage.setItem("v61fav",JSON.stringify(F));render()}
function card(x){let im=bestImage(x);return `<article class="tile"><div class="cover">${im?`<img loading="lazy" src="${esc(im)}" alt="">`:x.icon||"📜"}</div><span class="badge">${esc(x.collection||"Archives Blogger")}</span><h3>${esc(x.title)}</h3><p>${esc(x.description||strip(x.content).slice(0,190))}</p><small>${esc(x.place||"")} ${x.year?"• "+x.year:""}</small><div class="actions"><button onclick="detail('${x.id}')">Ouvrir</button><button class="secondary" onclick="fav('${x.id}')">${F.includes(x.id)?"★":"☆"}</button></div></article>`}
function detail(id){let x=DB.find(a=>a.id===id);let first=bestImage(x);$("detail").innerHTML=`${first?`<div class="detail-cover"><img src="${esc(first)}"></div>`:""}<span class="badge">${esc(x.collection||"Archives Blogger")}</span><h2>${esc(x.title)}</h2><p>${esc(x.place||"")} ${x.year?"• "+x.year:""}</p><div>${x.content||`<p>${esc(x.description||"")}</p>`}</div><h3>Photographies de l'article (${x.imageUrls?.length||0})</h3><div class="gallery">${(x.imageUrls||[]).map(u=>`<img loading="lazy" src="${esc(u)}" onclick="window.open('${esc(u)}','_blank')">`).join("")||"<p>Aucune image détectée.</p>"}</div><div class="actions"><button onclick="fav('${x.id}')">${F.includes(x.id)?"★ Retirer des favoris":"☆ Ajouter aux favoris"}</button>${x.url?`<button class="secondary" onclick="location.href='${esc(x.url)}'">Article original</button>`:""}</div>`;$("modal").classList.add("open")}
function closeModal(){$("modal").classList.remove("open")}
function search(){let q=($("q")?.value||"").toLowerCase(),a=DB.filter(x=>[x.title,x.place,x.period,x.collection,x.description,x.content,...(x.labels||[])].join(" ").toLowerCase().includes(q));$("results").innerHTML=a.map(card).join("")||"<div class='panel'>Aucun résultat.</div>"}
function gene(){let q=($("gq")?.value||"").toLowerCase();$("geneGrid").innerHTML=DB.filter(x=>[x.title,x.place,x.content,x.description,...(x.labels||[])].join(" ").toLowerCase().includes(q)).map(card).join("")||"<div class='panel'>Aucun résultat.</div>"}
function photos(){let out=[];DB.forEach(x=>(x.imageUrls||[]).forEach((u,i)=>out.push({u,x,i})));$("photoGrid").innerHTML=out.map(o=>`<div class="photo" onclick="detail('${o.x.id}')"><img loading="lazy" src="${esc(o.u)}"><div>${esc(o.x.title)}</div></div>`).join("")||"<div class='panel'>Synchronisez le blog pour récupérer les images.</div>"}
function collections(){let c=[...new Set(DB.map(x=>x.collection||"Archives Blogger"))];$("collectionsGrid").innerHTML=c.map(v=>`<article class="tile"><div class="cover">📚</div><h3>${esc(v)}</h3><p>${DB.filter(x=>(x.collection||"Archives Blogger")===v).length} article(s)</p></article>`).join("")}
function places(){let p=[...new Set(DB.map(x=>x.place).filter(Boolean))];$("placeGrid").innerHTML=p.map(v=>`<article class="tile"><div class="cover">📍</div><h3>${esc(v)}</h3><p>${DB.filter(x=>x.place===v).length} document(s)</p></article>`).join("")||"<div class='panel'>Les lieux seront enrichis à partir des données disponibles dans les articles.</div>"}
function timeline(){let a=[...DB].filter(x=>x.year).sort((a,b)=>a.year-b.year);$("timelineGrid").innerHTML=a.map(x=>`<article class="event"><div class="year">${x.year}</div><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p><button onclick="detail('${x.id}')">Ouvrir</button></article>`).join("")||"<div class='panel'>Aucune date détectée.</div>"}
function favorites(){$("favGrid").innerHTML=DB.filter(x=>F.includes(x.id)).map(card).join("")||"<div class='panel'>Aucun favori.</div>"}
function render(){$("n").textContent=DB.length;$("ni").textContent=DB.reduce((n,x)=>n+(x.imageUrls?.length||0),0);$("nc").textContent=new Set(DB.map(x=>x.collection||"Archives Blogger")).size;$("nf").textContent=F.length;$("homeCards").innerHTML=DB.slice(0,8).map(card).join("")||"<div class='panel'><p>Aucune donnée importée.</p><button onclick=\"syncNow()\">Importer le blog</button></div>";search();gene();photos();collections();places();timeline();favorites()}
function diagnostic(msg){
  const d=$("diag"); if(d){d.textContent += (d.textContent?"
":"")+msg;}
}
function clearDiagnostic(){const d=$("diag");if(d)d.textContent="";}
function jsonp(url,timeoutMs=20000){
  return new Promise((resolve,reject)=>{
    const cb="v611cb_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const s=document.createElement("script");
    let done=false;
    const timer=setTimeout(()=>finish(new Error("Délai d'attente dépassé ("+timeoutMs+" ms).")),timeoutMs);
    function finish(err,data){
      if(done)return;done=true;clearTimeout(timer);
      try{delete window[cb]}catch(e){window[cb]=undefined}
      s.remove();
      err?reject(err):resolve(data);
    }
    window[cb]=data=>finish(null,data);
    s.onerror=()=>finish(new Error("Le navigateur n'a pas pu charger le flux Blogger."));
    s.src=url+(url.includes("?")?"&":"?")+"alt=json-in-script&callback="+encodeURIComponent(cb)+"&max-results="+V6CONFIG.maxResults+"&orderby=published";
    diagnostic("URL testée : "+s.src);
    document.body.appendChild(s);
  });
}
async function testBlogger(){
  clearDiagnostic();
  const st=$("syncStatus"); if(st)st.textContent="Test de connexion à Blogger…";
  diagnostic("Blog : "+V6CONFIG.blog);
  diagnostic("Navigateur : "+navigator.userAgent);
  try{
    const data=await jsonp(V6CONFIG.feed,15000);
    const entries=data?.feed?.entry||[];
    const count=Array.isArray(entries)?entries.length:(entries?1:0);
    diagnostic("Réponse Blogger reçue.");
    diagnostic("Articles renvoyés : "+count);
    diagnostic("Titre du flux : "+(data?.feed?.title?.$t||"(inconnu)"));
    if(st)st.textContent="Blogger répond correctement. "+count+" article(s) dans ce lot.";
  }catch(e){
    diagnostic("ERREUR : "+(e?.message||String(e)));
    diagnostic("Conseil : ouvre l’URL du flux dans un nouvel onglet pour vérifier qu’elle est publique.");
    if(st)st.textContent="Test échoué — regarde le diagnostic ci-dessous.";
  }
}
function extract(entry){
  let html=entry.content?.$t||"";
  let imgs=imgList(html);
  let cats=(entry.category||[]).map(c=>c.term).filter(Boolean);
  let published=entry.published?.$t||"";
  return{id:"blog-"+(entry.id?.$t||"").split(".").pop(),title:entry.title?.$t||"Sans titre",content:html,description:strip(html).slice(0,240),url:(entry.link||[]).find(l=>l.rel==="alternate")?.href||"",published,year:published?new Date(published).getFullYear():null,labels:cats,collection:cats[0]||"Archives Blogger",place:"",imageUrls:imgs}
}
async function syncNow(){
  clearDiagnostic();
  const st=$("syncStatus"),mini=$("syncMini");
  if(st)st.textContent="Synchronisation en cours…";
  if(mini)mini.textContent=" • chargement";
  diagnostic("Début de synchronisation V6.1.1");
  try{
    let all=[],start=1;
    for(let page=0;page<V6CONFIG.maxPages;page++){
      const url=V6CONFIG.feed+(V6CONFIG.feed.includes("?")?"&":"?")+"start-index="+start;
      const data=await jsonp(url,25000);
      let entries=data?.feed?.entry||[];
      if(!Array.isArray(entries))entries=entries?[entries]:[];
      diagnostic("Lot "+(page+1)+" : "+entries.length+" article(s).");
      if(!entries.length)break;
      all.push(...entries);
      if(entries.length<V6CONFIG.maxResults)break;
      start+=entries.length;
    }
    const fresh=all.filter(Boolean).map(extract);
    const old=new Map(DB.map(x=>[x.id,x]));
    fresh.forEach(x=>old.set(x.id,x));
    DB=[...old.values()];
    save();render();
    const ni=DB.reduce((n,x)=>n+(x.imageUrls?.length||0),0);
    diagnostic("Synchronisation terminée.");
    diagnostic("Articles importés dans la base : "+DB.length);
    diagnostic("Images détectées : "+ni);
    if(st)st.textContent=`Synchronisation terminée : ${fresh.length} articles lus, ${ni} images détectées.`;
    if(mini)mini.textContent=" • terminé";
  }catch(e){
    diagnostic("ERREUR DE SYNCHRONISATION : "+(e?.message||String(e)));
    diagnostic("Aucune donnée n’a été supprimée de la base locale.");
    if(st)st.textContent="Erreur — ouvre « Tester Blogger » puis lis le diagnostic.";
    if(mini)mini.textContent=" • erreur";
  }
}
$("q").addEventListener("input",search);$("gq").addEventListener("input",gene);
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();