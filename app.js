const BLOG="https://pierreplumecoeur.blogspot.com/";
const DBKEY="valdivienne-v11-db";
let DB=loadDB();
const $=id=>document.getElementById(id);

function loadDB(){try{return JSON.parse(localStorage.getItem(DBKEY))||{articles:[],places:[],names:[],markers:[]}}catch(e){return{articles:[],places:[],names:[],markers:[]}}}
function save(){localStorage.setItem(DBKEY,JSON.stringify(DB));}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function strip(s){return String(s||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
window.closeModal=closeModal;

document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(b.dataset.view).classList.add("active");render()});

function render(){
 renderPlaces();renderNames();renderArticles();renderMap();renderSearch();
}
function card(title,meta,body,action){
 return `<article class="card"><h3>${esc(title)}</h3>${meta?`<div class="meta">${esc(meta)}</div>`:""}<div>${body}</div>${action||""}</article>`;
}
function renderPlaces(){
 const q=($("placeFilter")?.value||"").toLowerCase();
 const a=DB.places.filter(x=>(x.name+" "+(x.description||"")).toLowerCase().includes(q));
 $("placesList").innerHTML=a.length?a.map(x=>card(x.name,"Lieu",esc(x.description||""),`<button onclick='showPlace(${JSON.stringify(x.name)})'>Voir</button>`)).join(""):`<div class="empty">Aucun lieu enregistré.</div>`;
}
function renderNames(){
 const q=($("nameFilter")?.value||"").toLowerCase();
 const a=DB.names.filter(x=>(x.name+" "+(x.details||"")).toLowerCase().includes(q));
 $("namesList").innerHTML=a.length?a.map(x=>card(x.name,"Nom",esc(x.details||""),x.articles?.length?`<button onclick='showName(${JSON.stringify(x.name)})'>Articles</button>`:"")).join(""):`<div class="empty">Aucun nom enregistré.</div>`;
}
function renderArticles(){
 const q=($("articleFilter")?.value||"").toLowerCase();
 const a=DB.articles.filter(x=>(x.title+" "+strip(x.content)+" "+(x.labels||[]).join(" ")).toLowerCase().includes(q));
 $("articlesList").innerHTML=a.length?a.map((x,i)=>card(x.title,x.published||"",esc(x.excerpt||strip(x.content).slice(0,220)),`<button onclick="showArticle(${i})">Lire l'article</button>`)).join(""):`<div class="empty">Aucun article importé. Utilise la fonction de mise à jour lorsqu'elle sera configurée.</div>`;
}
function renderMap(){
 const a=DB.markers;
 $("mapList").innerHTML=a.length?a.map((x,i)=>card(x.name,`${x.lat?.toFixed?.(5)||x.lat}, ${x.lon?.toFixed?.(5)||x.lon}`,esc(x.description||""),`<button onclick="focusMarker(${i})">Afficher</button>`)).join(""):`<div class="empty">Aucun repère cartographique. Importe ta carte Google My Maps au format KML.</div>`;
}
function renderSearch(){
 const q=($("globalFilter")?.value||"").toLowerCase().trim();
 if(!q){$("searchResults").innerHTML='<div class="empty">Saisis un terme pour rechercher dans les lieux, noms et articles.</div>';return}
 const out=[];
 DB.places.filter(x=>(x.name+" "+x.description).toLowerCase().includes(q)).forEach(x=>out.push(card("📍 "+x.name,"Lieu",esc(x.description||""))));
 DB.names.filter(x=>(x.name+" "+x.details).toLowerCase().includes(q)).forEach(x=>out.push(card("🧬 "+x.name,"Nom",esc(x.details||""))));
 DB.articles.filter(x=>(x.title+" "+strip(x.content)).toLowerCase().includes(q)).slice(0,30).forEach((x,i)=>out.push(card("📚 "+x.title,x.published||"",esc(x.excerpt||strip(x.content).slice(0,180)),`<button onclick="showArticle(${DB.articles.indexOf(x)})">Lire</button>`)));
 $("searchResults").innerHTML=out.join("")||'<div class="empty">Aucun résultat.</div>';
}
function showArticle(i){const x=DB.articles[i];openModal(`<h2>${esc(x.title)}</h2><div class="meta">${esc(x.published||"")}</div><div class="articleBody">${x.content||esc(x.excerpt||"")}</div>${x.url?`<p><a href="${esc(x.url)}" target="_blank">Voir l'article original sur Blogger</a></p>`:""}`)}
function showPlace(n){const x=DB.places.find(p=>p.name===n)||{};openModal(`<h2>📍 ${esc(n)}</h2><p>${esc(x.description||"")}</p>`)}
function showName(n){const x=DB.names.find(p=>p.name===n)||{};openModal(`<h2>🧬 ${esc(n)}</h2><p>${esc(x.details||"")}</p>`)}
function focusMarker(i){const x=DB.markers[i];if(x)openModal(`<h2>📍 ${esc(x.name)}</h2><p>${esc(x.description||"")}</p><p><b>Latitude :</b> ${x.lat}<br><b>Longitude :</b> ${x.lon}</p><button onclick="navigate(${x.lat},${x.lon})">Itinéraire</button>`)}

function navigate(lat,lon){location.href=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`}
$("locate").onclick=()=>navigator.geolocation?.getCurrentPosition(p=>openModal(`<h2>📍 Votre position</h2><p>Latitude : ${p.coords.latitude.toFixed(6)}<br>Longitude : ${p.coords.longitude.toFixed(6)}</p>`),e=>openModal(`<h2>Géolocalisation</h2><p>Impossible d'obtenir votre position : ${esc(e.message)}</p>`));
$("importMap").onclick=()=>$("kmlInput").click();
$("kmlInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;const text=await f.text();importKML(text);};
function importKML(text){
 const xml=new DOMParser().parseFromString(text,"text/xml");
 const placemarks=[...xml.querySelectorAll("Placemark")];const markers=[];
 placemarks.forEach(p=>{const name=p.querySelector("name")?.textContent?.trim()||"Lieu sans nom";const desc=p.querySelector("description")?.textContent||"";const coord=p.querySelector("Point coordinates")?.textContent?.trim();if(coord){const [lon,lat]=coord.split(",").map(Number);if(Number.isFinite(lat)&&Number.isFinite(lon))markers.push({name,description:strip(desc),lat,lon})}});
 DB.markers=markers;save();render();alert(`${markers.length} repère(s) importé(s).`);
}
$("resetMap").onclick=()=>{if(confirm("Supprimer les repères cartographiques importés ?")){DB.markers=[];save();renderMap()}};
["placeFilter","nameFilter","articleFilter","globalFilter"].forEach(id=>$(id)?.addEventListener("input",render));

window.addEventListener("load",()=>{render();if(navigator.onLine)$("status").textContent="🟢 En ligne • données locales disponibles";else $("status").textContent="🔴 Hors connexion • mode local";});
window.addEventListener("online",()=>$("status").textContent="🟢 En ligne • données locales disponibles");
window.addEventListener("offline",()=>$("status").textContent="🔴 Hors connexion • mode local");

// Installation PWA: service worker actif seulement après premier chargement.
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
