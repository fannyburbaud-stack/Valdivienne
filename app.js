const state={articles:[],places:[],names:[],markers:[],online:true,map:null,layer:null,user:null};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DATA="data/data.json", KML="data/map.kml";

async function getJSON(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error(url+" "+r.status);return r.json()}
async function boot(){
  try{const d=await getJSON(DATA);state.articles=d.articles||[];state.places=d.places||[];state.names=d.names||[];state.markers=d.markers||[];}catch(e){console.warn(e)}
  setupNav(); setupMap(); renderAll(); setupPWA();
}
function setupNav(){document.querySelectorAll(".bottomnav button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".bottomnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");if(b.dataset.page==="mapPage")setTimeout(()=>state.map?.invalidateSize(),100)})}

async function importKML(file){
  try{
    let text;
    if(file.name.toLowerCase().endsWith(".kmz")){
      notice("Les KMZ nécessitent une conversion en KML. Exporte la carte en KML depuis My Maps ou décompresse le KMZ.");
      return;
    }
    text=await file.text();
    const xml=new DOMParser().parseFromString(text,"application/xml");
    const bad=xml.querySelector("parsererror"); if(bad)throw Error("KML illisible");
    const placemarks=[...xml.getElementsByTagNameNS("*","Placemark")];
    const parsed=[];
    placemarks.forEach((pm,i)=>{
      const name=pm.getElementsByTagNameNS("*","name")[0]?.textContent?.trim()||"Lieu "+(i+1);
      const desc=pm.getElementsByTagNameNS("*","description")[0]?.textContent||"";
      const point=pm.getElementsByTagNameNS("*","Point")[0];
      const coords=point?.getElementsByTagNameNS("*","coordinates")[0]?.textContent?.trim();
      if(coords){
        const [lng,lat]=coords.split(",").map(Number);
        if(Number.isFinite(lat)&&Number.isFinite(lng))parsed.push({name,lat,lng,description:stripHTML(desc)});
      }
      const ls=pm.getElementsByTagNameNS("*","LineString");
      [...ls].forEach(line=>{
        const c=line.getElementsByTagNameNS("*","coordinates")[0]?.textContent?.trim();
        if(c){const first=c.split(/\s+/)[0].split(",").map(Number);if(first.length>=2&&Number.isFinite(first[0])&&Number.isFinite(first[1]))parsed.push({name,lat:first[1],lng:first[0],description:stripHTML(desc),category:"Itinéraire"});}
      });
    });
    if(!parsed.length)throw Error("Aucun repère ponctuel trouvé dans ce KML.");
    state.markers=parsed;localStorage.setItem("offlineMarkers",JSON.stringify(parsed));drawMarkers();
    notice(parsed.length+" repères importés depuis My Maps. Ils sont maintenant disponibles hors connexion.");
  }catch(e){notice("Erreur KML : "+e.message)}
}
function stripHTML(s){const d=document.createElement("div");d.innerHTML=s||"";return d.textContent||d.innerText||""}

function setupMap(){
  state.map=L.map("map",{zoomControl:true,preferCanvas:true}).setView([46.494151,0.605944],11);
  state.layer=L.layerGroup().addTo(state.map);
  const saved=localStorage.getItem("offlineMarkers");if(saved&&!state.markers.length)try{state.markers=JSON.parse(saved)}catch(e){}
  drawMarkers();
  $("#locateBtn").onclick=locate;
  $("#mapSearch").oninput=e=>searchMap(e.target.value);
  $("#offlineBtn").onclick=()=>{state.online=false;notice("Mode hors connexion : les données locales restent disponibles. Le fond détaillé peut être absent si les tuiles n'ont pas été mises en cache.");};
  $("#kmlInput").onchange=e=>{if(e.target.files[0])importKML(e.target.files[0])};
  $("#onlineMapBtn").onclick=()=>{state.online=true;notice("Mode en ligne : chargement du fond cartographique.");addOnlineTiles()};
  addOnlineTiles();
}
function addOnlineTiles(){
  if(!state.map)return;
  if(state.tiles)state.map.removeLayer(state.tiles);
  state.tiles=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(state.map);
}
function drawMarkers(){
  state.layer.clearLayers();
  state.markers.forEach((m,i)=>{
    if(typeof m.lat!=="number"||typeof m.lng!=="number")return;
    const marker=L.marker([m.lat,m.lng]).addTo(state.layer);
    marker.bindTooltip(esc(m.name||"Lieu"),{direction:"top"});
    marker.on("click",()=>openMarker(m));
  });
  localStorage.setItem("offlineMarkers",JSON.stringify(state.markers));
}
function openMarker(m){
  const related=state.articles.filter(a=>[a.title,a.url,...(a.labels||[]),a.place].join(" ").toLowerCase().includes(String(m.name||"").toLowerCase())).slice(0,15);
  $("#sheetContent").innerHTML=`<h2>${esc(m.name||"Lieu")}</h2><p>${esc(m.description||"")}</p>${m.category?`<span class="tag">${esc(m.category)}</span>`:""}${related.length?`<h3>Articles associés</h3>${related.map(articleMini).join("")}`:"<p>Aucun article associé automatiquement.</p>"}`;
  $("#sheet").classList.add("open");
}
function locate(){if(!navigator.geolocation){notice("La géolocalisation n'est pas disponible.");return}navigator.geolocation.getCurrentPosition(p=>{const c=[p.coords.latitude,p.coords.longitude];state.map.setView(c,15);L.circleMarker(c,{radius:9}).addTo(state.layer).bindPopup("Vous êtes ici").openPopup();notice("Position trouvée.");},e=>notice("Impossible d'obtenir votre position : "+e.message),{enableHighAccuracy:true,timeout:10000})}
function searchMap(q){q=q.toLowerCase().trim();state.markers.forEach((m,i)=>{if(!q)return; if(String(m.name).toLowerCase().includes(q)){state.map.setView([m.lat,m.lng],15);openMarker(m)}})}
function renderAll(){renderPlaces();renderNames();renderArticles();$("#closeSheet").onclick=()=>$("#sheet").classList.remove("open");$("#sheet").onclick=e=>{if(e.target.id==="sheet")$("#sheet").classList.remove("open")}}
function articleMini(a){return `<div class="item" onclick="openArticle('${esc(a.id)}')"><div><h3>${esc(a.title)}</h3><p>${esc(a.excerpt||"")}</p></div></div>`}
function articleCard(a){return `<article class="item"><img class="thumb" src="${esc(a.image||"")}" onerror="this.style.display='none'"><div><h3>${esc(a.title)}</h3><p>${esc(a.excerpt||"")}</p>${(a.labels||[]).slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join(" ")}<div><button onclick="openArticle('${esc(a.id)}')">Lire</button></div></div></article>`}
function renderPlaces(){let el=$("#places");el.innerHTML=state.places.length?state.places.map(p=>`<article class="item"><div><h3>${esc(p.name)}</h3><p>${p.count||0} article(s)</p><button onclick="focusPlace('${esc(p.name)}')">Voir sur la carte</button></div></article>`).join(""):"<div class='empty'>L'index sera rempli lors de la prochaine synchronisation.</div>"}
function renderNames(){let el=$("#names");el.innerHTML=state.names.length?state.names.map(n=>`<article class="item"><div><h3>${esc(n.name)}</h3><p>${n.count||0} occurrence(s)</p></div></article>`).join(""):"<div class='empty'>L'index des noms sera rempli lors de la synchronisation.</div>"}
function renderArticles(){let labels=[...new Set(state.articles.flatMap(a=>a.labels||[]))].sort();$("#labelFilter").innerHTML='<option value="">Toutes les catégories</option>'+labels.map(x=>`<option>${esc(x)}</option>`).join("");const go=()=>{let q=$("#articleSearch").value.toLowerCase(),l=$("#labelFilter").value;let a=state.articles.filter(x=>(!q||[x.title,x.excerpt,x.content,...(x.labels||[])].join(" ").toLowerCase().includes(q))&&(!l||(x.labels||[]).includes(l)));$("#articles").innerHTML=a.map(articleCard).join("")||"<div class='empty'>Aucun article.</div>"};$("#articleSearch").oninput=go;$("#labelFilter").onchange=go;go()}
function focusPlace(n){const m=state.markers.find(x=>String(x.name).toLowerCase()===n.toLowerCase())||state.markers.find(x=>String(x.name).toLowerCase().includes(n.toLowerCase()));if(m){document.querySelector('[data-page="mapPage"]').click();state.map.setView([m.lat,m.lng],15);openMarker(m)}}
function openArticle(id){const a=state.articles.find(x=>x.id===id);if(!a)return;$("#sheetContent").innerHTML=`<h2>${esc(a.title)}</h2><p>${esc(a.published||"")} ${a.place?`• ${esc(a.place)}`:""}</p><div class="article-body">${a.content||`<p>${esc(a.excerpt||"")}</p>`}</div><p><a href="${esc(a.url)}" target="_blank">Ouvrir l'article original</a></p>`;$("#sheet").classList.add("open")}
function notice(t){const n=$("#mapNotice");n.textContent=t;n.style.display="block";setTimeout(()=>n.style.display="none",4500)}
async function setupPWA(){let b=$("#installBtn");let deferred;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;b.hidden=false;b.onclick=async()=>{b.hidden=true;await deferred.prompt();deferred=null}})}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js",{scope:"./"}).catch(console.warn);
boot();