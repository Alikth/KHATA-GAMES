window.addEventListener("DOMContentLoaded", () => {
let houses = [], players = [], selected = null, currentUser = null;
const $ = id => document.getElementById(id);

async function api(url, options={}) {
  const res = await fetch(url, {headers: {"Content-Type":"application/json"}, ...options});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || "خطایی رخ داد.");
  return data;
}

async function boot() {
  const auth = await api("/api/auth/status");
  // Every visitor must authenticate first, including admin users.
  if (!auth.authenticated) { showAuth(); return; }
  currentUser = auth.user;
  if (new URLSearchParams(location.search).get("admin") === "1") {
    await enterAuthenticated();
    showAdminOnly();
    await checkAdminSession();
    return;
  }
  await enterAuthenticated();
}

async function enterAuthenticated() {
  currentUser = currentUser || (await api("/api/auth/status")).user;
  ["authScreen"].forEach(id => $(id).classList.add("hidden"));
  $("welcomeUser").textContent = currentUser.username;
  $("currentUser").textContent = String(currentUser.username || "").replace(/^@+/, "");
  $("gameLobby").classList.remove("hidden");
  houses = await api("/api/houses"); players = await api("/api/players");
  renderRegions(); renderPlayers(); renderMap(); renderMyCastles(); fillAdminRegions();
}

function showAuth() { $("authScreen").classList.remove("hidden"); $("gameLobby").classList.add("hidden"); $("gameApp").classList.add("hidden"); }
function setAuthTab(mode) {
  document.querySelectorAll(".auth-tab").forEach(x=>x.classList.toggle("active", x.dataset.auth===mode));
  $("loginForm").classList.toggle("hidden", mode!=="login"); $("signupForm").classList.toggle("hidden", mode!=="signup"); $("authMessage").innerHTML="";
}
document.querySelectorAll(".auth-tab").forEach(btn=>btn.addEventListener("click",()=>setAuthTab(btn.dataset.auth)));

$("loginForm").addEventListener("submit", async e=>{ e.preventDefault(); $("authMessage").innerHTML=""; try { const d=await api("/api/auth/login",{method:"POST",body:JSON.stringify({username:$("loginUsername").value,password:$("loginPassword").value})}); currentUser=d.user; await enterAuthenticated(); } catch(err){ $("authMessage").innerHTML=`<div class="error">${err.message}</div>`; } });
$("signupForm").addEventListener("submit", async e=>{ e.preventDefault(); $("authMessage").innerHTML=""; try { const d=await api("/api/auth/register",{method:"POST",body:JSON.stringify({username:$("signupUsername").value,password:$("signupPassword").value})}); currentUser=d.user; await enterAuthenticated(); } catch(err){ $("authMessage").innerHTML=`<div class="error">${err.message}</div>`; } });

async function logoutUser(){ await api("/api/auth/logout",{method:"POST"}); currentUser=null; showAuth(); $("loginPassword").value=""; }
$("logoutUser").onclick=logoutUser; $("logoutUser2").onclick=logoutUser;

function enterKillTheKing(){ $("gameLobby").classList.add("hidden"); $("gameApp").classList.remove("hidden"); }
$("enterKillTheKing").onclick=enterKillTheKing;
$("backLobby").onclick=()=>{ $("gameApp").classList.add("hidden"); $("gameLobby").classList.remove("hidden"); };

function renderRegions(){ $("regions").innerHTML=houses.map((r,i)=>`<button class="region-card" onclick="openRegion(${i})"><div class="region-icon">${r.icon}</div><div class="region-name">${r.region}</div><div class="region-sub">${r.castles.length} CASTLES</div></button>`).join(""); }
function openRegion(i){ const r=houses[i]; $("regions").classList.add("hidden"); $("castles").classList.remove("hidden"); $("castles").innerHTML=`<button class="back" onclick="backRegions()">← بازگشت به اقلیم‌ها</button><div class="page-title"><span>${r.icon}</span><div><h2>${r.region}</h2><p>قلعه را انتخاب کن و مشخصات آن را ببین</p></div></div><div class="castle-grid">${r.castles.map((c,j)=>{const p=players.find(x=>x.region===r.region&&x.castle===c.castle);return `<button class="castle-card ${p?'claimed':'available'}" onclick="openCastleDetails(${i},${j})"><div class="castle-top"><span class="castle-icon">${c.icon}</span><span class="status">${p?'🔒 CLAIMED':'🟢 AVAILABLE'}</span></div><h3>${c.castle}</h3><div class="house">HOUSE ${c.house}</div><div class="claim-by">${p?p.username:'مشاهده اطلاعات و موقعیت قلعه'}</div></button>`;}).join("")}</div>`; }
function backRegions(){ $("castles").classList.add("hidden"); $("regions").classList.remove("hidden"); }

async function openCastleDetails(regionIndex,castleIndex){ const r=houses[regionIndex], c=r.castles[castleIndex], p=players.find(x=>x.region===r.region&&x.castle===c.castle); let info={}; try{info=await api("/api/castles/"+encodeURIComponent(c.castle));}catch(e){} $("castleDetails").innerHTML=`<div class="detail-icon">${c.icon}</div><div class="eyebrow">${r.region}</div><h2>${c.castle}</h2><div class="detail-house">HOUSE ${c.house}</div><div class="detail-grid"><div><span>📍 LOCATION</span><b>${info.location||r.region}</b></div><div><span>🏰 CASTLE</span><b>${c.castle}</b></div><div><span>👑 RULING HOUSE</span><b>${c.house}</b></div><div><span>STATUS</span><b class="${p?'taken':'free'}">${p?'OCCUPIED · '+p.username:'FREE'}</b></div></div><p class="detail-description">${info.description||'اطلاعات این قلعه در حال تکمیل است.'}</p>${p?'':'<button class="primary wide" onclick="openClaim('+regionIndex+','+castleIndex+');closeCastleDetails()">CLAIM THIS CASTLE</button>'}`; $("castleModal").classList.remove("hidden"); }
function closeCastleDetails(){ $("castleModal").classList.add("hidden"); }
$("closeCastleModal").onclick=closeCastleDetails; $("castleModal").addEventListener("click",e=>{if(e.target.id==="castleModal")closeCastleDetails();});

function openClaim(regionIndex,castleIndex){ const r=houses[regionIndex],c=r.castles[castleIndex]; selected={region:r.region,house:c.house,castle:c.castle}; $("selectedCastle").textContent=c.castle; $("selectedHouse").textContent=`HOUSE ${c.house} · ${r.region}`; $("username").value=""; $("formMessage").innerHTML=""; $("registerModal").classList.remove("hidden"); setTimeout(()=>$("username").focus(),100); }
$("closeModal").onclick=()=>$("registerModal").classList.add("hidden"); $("registerModal").addEventListener("click",e=>{if(e.target.id==="registerModal")$("registerModal").classList.add("hidden")});
$("registerForm").addEventListener("submit",async e=>{e.preventDefault();try{const data=await api("/api/register",{method:"POST",body:JSON.stringify({...selected,username:$("username").value})});players=await api("/api/players");renderMyCastles();$("formMessage").innerHTML=`<div class="success">👑 ${data.message}<br>قلعه ${selected.castle} به نام شما ثبت شد.</div>`;renderPlayers();renderMap();openRegion(houses.findIndex(x=>x.region===selected.region));}catch(err){$("formMessage").innerHTML=`<div class="error">${err.message}</div>`;}});

const regionLocations={"The Wall":[61.0,7.2],"North":[53.4,26.7],"Riverlands":[52.5,45.7],"Iron Islands":[29.8,45.5],"Vale":[71.6,48.0],"Westerlands":[32.5,57.6],"Crownlands":[64.8,67.0],"Reach":[45.5,70.5],"Stormlands":[76.2,78.2],"Dorne":[53.8,88.2]};
const regionShort={"The Wall":"THE WALL","North":"THE NORTH","Riverlands":"THE RIVERLANDS","Vale":"THE VALE","Iron Islands":"THE IRON ISLANDS","Westerlands":"THE WESTERLANDS","Crownlands":"THE CROWNLANDS","Stormlands":"THE STORMLANDS","Reach":"THE REACH","Dorne":"DORNE"};
function renderMap(){const root=$("regionMarkers");if(!root)return;root.innerHTML=houses.map((r,idx)=>{const pos=regionLocations[r.region],count=players.filter(p=>p.region===r.region).length;if(!pos)return"";return `<button class="region-marker ${count?'has-players':''}" style="left:${pos[0]}%;top:${pos[1]}%" data-index="${idx}" aria-label="${r.region}"><span class="region-label">${regionShort[r.region]||r.region}</span><span class="region-orb">${r.icon}</span><span class="region-count">${count}/${r.castles.length}</span></button>`;}).join("");root.querySelectorAll(".region-marker").forEach(b=>b.addEventListener("click",()=>showRegionPanel(Number(b.dataset.index))));}
function showRegionPanel(index){const r=houses[index];if(!r)return;$("regionPanel").innerHTML=`<div class="region-panel-head"><div class="panel-icon">${r.icon}</div><div><span>REALM</span><h3>${regionShort[r.region]||r.region}</h3><small>${r.castles.length} CASTLES · ${players.filter(p=>p.region===r.region).length} CLAIMED</small></div></div><div class="region-panel-divider"></div><p class="panel-hint">خاندان‌ها و قلعه‌ها</p><div class="region-castles">${r.castles.map((c,i)=>{const p=players.find(x=>x.region===r.region&&x.castle===c.castle);return `<button class="region-castle ${p?'claimed':'free'}" onclick="openCastleDetails(${index},${i})"><span class="castle-mini-icon">${c.icon}</span><span class="castle-info"><strong>${c.castle}</strong><small>HOUSE ${c.house}</small></span><span class="castle-state">${p?'♛ '+p.username:'FREE'}</span></button>`;}).join("")}</div>`;}

function renderPlayers(){$("playerCount").textContent=players.length;$("playerList").innerHTML=houses.map(r=>{const rp=players.filter(p=>p.region===r.region);if(!rp.length)return`<div class="realm-group empty"><div class="realm-heading"><span>${r.icon} ${r.region}</span><small>0 / ${r.castles.length} CLAIMED</small></div><div class="empty-realm">هنوز لردی در این اقلیم ثبت نشده است.</div></div>`;return`<div class="realm-group"><div class="realm-heading"><span>${r.icon} ${r.region}</span><small>${rp.length} / ${r.castles.length} CLAIMED</small></div>${rp.map(p=>`<div class="player"><div><strong>${p.username}</strong><small>${p.house}</small></div><div class="castle">${p.castle}</div></div>`).join("")}</div>`;}).join("");}

async function renderMyCastles(){
  const root=$("myCastlesList");
  if(!root || !currentUser) return;
  let mine=[];
  try { mine=await api("/api/my-castles"); } catch(e) { mine=players.filter(p=>p.accountId===currentUser.id); }
  if(!mine.length){
    root.innerHTML=`<div class="my-castles-empty"><div class="empty-castle-icon">🏰</div><h3>NO CASTLES YET</h3><p>هنوز هیچ قلعه‌ای با این حساب ثبت نشده است.</p><button class="primary" type="button" onclick="document.querySelector('[data-page=\"register\"]').click()">انتخاب قلعه</button></div>`;
    return;
  }
  root.innerHTML=mine.map(p=>{
    const r=houses.find(x=>x.region===p.region);
    const c=r?.castles.find(x=>x.castle===p.castle);
    return `<article class="my-castle-card"><div class="my-castle-art">${c?.icon||'🏰'}</div><div class="my-castle-body"><span class="my-castle-region">${r?.icon||''} ${p.region}</span><h3>${p.castle}</h3><p>HOUSE ${p.house}</p><div class="my-castle-meta"><span>👤 ${p.username}</span><span class="owned-badge">YOUR CASTLE</span></div></div><button class="castle-open" type="button" onclick="openCastleDetails(${houses.findIndex(x=>x.region===p.region)},${r?.castles.findIndex(x=>x.castle===p.castle)??0})">مشاهده جزئیات</button></article>`;
  }).join("");
}

document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  $(btn.dataset.page).classList.add("active");
  if(btn.dataset.page==="players"){ api("/api/players").then(x=>{players=x;renderPlayers();renderMap();renderMyCastles();}); }
  if(btn.dataset.page==="myCastles"){ api("/api/players").then(x=>{players=x;renderMyCastles();}); }
}));

function fillAdminRegions(){if(!$("adminRegion"))return;$("adminRegion").innerHTML=houses.map(r=>`<option>${r.region}</option>`).join("");updateAdminCastles();}
function updateAdminCastles(){const r=houses.find(x=>x.region===$("adminRegion").value);if(!r)return;const a=r.castles.filter(c=>!players.some(p=>p.region===r.region&&p.castle===c.castle));$("adminCastle").innerHTML=a.map(c=>`<option value="${c.castle}">${c.castle} — ${c.house}</option>`).join("");}
$("adminRegion").addEventListener("change",updateAdminCastles);
async function refreshAdmin(){players=await api("/api/players");renderPlayers();renderMap();updateAdminCastles();$("adminPlayers").innerHTML=players.length?players.map(p=>`<div class="admin-row"><span>${p.username} · ${p.castle}</span><button class="delete" onclick="deletePlayer('${p.id}')">DELETE</button></div>`).join(""):"<small>هیچ پلیری ثبت نشده.</small>";}
$("adminLogin").onclick=async()=>{try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:$("adminPassword").value})});$("adminLoginBox").classList.add("hidden");$("adminPanel").classList.remove("hidden");refreshAdmin();}catch(e){$("adminMessage").innerHTML=`<div class="error">${e.message}</div>`;}};
$("adminAdd").onclick=async()=>{try{await api("/api/admin/players",{method:"POST",body:JSON.stringify({username:$("adminUsername").value,region:$("adminRegion").value,castle:$("adminCastle").value})});$("adminUsername").value="";refreshAdmin();}catch(e){$("adminMessage").innerHTML=`<div class="error">${e.message}</div>`;}};
async function deletePlayer(id){if(!confirm("این پلیر حذف شود؟"))return;try{await api("/api/admin/players/"+id,{method:"DELETE"});refreshAdmin();}catch(e){alert(e.message)}}
$("adminLogout").onclick=async()=>{await api("/api/admin/logout",{method:"POST"});$("adminPanel").classList.add("hidden");$("adminLoginBox").classList.remove("hidden")};
$("adminLink").onclick=()=>{ if(currentUser){ showAdminOnly(); checkAdminSession(); } };
function showAdminOnly(){
  $("authScreen").classList.add("hidden");
  $("gameLobby").classList.add("hidden");
  $("gameApp").classList.remove("hidden");
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  $("admin").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
}
async function checkAdminSession(){
  const status=await api("/api/admin/status");
  if(status.admin){$("adminLoginBox").classList.add("hidden");$("adminPanel").classList.remove("hidden");await refreshAdmin();}
  else{$("adminLoginBox").classList.remove("hidden");$("adminPanel").classList.add("hidden");}
}
window.addEventListener("scroll",()=>{ if(currentUser && !$("gameApp").classList.contains("hidden")) $("gameApp").classList.toggle("scrolled", window.scrollY>180); }, {passive:true});

boot().catch(err=>{console.error(err);showAuth();});

  // Expose handlers used by dynamically rendered castle cards.
  window.openRegion=openRegion;
  window.backRegions=backRegions;
  window.openCastleDetails=openCastleDetails;
  window.openClaim=openClaim;
  window.deletePlayer=deletePlayer;
});

// Small cinematic blood-drop effect at every click, directly below the sword cursor.
document.addEventListener("click", e => {
  const splash = document.createElement("span");
  splash.className = "blood-splash";
  splash.style.left = e.clientX + "px";
  splash.style.top = (e.clientY + 4) + "px";
  splash.innerHTML = "<i class=\"drop\"></i><i class=\"drop\"></i><i class=\"drop\"></i>";
  document.body.appendChild(splash);
  setTimeout(() => splash.remove(), 900);
});
