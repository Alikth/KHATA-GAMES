window.addEventListener("DOMContentLoaded", () => {
  let houses = [], players = [], adminPlayers = [], selected = null, currentUser = null;
  let castleRequestId = 0, submissionState = null, claimLocked = false;
  let adminRequested = new URLSearchParams(location.search).get("admin") === "1";
  const $ = id => document.getElementById(id);

  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));
  const stripAt = value => String(value || "").replace(/^@+/, "");
  const houseFlag = (castle, cls = "house-flag") => {
    if (!castle?.flag) return "";
    return `<img class="${cls}" src="${escapeHTML(castle.flag)}" alt="${escapeHTML(castle.house || "House")}" loading="lazy" decoding="async">`;
  };
  const houseFlagByName = house => {
    for (const region of houses) {
      const castle = region.castles.find(c => c.house === house && c.flag);
      if (castle) return houseFlag(castle, "house-flag house-flag-small");
    }
    return "";
  };

  const apiCache=new Map();
  const API_CACHE_TTL={"/api/houses":30000,"/api/players":5000,"/api/world-state":5000};
  let lastLocalMutationAt=0;
  function invalidateApiCache(paths=null){
    if(!paths){apiCache.clear();return;}
    for(const key of paths) apiCache.delete(key);
  }
  async function api(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const method=String(options.method||"GET").toUpperCase();
    const cacheKey=method==="GET"?url:null;
    const ttl=cacheKey?API_CACHE_TTL[cacheKey]:0;
    if(ttl){
      const cached=apiCache.get(cacheKey);
      if(cached&&cached.expiresAt>Date.now())return cached.data;
      if(cached)apiCache.delete(cacheKey);
    }
    const res = await fetch(url, { cache: "default", ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || "خطایی رخ داد.");
      error.status = res.status;
      throw error;
    }
    if(ttl)apiCache.set(cacheKey,{data,expiresAt:Date.now()+ttl});
    if(method!=="GET"){lastLocalMutationAt=Date.now();window.khataRealtimeLocalMutationAt=lastLocalMutationAt;invalidateApiCache();}
    return data;
  }

  let realtimeSocket=null,realtimeReconnectTimer=null,realtimeReconnectDelay=1000,realtimeRefreshTimer=null;
  function closeRealtime(){
    if(realtimeReconnectTimer)clearTimeout(realtimeReconnectTimer);realtimeReconnectTimer=null;
    if(realtimeSocket){try{realtimeSocket.close()}catch{}realtimeSocket=null;}
  }
  function scheduleRealtimeRefresh(){
    if(realtimeRefreshTimer)return;
    realtimeRefreshTimer=setTimeout(async()=>{
      realtimeRefreshTimer=null;
      try{
        const page=document.querySelector(".nav-btn.active")?.dataset.page;
        const detail=window.khataRealtimeDetail||{};
        if(lastLocalMutationAt&&Date.now()-lastLocalMutationAt<2000){window.khataRealtimeDetail=null;return;}
        invalidateApiCache();
        if(page==="players"){
          const world=await api("/api/world-state");
          players=world.players||[];houses=world.houses||[];
          renderPlayers();renderMap();
        }else if(page==="myCastles"){
          await renderMyCastles();
        }else if(page==="season"){
          await window.khataLoadWarLog?.();
        }
        if(page!=="myCastles"||document.getElementById("tradeModal")?.classList.contains("hidden")===false){
          await window.khataRefreshTradeNotifications?.();
        }
        window.khataRealtimeDetail=null;
      }catch(e){console.debug("realtime refresh failed",e);}
    },250);
  }
  function connectRealtime(){
    closeRealtime(); if(!currentUser)return;
    const protocol=location.protocol==="https:"?"wss:":"ws:";
    const ws=new WebSocket(protocol+"//"+location.host+"/api/realtime"); realtimeSocket=ws;
    ws.onopen=()=>{realtimeReconnectDelay=1000;try{ws.send("ping")}catch{}};
    ws.onmessage=e=>{try{const data=JSON.parse(e.data);if(data.type==="game_update"){window.khataRealtimeDetail=data;window.dispatchEvent(new CustomEvent("khata:realtime",{detail:data}));scheduleRealtimeRefresh();}}catch{}};
    ws.onclose=()=>{if(realtimeSocket!==ws)return;realtimeSocket=null;if(currentUser){const delay=realtimeReconnectDelay;realtimeReconnectDelay=Math.min(300000,realtimeReconnectDelay*2);realtimeReconnectTimer=setTimeout(connectRealtime,delay);}};
    ws.onerror=()=>{try{ws.close()}catch{}};
  }

  function setMessage(id, type, message) {
    const root = $(id);
    if (!root) return;
    root.innerHTML = message ? `<div class="${type}">${escapeHTML(message)}</div>` : "";
  }

  function resetGameState() {
    selected = null;
    castleRequestId++;
    ["castleModal", "registerModal"].forEach(id => $(id)?.classList.add("hidden"));
    document.body.classList.remove("modal-open");
    $("formMessage").innerHTML = "";
    $("adminMessage").innerHTML = "";
    $("adminPassword").value = "";
    $("username").value = "";
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
    $("register").classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.toggle("active", x.dataset.page === "register"));
    $("castles").classList.add("hidden");
    $("regions").classList.remove("hidden");
    $("regionPanel").innerHTML = `<div class="region-panel-empty"><div class="panel-crown">◐</div><h3>CHOOSE A REALM</h3><p>برای مشاهده خاندان‌ها و قلعه‌های هر اقلیم، یکی از دایره‌های روی نقشه را انتخاب کن.</p></div>`;
  }

  async function boot() {
    try {
      const auth = await api("/api/auth/status");
      if (adminRequested) {
        // Admin login is independent from the normal player login.
        // Open the control-room login directly at ?admin=1.
        showAdminOnly();
        await checkAdminSession();
        return;
      }
      if (!auth.authenticated) {
        showAuth();
        return;
      }
      currentUser = auth.user;
      connectRealtime();
      await enterAuthenticated();
    } catch (err) {
      console.error(err);
      if (adminRequested) {
        showAdminOnly();
        setMessage("adminMessage", "error", "ارتباط با سرور برقرار نشد: " + err.message);
      } else {
        showAuth();
        setMessage("authMessage", "error", "ارتباط با سرور برقرار نشد. اتصال اینترنت و اجرای سرور را بررسی کنید.");
      }
    }
  }

  async function enterAuthenticated() {
    currentUser = currentUser || (await api("/api/auth/status")).user;
    $("authScreen").classList.add("hidden");
    $("welcomeUser").textContent = stripAt(currentUser.username);
    $("currentUser").textContent = stripAt(currentUser.username);
    $("gameLobby").classList.remove("hidden");
    const world=await api("/api/world-state");
    houses=world.houses||[];
    players=world.players||[];
    renderRegions();
    renderPlayers();
    renderMap();
    await renderMyCastles();
    fillAdminRegions();
  }

  function showAuth() {
    $("authScreen").classList.remove("hidden");
    $("gameLobby").classList.add("hidden");
    $("gameApp").classList.add("hidden");
    resetGameState();
  }

  function setAuthTab(mode) {
    document.querySelectorAll(".auth-tab").forEach(x => x.classList.toggle("active", x.dataset.auth === mode));
    $("loginForm").classList.toggle("hidden", mode !== "login");
    $("signupForm").classList.toggle("hidden", mode !== "signup");
    $("authMessage").innerHTML = "";
  }
  document.querySelectorAll(".auth-tab").forEach(btn => btn.addEventListener("click", () => setAuthTab(btn.dataset.auth)));

  async function handleAuthSubmit(endpoint, usernameId, passwordId) {
    setMessage("authMessage", "", "");
    const button = document.querySelector(`#${usernameId}`)?.form?.querySelector("button[type=submit]");
    if (button) button.disabled = true;
    const card = document.querySelector(".auth-card");
    try {
      const data = await api(endpoint, { method: "POST", body: JSON.stringify({ username: $(usernameId).value, password: $(passwordId).value }) });
      if (endpoint === "/api/auth/login") {
        card?.classList.add("login-loading");
        playEpicLoginSound();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      currentUser = data.user;
      connectRealtime();
      adminRequested = adminRequested || sessionStorage.getItem("khata_admin_requested") === "1";
      sessionStorage.removeItem("khata_admin_requested");
      await enterAuthenticated();
      if (adminRequested) { showAdminOnly(); await checkAdminSession(); adminRequested = false; }
    } catch (err) {
      card?.classList.remove("login-loading");
      setMessage("authMessage", "error", err.message);
    } finally {
      if (button) button.disabled = false;
    }
  }

  $("loginForm").addEventListener("submit", e => { e.preventDefault(); handleAuthSubmit("/api/auth/login", "loginUsername", "loginPassword"); });
  $("signupForm").addEventListener("submit", e => { e.preventDefault(); handleAuthSubmit("/api/auth/register", "signupUsername", "signupPassword"); });

  function playEpicLoginSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);
      master.connect(ctx.destination);
      const notes = [73.42, 110, 146.83, 220];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + 1.7);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.28 / (i + 1), now + 0.08 + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        osc.connect(gain).connect(master);
        osc.start(now + i * 0.04);
        osc.stop(now + 1.9);
      });
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = "sawtooth";
      boom.frequency.setValueAtTime(55, now);
      boom.frequency.exponentialRampToValueAtTime(28, now + 0.7);
      boomGain.gain.setValueAtTime(0.0001, now);
      boomGain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      boom.connect(boomGain).connect(master);
      boom.start(now);
      boom.stop(now + 0.95);
      setTimeout(() => ctx.close().catch(() => {}), 2200);
    } catch (e) { console.warn("Login sound unavailable", e); }
  }

  async function logoutUser() {
    try { await api("/api/auth/logout", { method: "POST" }); }
    catch (err) { console.error(err); }
    closeRealtime();
    currentUser = null;
    adminRequested = false;
    sessionStorage.removeItem("khata_admin_requested");
    $("loginPassword").value = "";
    $("signupPassword").value = "";
    resetGameState();
    setAuthTab("login");
    showAuth();
  }
  $("logoutUser").onclick = logoutUser;
  $("logoutUser2").onclick = logoutUser;

  function enterKillTheKing() {
    $("gameLobby").classList.add("hidden");
    $("gameApp").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  const killGameCard = $("killTheKingGame");
  killGameCard?.addEventListener("click", enterKillTheKing);
  killGameCard?.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enterKillTheKing(); } });
  $("backLobby").onclick = () => { $("gameApp").classList.add("hidden"); $("gameLobby").classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "auto" }); };

  function renderRegions() {
    $("regions").innerHTML = houses.map((r, i) => `<button class="region-card" type="button" data-action="region" data-index="${i}"><div class="region-icon">${escapeHTML(r.icon)}</div><div class="region-name">${escapeHTML(r.region)}</div><div class="region-sub">${r.castles.length} CASTLES</div></button>`).join("");
  }

  function openRegion(i) {
    const r = houses[i]; if (!r) return;
    $("regions").classList.add("hidden");
    $("castles").classList.remove("hidden");
    $("castles").innerHTML = `<button class="back" type="button" data-action="back-regions">← بازگشت به اقلیم‌ها</button><div class="page-title"><span>${escapeHTML(r.icon)}</span><div><h2>${escapeHTML(r.region)}</h2><p>قلعه را انتخاب کن و مشخصات آن را ببین</p></div></div><div class="castle-grid">${r.castles.map((c, j) => {
      const p = players.find(x => x.region === r.region && x.castle === c.castle);
      return `<button class="castle-card ${p ? "claimed" : "available"}" type="button" data-action="castle" data-region="${i}" data-castle="${j}"><div class="castle-top"><span class="castle-icon">${houseFlag(c)}</span><span class="status">${p ? "🔒 CLAIMED" : "🟢 AVAILABLE"}</span></div><h3>${escapeHTML(c.castle)}</h3><div class="house">HOUSE ${escapeHTML(c.house)}</div><div class="claim-by">${p ? escapeHTML(p.username) : "مشاهده اطلاعات و موقعیت قلعه"}</div>${window.khataLordByCastle?.[c.castle] ? `<span class="lord-link" data-action="lord" data-lord="${escapeHTML(window.khataLordByCastle[c.castle])}">مشاهده لرد</span>` : ""}</button>`;
    }).join("")}</div>`;
  }
  function backRegions() { $("castles").classList.add("hidden"); $("regions").classList.remove("hidden"); }

  async function openCastleDetails(regionIndex, castleIndex) {
    const r = houses[regionIndex], c = r?.castles[castleIndex];
    if (!r || !c) return;
    const requestId = ++castleRequestId;
    const p = players.find(x => x.region === r.region && x.castle === c.castle);
    $("castleDetails").innerHTML = `<div class="modal-loading"><span class="spinner"></span> در حال دریافت اطلاعات قلعه...</div>`;
    const claimButton=$("castleDetails").querySelector('[data-action="claim"]'); if(claimButton&&claimLocked){claimButton.disabled=true;claimButton.textContent="انتخاب قلعه فعلاً قفل است.";}
    openModal("castleModal");
    let info = {};
    try { info = await api("/api/castles/" + encodeURIComponent(c.castle)); } catch (e) { console.warn(e); }
    if (requestId !== castleRequestId) return;
    $("castleDetails").innerHTML = `<div class="detail-icon">${houseFlag(c,"house-flag house-flag-detail")}</div><div class="eyebrow">${escapeHTML(r.region)}</div><h2>${escapeHTML(c.castle)}</h2><div class="detail-house">HOUSE ${escapeHTML(c.house)}</div><div class="detail-grid"><div><span>📍 LOCATION</span><b>${escapeHTML(info.location || r.region)}</b></div><div><span>🏰 CASTLE</span><b>${escapeHTML(c.castle)}</b></div><div><span>👑 RULING HOUSE</span><b>${escapeHTML(c.house)}</b></div><div><span>STATUS</span><b class="${p ? "taken" : "free"}">${p ? "OCCUPIED · " + escapeHTML(p.username) : "FREE"}</b></div></div><p class="detail-description">${escapeHTML(info.description || "اطلاعات این قلعه در حال تکمیل است.")}</p>${p ? "" : `<button class="primary wide" type="button" data-action="claim" data-region="${regionIndex}" data-castle="${castleIndex}" ${claimLocked ? "disabled" : ""}>${claimLocked ? "انتخاب قلعه فعلاً قفل است." : "CLAIM THIS CASTLE"}</button>`}`;
  }

  function openModal(id) { $(id).classList.remove("hidden"); document.body.classList.add("modal-open"); }
  function closeModal(id) { $(id).classList.add("hidden"); if (["castleModal", "registerModal"].every(x => $(x).classList.contains("hidden"))) document.body.classList.remove("modal-open"); }
  function closeCastleDetails() { castleRequestId++; closeModal("castleModal"); }
  $("closeCastleModal").onclick = closeCastleDetails;
  $("castleModal").addEventListener("click", e => { if (e.target.id === "castleModal") closeCastleDetails(); });

  function openClaim(regionIndex, castleIndex) {
    const r = houses[regionIndex], c = r?.castles[castleIndex]; if (!r || !c) return;
    selected = { region: r.region, house: c.house, castle: c.castle };
    $("selectedCastle").textContent = c.castle;
    $("selectedHouse").textContent = `HOUSE ${c.house} · ${r.region}`;
    $("username").value = "";
    $("formMessage").innerHTML = "";
    closeModal("castleModal");
    openModal("registerModal");
    setTimeout(() => $("username").focus(), 80);
  }
  $("closeModal").onclick = () => closeModal("registerModal");
  $("registerModal").addEventListener("click", e => { if (e.target.id === "registerModal") closeModal("registerModal"); });

  $("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!selected) return;
    const submit = e.currentTarget.querySelector("button[type=submit]");
    submit.disabled = true;
    setMessage("formMessage", "", "");
    try {
      const data = await api("/api/register", { method: "POST", body: JSON.stringify({ ...selected, username: $("username").value }) });
      players = await api("/api/players");
      await renderMyCastles(); renderPlayers(); renderMap();
      closeModal("registerModal");
      openRegion(houses.findIndex(x => x.region === selected.region));
      showToast(`👑 ${data.message} · قلعه ${selected.castle} به نام شما ثبت شد.`);
      selected = null;
    } catch (err) {
      setMessage("formMessage", "error", err.message);
    } finally { submit.disabled = false; }
  });

  const regionLocations = {"The Wall":[61.0,7.2],"North":[53.4,26.7],"Riverlands":[52.5,45.7],"Iron Islands":[29.8,45.5],"Vale":[71.6,48.0],"Westerlands":[32.5,57.6],"Crownlands":[64.8,67.0],"Reach":[45.5,70.5],"Stormlands":[76.2,78.2],"Dorne":[53.8,88.2]};
  const regionShort = {"The Wall":"THE WALL","North":"THE NORTH","Riverlands":"THE RIVERLANDS","Vale":"THE VALE","Iron Islands":"THE IRON ISLANDS","Westerlands":"THE WESTERLANDS","Crownlands":"THE CROWNLANDS","Stormlands":"THE STORMLANDS","Reach":"THE REACH","Dorne":"DORNE"};
  let mapScale = 1;
  function renderMap() {
    const root = $("regionMarkers"); if (!root) return;
    $("castleCount").textContent = houses.reduce((n,r) => n + r.castles.length, 0);
    root.innerHTML = houses.map((r, idx) => {
      const pos = regionLocations[r.region], count = players.filter(p => p.region === r.region).length; if (!pos) return "";
      return `<button class="region-marker ${count ? "has-players" : ""}" style="left:${pos[0]}%;top:${pos[1]}%" data-index="${idx}" aria-label="${escapeHTML(r.region)}"><span class="region-label">${escapeHTML(regionShort[r.region] || r.region)}</span><span class="region-orb">${escapeHTML(r.icon)}</span><span class="region-count">${count}/${r.castles.length}</span></button>`;
    }).join("");
    root.querySelectorAll(".region-marker").forEach(b => b.addEventListener("click", () => showRegionPanel(Number(b.dataset.index))));
    updateMapZoom();
  }
  function updateMapZoom() { const img = $("westerosMap"); if (!img) return; img.style.setProperty("--map-scale", mapScale); $("mapZoomValue").textContent = `${Math.round(mapScale * 100)}%`; }
  function showRegionPanel(index) {
    const r = houses[index]; if (!r) return;
    const claimed = players.filter(p => p.region === r.region).length;
    $("regionPanel").innerHTML = `<div class="region-panel-head"><div class="panel-icon">${escapeHTML(r.icon)}</div><div><span>REALM</span><h3>${escapeHTML(regionShort[r.region] || r.region)}</h3><small>${r.castles.length} CASTLES · ${claimed} CLAIMED</small></div></div><div class="region-panel-divider"></div><p class="panel-hint">خاندان‌ها و قلعه‌ها</p><div class="region-castles">${r.castles.map((c, i) => { const p = players.find(x => x.region === r.region && x.castle === c.castle); return `<button class="region-castle ${p ? "claimed" : "free"}" type="button" data-action="castle" data-region="${index}" data-castle="${i}"><span class="castle-mini-icon">${houseFlag(c,"house-flag house-flag-small")}</span><span class="castle-info"><strong>${escapeHTML(c.castle)}</strong><small>HOUSE ${escapeHTML(c.house)}</small></span><span class="castle-state">${p ? "♛ " + escapeHTML(p.username) : "FREE"}</span></button>`; }).join("")}</div>`;
  }

  function renderPlayers() {
    $("playerCount").textContent = players.length;
    $("playerList").innerHTML = houses.map(r => {
      const rp = players.filter(p => p.region === r.region);
      if (!rp.length) return `<div class="realm-group empty"><div class="realm-heading"><span>${escapeHTML(r.icon)} ${escapeHTML(r.region)}</span><small>0 / ${r.castles.length} CLAIMED</small></div><div class="empty-realm">هنوز لردی در این اقلیم ثبت نشده است.</div></div>`;
      return `<div class="realm-group"><div class="realm-heading"><span>${escapeHTML(r.icon)} ${escapeHTML(r.region)}</span><small>${rp.length} / ${r.castles.length} CLAIMED</small></div>${rp.map(p => `<div class="player"><div><strong>${escapeHTML(p.username)}</strong><small>${houseFlagByName(p.house)}${escapeHTML(p.house)}</small></div><div class="castle">${escapeHTML(p.castle)}</div></div>`).join("")}</div>`;
    }).join("");
  }

  async function renderMyCastles() {
    const root = $("myCastlesList"); if (!root || !currentUser) return;
    let mine = [];
    let mineError = null;
    let activeWars = {expeditions:[]};
    let activeWarsError = null;
    let tradeNotice = {byCastle:{}};
    let scenarioNotice = {items:[]};
    let roleStatus = {available:true,remainingSeconds:0};
    try{
      const dashboard=await api("/api/my-dashboard");
      mine=dashboard.castles||[];
      activeWars=dashboard.activeWars||activeWars;
      tradeNotice=dashboard.tradeNotice||tradeNotice;
      scenarioNotice=dashboard.scenarioNotice||scenarioNotice;
      roleStatus=dashboard.roleStatus||roleStatus;
      claimLocked=!!dashboard.claimLocked;
    }catch(e){mineError=e;}

    if (mineError) {
      root.innerHTML = '<div class="my-castles-empty"><div class="empty-castle-icon">⚠️</div><h3>خطا در دریافت قلعه‌ها</h3><p>'+escapeHTML(mineError.message||"دریافت قلعه‌ها انجام نشد.")+'</p></div>';
      return;
    }
    if (!mine.length) {
      root.innerHTML = `<div class="my-castles-empty"><div class="empty-castle-icon">🏰</div><h3>NO CASTLES YET</h3><p>هنوز هیچ قلعه‌ای با این حساب ثبت نشده است.</p><button class="primary" type="button" data-action="go-register">انتخاب قلعه</button></div>`;
      return;
    }
    root.innerHTML = mine.map(p => {
      const r = houses.find(x => x.region === p.region), c = r?.castles.find(x => x.castle === p.castle);
      const wars = activeWarsError ? [] : (activeWars.expeditions||[]).filter(w => w.sourceCastle === p.castle && w.active);
      const badge = Number(tradeNotice.byCastle?.[p.castle]||0);
      const scenarios = (scenarioNotice.items||[]).filter(s => s.castle === p.castle);
      const scenarioHtml = scenarios.length ? '<div class="my-castle-submissions">'+scenarios.map(s => '<button class="castle-open scenario-submit-btn" type="button" data-action="scenario-submit" data-war-id="'+escapeHTML(s.warId)+'" data-side="'+escapeHTML(s.side)+'" data-castle="'+escapeHTML(s.castle)+'" data-opponent="'+escapeHTML(s.opponentCastle)+'">📝 ارسال سناریو · '+escapeHTML(s.side==="attacker"?"حمله به "+s.opponentCastle:"دفاع در برابر "+s.opponentCastle)+'</button>').join('')+'</div>' : '';
      const roleLabel = roleStatus.available ? '📝 ارسال رول' : '🕒 ارسال رول · '+formatRoleCooldown(roleStatus.remainingSeconds);
      const warHtml = wars.length ? '<div class="my-castle-war">'+wars.map(w => '<article class="active-war-card"><strong>⚔️ لشکرکشی به '+escapeHTML(w.destinationCastle)+' — رسیدن '+escapeHTML(w.arrivalTime)+'</strong><div>'+(w.type==='sea'?'دریایی':'زمینی')+(w.fake?' · فیک':'')+'</div><button class="war-cancel-btn" type="button" data-action="cancel-war" data-war-id="'+escapeHTML(w.id)+'">لغو لشکرکشی</button></article>').join('')+'</div>' : '';
      return '<div class="my-castle-group"><article class="my-castle-card"><div class="my-castle-art">'+escapeHTML(c?.icon || "🏰")+'</div><div class="my-castle-body"><span class="my-castle-region">'+escapeHTML(r?.icon || "")+' '+escapeHTML(p.region)+'</span><h3>'+escapeHTML(p.castle)+'</h3><p>HOUSE '+escapeHTML(p.house)+'</p><div class="my-castle-meta"><span>👤 '+escapeHTML(p.username)+'</span><span class="owned-badge">YOUR CASTLE</span></div></div><div class="my-castle-actions"><button class="castle-open" type="button" data-action="my-castle-manage" data-castle="'+escapeHTML(p.castle)+'">🏰 مدیریت قلعه</button><button class="castle-open" type="button" data-action="war-expedition" data-castle="'+escapeHTML(p.castle)+'">⚔️ لشکرکشی</button><button class="castle-open trade-open" type="button" data-action="trade" data-castle="'+escapeHTML(p.castle)+'">⚖️ تجارت <span class="trade-badge-wrap"><span class="trade-badge '+(badge?'':'hidden')+'" data-trade-notification="'+escapeHTML(p.castle)+'">'+(badge||'')+'</span></span></button><button class="castle-open trade-request-open" type="button" data-action="trade-requests">📜 درخواست تجارت</button><button class="castle-open role-submit-btn" type="button" data-action="role-submit" data-castle="'+escapeHTML(p.castle)+'" '+(roleStatus.available?'':'disabled')+'>'+roleLabel+'</button>'+scenarioHtml+'</div></article>'+warHtml+'</div>';
    }).join("");
    if(activeWarsError)showToast(activeWarsError.message||"دریافت وضعیت لشکرکشی‌ها انجام نشد.",true);
  }
  function formatRoleCooldown(seconds){ const s=Math.max(0,Number(seconds)||0),h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h+"س "+String(m).padStart(2,"0")+"د"; }
  function openSubmission(type,payload){ submissionState={type,...payload}; $("submissionKicker").textContent=type==="scenario"?"SCENARIO":"ROLE"; $("submissionTitle").textContent=type==="scenario"?"ارسال سناریو":"ارسال رول"; $("submissionContext").textContent=type==="scenario"?(payload.side==="attacker"?"مهاجم":"مدافع")+" · "+payload.castle+" · "+(payload.opponentCastle||""):"لرد "+payload.castle+" · هر پلیر هر ۴۸ ساعت یکبار"; $("submissionText").value=""; $("submissionMessage").innerHTML=""; $("submissionSend").disabled=false; $("submissionModal").classList.remove("hidden"); document.body.classList.add("modal-open"); setTimeout(()=>$("submissionText").focus(),60); }
  function closeSubmission(){ submissionState=null; $("submissionModal").classList.add("hidden"); if(["castleModal","registerModal","submissionModal"].every(id=>$(id)?.classList.contains("hidden")))document.body.classList.remove("modal-open"); }
  async function submitSubmission(){ if(!submissionState)return; const textValue=$("submissionText").value.trim(); if(!textValue){setMessage("submissionMessage","error","متن را وارد کن.");return;} const button=$("submissionSend");button.disabled=true;setMessage("submissionMessage","",""); try{ if(submissionState.type==="scenario") await api("/api/scenarios",{method:"POST",body:JSON.stringify({warId:submissionState.warId,side:submissionState.side,castle:submissionState.castle,text:textValue})}); else await api("/api/roles",{method:"POST",body:JSON.stringify({castle:submissionState.castle,text:textValue})}); const doneType=submissionState.type; const sentWarId=submissionState.warId; const sentSide=submissionState.side; closeSubmission(); if(doneType==="scenario"){document.querySelectorAll(".scenario-submit-btn").forEach(el=>{if(el.dataset.warId===sentWarId&&el.dataset.side===sentSide)el.remove();});} await renderMyCastles(); if(document.body.classList.contains("admin-mode"))await refreshAdmin(); showToast(doneType==="scenario"?"سناریو ارسال شد.":"رول ارسال شد."); }catch(e){setMessage("submissionMessage","error",e.message||"ارسال انجام نشد.");button.disabled=false;} }
  $("submissionClose")?.addEventListener("click",closeSubmission);
  $("submissionModal")?.addEventListener("click",e=>{if(e.target.id==="submissionModal")closeSubmission();});
  $("submissionSend")?.addEventListener("click",submitSubmission);
  async function cancelWarExpedition(id) {
    if (!confirm("این لشکرکشی لغو شود؟ نیروها و ادوات انتخاب‌شده به قلعه بازمی‌گردند.")) return;
    try { await api("/api/war-expeditions/" + encodeURIComponent(id) + "/cancel", {method:"POST", body:JSON.stringify({})}); await renderMyCastles(); await window.khataLoadWarLog?.(); showToast("لشکرکشی لغو شد."); }
    catch(e){ showToast(e.message,true); }
  }

  async function cancelAdminWar(id) {
    if (!id) return;
    if (!confirm("این لشکرکشی از طرف ادمین لغو شود؟ نیروها و ادوات انتخاب‌شده به قلعه مبدأ بازمی‌گردند.")) return;
    try {
      await api("/api/admin/war-expeditions/" + encodeURIComponent(id) + "/cancel", {method:"POST", body:JSON.stringify({})});
      await refreshAdmin();
      await window.khataLoadWarLog?.();
      await window.khataRefreshMyCastles?.();
      showToast("لشکرکشی لغو شد و دارایی‌ها به قلعه مبدأ برگشت.");
    } catch(e) {
      showToast(e.message,true);
    }
  }

  async function deletePlayer(id) {
    if (!id) return;
    if (!adminConfirm("این لرد از لیست لردهای ثبت‌شده حذف شود؟ قلعه‌اش آزاد می‌شود.")) return;
    try {
      await api("/api/admin/players/" + encodeURIComponent(id), {method:"DELETE", body:JSON.stringify({})});
      await refreshAdmin();
      players = await api("/api/players");
      renderPlayers();
      renderMap();
      showToast("لرد حذف شد و قلعه آزاد شد.");
    } catch (e) {
      showToast(e.message || "حذف لرد انجام نشد.", true);
    }
  }

  window.khataRefreshMyCastles = renderMyCastles;

  const navSlideDemo = new URLSearchParams(location.search).get("navtest") === "1";
  if (navSlideDemo) document.body.classList.add("nav-slide-demo");

  async function animateNavPage(oldPage, newPage, direction) {
    const main = document.querySelector("main");
    if (!main || !oldPage || oldPage === newPage) {
      document.querySelectorAll(".page").forEach(x => x.classList.toggle("active", x.id === newPage));
      return;
    }
    const oldEl = document.getElementById(oldPage), newEl = document.getElementById(newPage);
    if (!oldEl || !newEl) return;
    const distance = direction > 0 ? "100%" : "-100%";
    const leave = direction > 0 ? "-100%" : "100%";
    const height = Math.max(oldEl.scrollHeight, newEl.scrollHeight, 900);
    main.style.height = height + "px";
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
    oldEl.classList.add("nav-slide-page", "nav-slide-old");
    newEl.classList.add("active", "nav-slide-page", "nav-slide-new");
    newEl.style.transform = "translate3d(" + distance + ",0,0)";
    newEl.style.opacity = "0";
    oldEl.style.transform = "translate3d(0,0,0)";
    oldEl.style.opacity = "1";
    requestAnimationFrame(() => {
      oldEl.style.transform = "translate3d(" + leave + ",0,0)";
      oldEl.style.opacity = "0";
      newEl.style.transform = "translate3d(0,0,0)";
      newEl.style.opacity = "1";
    });
    await new Promise(resolve => setTimeout(resolve, 460));
    oldEl.classList.remove("active", "nav-slide-page", "nav-slide-old");
    newEl.classList.remove("nav-slide-page", "nav-slide-new");
    oldEl.style.cssText = "";
    newEl.style.cssText = "";
    main.style.height = "";
  }

  async function openPage(page) {
    const current = document.querySelector(".nav-btn.active")?.dataset.page || "register";
    const order = [...document.querySelectorAll(".nav-btn")].map(x => x.dataset.page);
    const direction = order.indexOf(page) >= order.indexOf(current) ? 1 : -1;

    if (navSlideDemo) {
      document.querySelectorAll(".nav-btn").forEach(x => x.classList.toggle("active", x.dataset.page === page));
    } else {
      document.querySelectorAll(".nav-btn").forEach(x => x.classList.toggle("active", x.dataset.page === page));
      document.querySelectorAll(".page").forEach(x => x.classList.toggle("active", x.id === page));
    }

    if (page === "players") { players = await api("/api/players"); renderPlayers(); renderMap(); }
    if (page === "myCastles") { players = await api("/api/players"); await renderMyCastles(); }
    if (page === "season") { window.khataLoadWarLog?.(); }

    if (navSlideDemo) {
      await animateNavPage(current, page, direction);
    }

    window.scrollTo({ top: document.querySelector("main")?.offsetTop || 0, behavior: "smooth" });
  }
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => openPage(btn.dataset.page).catch(e => showToast(e.message, true))));

  const ADMIN_RESOURCE_LABELS = {peasants:"👥 رعیت",coins:"💰 سکه",wood:"🪵 چوب",stone:"🪨 سنگ",iron:"⛓ آهن",meat:"🥩 گوشت",fish:"🐟 ماهی",grain:"🌾 غلات",horses:"🐎 اسب",dragon_glass:"🌑 شیشه اژدها",wildfire:"🧪 وایلدفایر",tar:"🛢 قیر",grapes:"🍇 انگور"};
  const ADMIN_EQUIPMENT_LABELS = {ladder:"🪜 نردبان",ram:"🔩 دژکوب",catapult:"☄ منجنیق",scorpion:"🦂 اسکورپین",siege_tower:"🏗 برج محاصره"};
  const ADMIN_ARMY_LABELS = {swordsman:"شمشیرزن",archer:"کماندار",spearman:"نیزه‌دار",cavalry:"سواره‌نظام",ranger:"رنجر",winter_soldier:"سرباز زمستان",vale_knight:"شوالیه ویل",crossbowman:"کراسبودار",red_cloak:"ردا سرخ",dragon_knight:"شوالیه اژدها",axeman:"تبر‌دار",flower_knight:"شوالیه گل",hammer_wielder:"پتک‌دار",dornish_spearman:"نیزه‌دار دورنیش",giant:"غول",giants:"غول"};
  const ADMIN_FLEET_LABELS = {transport:"کشتی ترابری",warship:"کشتی جنگی"};

  function adminConfirm(message){ return window.confirm(message); }
  function adminAssetLines(obj,labels){
    const entries=Object.entries(obj||{}).filter(([,v])=>Number(v)>0);
    return entries.length?entries.map(([k,v])=>'<div class="admin-asset-line"><span>'+escapeHTML(labels[k]||k)+'</span><b>'+Number(v).toLocaleString('en-US')+'</b></div>').join(''):'<div class="admin-muted">بدون مورد</div>';
  }
  function fillAdminRegions(){
    if(!$('adminRegion'))return;
    $('adminRegion').innerHTML=houses.map(r=>'<option value="'+escapeHTML(r.region)+'">'+escapeHTML(r.region)+'</option>').join('');
    if($('adminAssignRegion'))$('adminAssignRegion').innerHTML=houses.map(r=>'<option value="'+escapeHTML(r.region)+'">'+escapeHTML(r.region)+'</option>').join('');
    if($('adminNewCastleRegion'))$('adminNewCastleRegion').innerHTML=houses.map(r=>'<option value="'+escapeHTML(r.region)+'">'+escapeHTML(r.region)+'</option>').join('');
    updateAdminCastles();
    updateAdminAssignCastles();
  }
  function updateAdminCastles(){
    const r=houses.find(x=>x.region===$("adminRegion")?.value); if(!r||!$("adminCastle"))return;
    const occupied=new Set(players.filter(p=>p.region===r.region).map(p=>p.castle));
    $("adminCastle").innerHTML=r.castles.length
      ? r.castles.map(c=>occupied.has(c.castle)
        ? '<option value="'+escapeHTML(c.castle)+'" disabled>'+escapeHTML(c.castle)+' — '+escapeHTML(c.house)+' — Full!</option>'
        : '<option value="'+escapeHTML(c.castle)+'">'+escapeHTML(c.castle)+' — '+escapeHTML(c.house)+'</option>').join('')
      : '<option value="">قلعه‌ای وجود ندارد</option>';
    $("adminAdd").disabled=!r.castles.some(c=>!occupied.has(c.castle));
    const firstFree=r.castles.find(c=>!occupied.has(c.castle));
    if(firstFree) $("adminCastle").value=firstFree.castle;
  }
  function updateAdminAssignPlayers(){
    const select=$("adminAssignPlayer"); if(!select)return;
    const seen=new Set(); const list=adminPlayers.filter(p=>p.accountId&&!seen.has(p.accountId)&&(seen.add(p.accountId),true));
    select.innerHTML=list.length?list.map(p=>'<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.username)+' — '+escapeHTML(p.castle)+'</option>').join(''):'<option value="">پلیر دارای حسابی وجود ندارد</option>';
  }
  function updateAdminAssignCastles(){
    const select=$("adminAssignCastle"),region=$("adminAssignRegion")?.value;
    if(!select||!region)return;
    const r=houses.find(x=>x.region===region);
    if(!r){select.innerHTML='<option value="">اقلیم پیدا نشد</option>'; $("adminAssignCastleBtn").disabled=true; return;}
    const occupied=new Set(players.filter(p=>p.region===region).map(p=>p.castle));
    select.innerHTML=r.castles.length
      ? r.castles.map(c=>occupied.has(c.castle)
        ? '<option value="'+escapeHTML(c.castle)+'" disabled>'+escapeHTML(c.castle)+' — '+escapeHTML(c.house)+' — Full!</option>'
        : '<option value="'+escapeHTML(c.castle)+'">'+escapeHTML(c.castle)+' — '+escapeHTML(c.house)+'</option>').join('')
      : '<option value="">قلعه‌ای وجود ندارد</option>';
    $("adminAssignCastleBtn").disabled=!r.castles.some(c=>!occupied.has(c.castle));
    const firstFree=r.castles.find(c=>!occupied.has(c.castle));
    if(firstFree) select.value=firstFree.castle;
  }
  function adminEditorInput(label,value,path,type="number"){
    return '<label class="admin-editor-field"><span>'+escapeHTML(label)+'</span><input type="'+type+'" '+(type==="number"?'min="0"':'')+' value="'+escapeHTML(value??"")+'" data-admin-path="'+escapeHTML(path)+'"></label>';
  }
  function renderAdminCastleEditor(d){
    const root=$("adminCastleEditor");if(!root)return;
    let html='<div class="admin-editor-title"><div><span>CASTLE ASSETS</span><h3>ویرایش دارایی‌ها</h3></div><span class="admin-muted">'+escapeHTML(d.castle)+'</span></div>';
    html+='<h4>دارایی‌ها</h4><div class="admin-editor-grid">';
    for(const [k,v] of Object.entries(d.resources||{}))html+=adminEditorInput(ADMIN_RESOURCE_LABELS[k]||k,v,'resources.'+k);
    html+='</div><h4>سطح‌ها</h4><div class="admin-editor-grid">'+adminEditorInput('کارگاه',d.workshop?.level,'workshopLevel')+adminEditorInput('اسکله',d.port?.level,'portLevel')+'</div>';
    html+='<label class="admin-check"><input type="checkbox" data-admin-path="portEnabled" '+(d.port?.enabled?'checked':'')+'> اسکله فعال باشد</label>';
    html+='<h4>تولیدی‌ها</h4><div class="admin-editor-grid">';
    for(const [k,v] of Object.entries(d.production||{}))html+=adminEditorInput(v.label||k,v.level,'production.'+k);
    html+='</div><h4>کمپ‌ها</h4><div class="admin-editor-grid">';
    for(const [k,v] of Object.entries(d.camps||{}))html+=adminEditorInput(v.label||k,v.level,'camps.'+k);
    for(const [k,v] of Object.entries(d.specialCamps||{}))html+=adminEditorInput(v.label||k,v.level,'specialCamps.'+k);
    html+='</div><h4>ارتش</h4><div class="admin-editor-grid">';
    for(const [k,v] of Object.entries(d.army||{}))html+=adminEditorInput(ADMIN_ARMY_LABELS[k]||k,v,'army.'+k);
    html+='</div><h4>ادوات</h4><div class="admin-editor-grid">';
    for(const [k,v] of Object.entries(d.equipment||{}))html+=adminEditorInput(ADMIN_EQUIPMENT_LABELS[k]||k,v,'equipment.'+k);
    html+='</div><h4>ناوگان</h4><div class="admin-editor-grid">';
    for(const [k,v] of Object.entries(d.fleet||{}))html+=adminEditorInput(ADMIN_FLEET_LABELS[k]||k,v,'fleet.'+k);
    html+='</div><div class="admin-editor-actions"><button class="primary" id="adminSaveCastleAssets">ذخیره تغییرات</button><button class="ghost" id="adminReloadCastleAssets">بازخوانی</button><button class="danger" id="adminDeleteCastle">حذف قلعه</button></div>';
    root.innerHTML=html;
    $("adminSaveCastleAssets").onclick=saveAdminCastleAssets;
    $("adminReloadCastleAssets").onclick=()=>loadAdminCastleAssets($("adminCastleSelect").value);
    $("adminDeleteCastle").onclick=deleteAdminCastle;
  }
  async function loadAdminCastleAssets(castle){
    if(!castle){$("adminCastleEditor").innerHTML='<div class="admin-empty">یک قلعه انتخاب کن.</div>';return;}
    try{const d=await api('/api/admin/castle-assets?castle='+encodeURIComponent(castle));renderAdminCastleEditor(d);}
    catch(e){showToast(e.message,true);}
  }
  function collectAdminChanges(){
    const changes={resources:{},production:{},camps:{},specialCamps:{},army:{},equipment:{},fleet:{}};
    document.querySelectorAll('[data-admin-path]').forEach(el=>{
      const path=el.dataset.adminPath;if(path==='portEnabled'){changes.portEnabled=el.checked;return;}
      const parts=path.split('.');let target=changes;
      for(let i=0;i<parts.length-1;i++)target=target[parts[i]];
      target[parts[parts.length-1]]=Math.max(0,Math.floor(Number(el.value||0)));
    });
    const special=document.querySelector('[data-admin-special-item]');
    if(special){
      const raw=String(special.value||"").trim();
      if(!raw)changes.specialItem=null;
      else{try{changes.specialItem=JSON.parse(raw);}catch{throw new Error("آیتم ویژه باید JSON معتبر باشد.");}}
    }
    return changes;
  }
  async function saveAdminCastleAssets(){
    const castle=$("adminCastleSelect").value;if(!castle)return;
    if(!adminConfirm('تغییرات دارایی‌های قلعه «'+castle+'» ذخیره شود؟'))return;
    try{await api('/api/admin/castle-assets',{method:'POST',body:JSON.stringify({castle,changes:collectAdminChanges()})});await loadAdminCastleAssets(castle);showToast('دارایی‌های قلعه بروزرسانی شد.');}
    catch(e){showToast(e.message,true);}
  }

  async function deleteAdminCastle(){
    const castle=$("adminCastleSelect").value;if(!castle)return;
    if(!adminConfirm('قلعه «'+castle+'» حذف شود؟ اگر لردی داشته باشد فقط ثبت قلعه او حذف می‌شود و حساب کاربری‌اش باقی می‌ماند.'))return;
    try{
      await api('/api/admin/castles/'+encodeURIComponent(castle),{method:'DELETE',body:JSON.stringify({})});
      await refreshAdmin();
      players=await api('/api/players');renderPlayers();renderMap();
      showToast('قلعه حذف شد.');
    }catch(e){showToast(e.message||'حذف قلعه انجام نشد.',true);}
  }

  async function refreshAdmin(){
    const results=await Promise.allSettled([api('/api/players'),api('/api/admin/players'),api('/api/houses'),api('/api/admin/war-expeditions'),api('/api/admin/trades'),api('/api/admin/controls'),api('/api/admin/castles'),api('/api/admin/game-runtime'),api('/api/admin/scenarios'),api('/api/admin/roles')]);
    const fallback=(i,value)=>results[i]?.status==="fulfilled"?results[i].value:value;
    const [lordList,adminLordList,houseList,warData,tradeData,controlData,castleData,runtimeData,scenarioData,roleData]=[
      fallback(0,[]),fallback(1,[]),fallback(2,[]),fallback(3,{expeditions:[]}),fallback(4,{trades:[]}),fallback(5,{controls:{}}),fallback(6,{castles:[]}),fallback(7,{running:true}),fallback(8,{items:[]}),fallback(9,{items:[]})
    ];
    players=lordList;adminPlayers=adminLordList;houses=houseList;renderPlayers();renderMap();fillAdminRegions();updateAdminAssignPlayers();
    if(results.some(x=>x.status==="rejected"))showToast("بخشی از اطلاعات پنل مدیریت بارگذاری نشد.",true);
    $("adminPlayers").innerHTML=players.length?players.map(p=>'<div class="admin-row"><span>'+escapeHTML(p.username)+' · '+escapeHTML(p.castle)+'</span><button class="delete" type="button" data-action="delete-player" data-id="'+escapeHTML(p.id)+'">DELETE</button></div>').join(''):'<small>هیچ پلیری ثبت نشده.</small>';
    const wars=warData.expeditions||[];$("adminLordCount").textContent=players.length;$("adminWarCount").textContent=wars.length;$("adminActiveWarCount").textContent=wars.filter(x=>x.active).length;
    $("adminWarList").innerHTML=wars.length?wars.map(x=>{let assets={};try{assets=JSON.parse(x.assetsJson||'{}');}catch{};const lines=Object.entries(assets).map(([kind,obj])=>'<div><b>'+escapeHTML(kind==='army'?'نیروها':kind==='equipment'?'ادوات':'ناوگان')+'</b>'+adminAssetLines(obj,kind==='army'?ADMIN_ARMY_LABELS:kind==='equipment'?ADMIN_EQUIPMENT_LABELS:ADMIN_FLEET_LABELS)+'</div>').join('');let outcome=x.outcome?'<div class="admin-war-result">نتیجه: '+(x.outcome==='attacker'?'پیروزی مهاجم':'پیروزی مدافع')+'</div>':['attack','siege'].includes(x.command)?'<div class="admin-future-actions"><button class="primary" data-action="admin-outcome" data-war-id="'+escapeHTML(x.id)+'" data-outcome="attacker">پیروزی مهاجم</button><button class="danger" data-action="admin-outcome" data-war-id="'+escapeHTML(x.id)+'" data-outcome="defender">پیروزی مدافع</button></div>':'';let command=x.command?'<div class="admin-war-command">دستور صادرشده: '+escapeHTML(x.command==='attack'?'حمله':x.command==='deploy'?'استقرار':'محاصره')+'</div>':(!x.active&&!Number(x.cancelled)?'<div class="admin-war-command">رسیده و منتظر دستور</div>':'');return '<article class="admin-war-card '+(x.active?'active ':'')+(Number(x.cancelled)?'cancelled':'')+'"><div class="admin-war-top"><div><span class="admin-war-status">'+(Number(x.cancelled)?'✓ لغو شده':x.command? '✓ دستور ثبت شده':x.active?'● فعال':'⌛ رسیده')+'</span><h3>'+escapeHTML(x.attackerUsername)+' · '+escapeHTML(x.sourceCastle)+' → '+escapeHTML(x.destinationCastle)+'</h3></div><span>'+escapeHTML(x.arrivalTime)+'</span></div><div class="admin-war-details"><span>آیدی پلیر: '+escapeHTML(x.attackerAccountId||'—')+'</span><span>لرد: '+escapeHTML(x.lordName||'—')+'</span><span>نوع: '+(x.type==='sea'?'دریایی':'زمینی')+'</span><span>'+((x.fake)?'فیک':'واقعی')+'</span><span>'+((x.lordPresent)?'لرد حاضر':'لرد غایب')+'</span><span>مدت: '+escapeHTML(String(x.durationMinutes||0))+' دقیقه</span></div><div class="admin-war-assets">'+(lines||'<div class="admin-muted">بدون دارایی</div>')+'</div>'+command+outcome+(x.active&&!Number(x.cancelled)?'<button class="war-cancel-btn" type="button" data-action="admin-cancel-war" data-war-id="'+escapeHTML(x.id)+'">لغو لشکرکشی از طرف ادمین</button>':'')+'</article>';}).join(''):'<div class="admin-empty">هنوز لشکرکشی‌ای ثبت نشده است.</div>';
    const attackWars=wars.filter(x=>x.command==='attack'&&!Number(x.cancelled));
    $("adminCasualtyList").innerHTML=attackWars.length?attackWars.map(x=>{let a={},d={},saved={};try{a=JSON.parse(x.assetsJson||'{}');d=JSON.parse(x.defenderAssetsJson||'{}');saved=JSON.parse(x.casualtiesJson||'{}');}catch{};const done=Object.keys(saved||{}).length>0;const attackerArmy=Object.entries(a.army||{}).map(([k,v])=>'<label class="casualty-field"><span>'+escapeHTML(ADMIN_ARMY_LABELS[k]||k)+' · آورده مهاجم: '+Number(v)+'</span><input type="number" min="0" '+(done?'disabled':'')+' data-cas-side="attacker" data-cas-kind="army" data-cas-key="'+escapeHTML(k)+'"></label>').join('');const attackerEq=Object.entries(a.equipment||{}).map(([k,v])=>'<label class="casualty-field"><span>'+escapeHTML(ADMIN_EQUIPMENT_LABELS[k]||k)+' · آورده مهاجم: '+Number(v)+'</span><input type="number" min="0" '+(done?'disabled':'')+' data-cas-side="attacker" data-cas-kind="equipment" data-cas-key="'+escapeHTML(k)+'"></label>').join('');const defenderArmy=Object.entries(d).map(([k,v])=>'<label class="casualty-field"><span>'+escapeHTML(ADMIN_ARMY_LABELS[k]||k)+' · موجودی زمان حمله: '+Number(v)+'</span><input type="number" min="0" '+(done?'disabled':'')+' data-cas-side="defender" data-cas-kind="army" data-cas-key="'+escapeHTML(k)+'"></label>').join('');return '<article class="admin-war-card"><div class="admin-war-top"><div><span class="admin-war-status">⚔️ حمله</span><h3>'+escapeHTML(x.attackerUsername)+' · '+escapeHTML(x.sourceCastle)+' → '+escapeHTML(x.destinationCastle)+'</h3></div></div><div class="casualty-columns"><div><h4>مهاجم — مقدار نهایی دارایی</h4>'+attackerArmy+attackerEq+'</div><div><h4>مدافع — مقدار افزوده به دارایی فعلی</h4>'+defenderArmy+'</div></div>'+(done?'<div class="admin-war-result">✓ تلفات ثبت شده است.</div>':'<button class="primary" data-action="save-casualties" data-war-id="'+escapeHTML(x.id)+'">ثبت تلفات</button>')+'</article>';}).join(''):'<div class="admin-empty">هنوز دستوری با عنوان حمله برای ثبت تلفات وجود ندارد.</div>';
    const trades=tradeData.trades||[];$("adminTradeCount").textContent=trades.length;$("adminTradeList").innerHTML=trades.length?trades.map(x=>'<article class="admin-trade-card"><div class="admin-trade-head"><div><b>'+escapeHTML(x.sender_username||'—')+'</b> · '+escapeHTML(x.sender_castle)+' → <b>'+escapeHTML(x.receiver_username||'—')+'</b> · '+escapeHTML(x.receiver_castle)+'</div><span>'+escapeHTML(x.status)+'</span></div><div class="admin-trade-ids">فرستنده ID: '+escapeHTML(x.sender_account_id)+' · گیرنده ID: '+escapeHTML(x.receiver_account_id)+' · درخواست ID: '+escapeHTML(x.id)+'</div><div class="admin-trade-assets"><div><strong>ارسال</strong>'+adminAssetLines(x.sendAssets,ADMIN_RESOURCE_LABELS)+'</div><div><strong>دریافت</strong>'+adminAssetLines(x.receiveAssets,ADMIN_RESOURCE_LABELS)+'</div></div><small>'+escapeHTML(x.created_at)+(x.responded_at?' · پاسخ: '+escapeHTML(x.responded_at):'')+'</small></article>').join(''):'<div class="admin-empty">هنوز تجارتی ثبت نشده است.</div>';
    const scenarios=Array.isArray(scenarioData.items)?scenarioData.items:[],roles=Array.isArray(roleData.items)?roleData.items:[];
    $("adminScenarioList").innerHTML=scenarios.length?scenarios.map(x=>'<article class="admin-war-card"><div class="admin-war-top"><div><span class="admin-war-status">📝 سناریو</span><h3>'+escapeHTML(x.username)+' · '+escapeHTML(x.lordName||'—')+'</h3></div><span>'+escapeHTML(x.side==="attacker"?'مهاجم':'مدافع')+'</span></div><div class="admin-war-details"><span>قلعه: '+escapeHTML(x.castle)+'</span><span>نبرد: '+escapeHTML(x.warId)+'</span><span>'+escapeHTML(x.createdAt)+'</span></div><div class="admin-war-assets"><div class="admin-asset-line"><span>متن سناریو</span><b style="white-space:pre-wrap;text-align:right">'+escapeHTML(x.text)+'</b></div></div></article>').join(''):'<div class="admin-empty">هنوز سناریویی ارسال نشده است.</div>';
    $("adminRoleList").innerHTML=roles.length?roles.map(x=>'<article class="admin-war-card"><div class="admin-war-top"><div><span class="admin-war-status">📝 رول</span><h3>'+escapeHTML(x.username)+' · '+escapeHTML(x.lordName||'—')+'</h3></div><span>'+escapeHTML(x.castle)+'</span></div><div class="admin-war-details"><span>'+escapeHTML(x.createdAt)+'</span></div><div class="admin-war-assets"><div class="admin-asset-line"><span>متن رول</span><b style="white-space:pre-wrap;text-align:right">'+escapeHTML(x.text)+'</b></div></div></article>').join(''):'<div class="admin-empty">هنوز رولی ارسال نشده است.</div>';
    const controls=controlData.controls||{};$("adminWarLockBtn").textContent=controls.war?'🔓 باز کردن لشکرکشی':'🔒 قفل کردن لشکرکشی';$("adminTradeLockBtn").textContent=controls.trade?'🔓 باز کردن تجارت':'🔒 قفل کردن تجارت';$("adminClaimLockBtn").textContent=controls.claim?'🔓 باز کردن انتخاب قلعه':'🔒 قفل کردن انتخاب قلعه';$("adminWarLockState").textContent=controls.war?'قفل است':'باز است';$("adminTradeLockState").textContent=controls.trade?'قفل است':'باز است';$("adminClaimLockState").textContent=controls.claim?'قفل است':'باز است';$("adminGameRunState").textContent=runtimeData.running?'در حال اجرا':'متوقف';
    const castles=castleData.castles||[];const previousCastle=$("adminCastleSelect")?.value;$("adminCastleSelect").innerHTML=castles.map(c=>'<option value="'+escapeHTML(c.castle)+'">'+escapeHTML(c.castle)+' — '+escapeHTML(c.region)+' — '+escapeHTML(c.username||'آزاد')+'</option>').join('');const selectedCastle=castles.some(c=>c.castle===previousCastle)?previousCastle:castles[0]?.castle;if(selectedCastle){$("adminCastleSelect").value=selectedCastle;await loadAdminCastleAssets(selectedCastle);}
  }
  async function toggleAdminControl(key){
    const button=key==='war'?$("adminWarLockBtn"):key==='trade'?$("adminTradeLockBtn"):$("adminClaimLockBtn");const currentlyLocked=button.textContent.includes('باز کردن');
    const action=currentlyLocked?'باز کردن':'قفل کردن';
    const label=key==='war'?'لشکرکشی':key==='trade'?'تجارت':'انتخاب قلعه';
    if(!adminConfirm(action+' '+label+' انجام شود؟'))return;
    try{await api('/api/admin/controls',{method:'POST',body:JSON.stringify({key,locked:!currentlyLocked})});await refreshAdmin();showToast(action+' انجام شد.');}catch(e){showToast(e.message,true);}
  }
  async function runAdminWeeklyUpdate(){
    if(!adminConfirm('آپدیت هفتگی انجام شود؟ بازدهی تولیدی‌ها و کمپ‌ها و تولید بندر برای همه قلعه‌ها اعمال می‌شود و این عملیات برای هفته جاری ثبت خواهد شد.'))return;
    try{await api('/api/admin/weekly-update',{method:'POST',body:JSON.stringify({})});showToast('آپدیت هفتگی انجام شد.');await refreshAdmin();}catch(e){showToast(e.message,true);}
  }
  async function assignAdminCastle(){
    const player=$("adminAssignPlayer").value,region=$("adminAssignRegion").value,castle=$("adminAssignCastle").value;
    if(!player||!castle)return showToast('پلیر و قلعه را انتخاب کن.',true);
    if(!adminConfirm('قلعه «'+castle+'» به این پلیر اضافه شود؟'))return;
    try{await api('/api/admin/players/'+encodeURIComponent(player)+'/castles',{method:'POST',body:JSON.stringify({region,castle})});await refreshAdmin();showToast('قلعه به لیست پلیر اضافه شد.');}catch(e){showToast(e.message,true);}
  }

  async function addAdminLord(){
    const username=$("adminUsername").value.trim();
    const region=$("adminRegion").value;
    const castle=$("adminCastle").value;
    if(!username||!region||!castle)return showToast('Username، اقلیم و قلعه را انتخاب کن.',true);
    if(!adminConfirm('لرد «'+username+'» برای قلعه «'+castle+'» ثبت شود؟'))return;
    try{
      await api('/api/admin/players',{method:'POST',body:JSON.stringify({username,region,castle})});
      $("adminUsername").value="";
      await refreshAdmin();
      showToast('لرد با موفقیت ثبت شد.');
    }catch(e){
      showToast(e.message||'ثبت لرد انجام نشد.',true);
    }
  }

  async function setAdminGameRuntime(action){try{await api('/api/admin/game-runtime',{method:'POST',body:JSON.stringify({action})});await refreshAdmin();showToast(action==='start'?'بازی شروع شد.':'بازی متوقف شد.');}catch(e){showToast(e.message,true);}}
  async function saveAdminCasualties(id){
    const payload={attacker:{army:{},equipment:{}},defender:{army:{}}};
    document.querySelectorAll('[data-cas-side]').forEach(el=>{const n=String(el.value||'').trim();if(n==='')return;const side=el.dataset.casSide,kind=el.dataset.casKind,key=el.dataset.casKey;payload[side][kind]??={};payload[side][kind][key]=Math.floor(Number(n));});
    if(!Object.values(payload.attacker.army).length&&!Object.values(payload.attacker.equipment).length&&!Object.values(payload.defender.army).length)return showToast('حداقل یک مقدار وارد کن.',true);
    if(!adminConfirm('تلفات ثبت شود؟'))return;
    try{await api('/api/admin/war-expeditions/'+encodeURIComponent(id)+'/casualties',{method:'POST',body:JSON.stringify(payload)});await refreshAdmin();showToast('تلفات ثبت شد.');}catch(e){showToast(e.message,true);}
  }
  async function setAdminOutcome(id,outcome){if(!adminConfirm(outcome==='attacker'?'پیروزی مهاجم ثبت شود؟':'پیروزی مدافع ثبت شود؟'))return;try{await api('/api/admin/war-expeditions/'+encodeURIComponent(id)+'/outcome',{method:'POST',body:JSON.stringify({outcome})});await refreshAdmin();await window.khataLoadWarLog?.();showToast('نتیجه ثبت شد.');}catch(e){showToast(e.message,true);}}
  async function addAdminCastle(){const name=$('adminNewCastleName').value.trim(),region=$('adminNewCastleRegion').value,naval=$('adminNewCastleNaval').checked;if(!name)return showToast('نام قلعه را وارد کن.',true);if(!adminConfirm('قلعه «'+name+'» ثبت شود؟'))return;try{await api('/api/admin/castles',{method:'POST',body:JSON.stringify({name,region,naval})});$('adminNewCastleName').value='';$('adminNewCastleNaval').checked=false;await refreshAdmin();showToast('قلعه با موفقیت اضافه شد.');}catch(e){showToast(e.message,true);}}

  $("adminRegion").addEventListener("change",updateAdminCastles);
  $("adminAssignRegion")?.addEventListener("change",updateAdminAssignCastles);
  $("adminAssignPlayer")?.addEventListener("change",updateAdminAssignCastles);
  $("adminCastleSelect")?.addEventListener("change",()=>loadAdminCastleAssets($("adminCastleSelect").value));
  $("adminRefreshWars").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminRefreshTrades").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminWarLockBtn").onclick=()=>toggleAdminControl('war');
  $("adminClaimLockBtn").onclick=()=>toggleAdminControl('claim');
  $("adminRefreshScenarios").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminRefreshRoles").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminGameStart").onclick=()=>setAdminGameRuntime('start');
  $("adminGameStop").onclick=()=>setAdminGameRuntime('stop');
  $("adminRefreshCasualties").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminNewCastleBtn").onclick=addAdminCastle;
  $("adminAdd").onclick=addAdminLord;
  $("adminTradeLockBtn").onclick=()=>toggleAdminControl('trade');
  $("adminWeeklyUpdate").onclick=runAdminWeeklyUpdate;
  $("adminAssignCastleBtn").onclick=assignAdminCastle;

  function openAdminPanel(target){
    const panels=document.querySelectorAll("[data-admin-panel]");
    const buttons=document.querySelectorAll("[data-admin-target]");
    panels.forEach(p=>p.classList.toggle("active",p.dataset.adminPanel===target));
    buttons.forEach(b=>b.classList.toggle("active",b.dataset.adminTarget===target));
    const active=document.querySelector('[data-admin-panel="'+target+'"]');
    if(active) active.scrollTop=0;
  }
  document.querySelectorAll("[data-admin-target]").forEach(btn=>{
    btn.addEventListener("click",()=>openAdminPanel(btn.dataset.adminTarget));
  });

  $("adminLogout").onclick = async () => { try { await api("/api/admin/logout", { method: "POST" }); } catch {} currentUser = null; document.body.classList.remove("admin-mode"); resetGameState(); showAuth(); setAuthTab("login"); };

  $("adminLink")?.addEventListener("click", () => {
    if (!currentUser) {
      adminRequested = true;
      sessionStorage.setItem("khata_admin_requested", "1");
      setAuthTab("login");
      setMessage("authMessage", "error", "ابتدا وارد حساب کاربری شوید؛ سپس بخش مدیریت باز می‌شود.");
      $("loginUsername").focus();
      return;
    }
    showAdminOnly(); checkAdminSession().catch(e => setMessage("adminMessage", "error", e.message));
  });

  function showAdminOnly() {
    $("authScreen").classList.add("hidden"); $("gameLobby").classList.add("hidden"); $("gameApp").classList.remove("hidden");
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active")); $("admin").classList.add("active"); document.body.classList.add("admin-mode");
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active")); window.scrollTo({ top: 0, behavior: "auto" });
  }
  async function checkAdminSession() {
    const status = await api("/api/admin/status");
    $("adminLoginBox").classList.toggle("hidden", status.admin);
    $("adminPanel").classList.toggle("hidden", !status.admin);
    if (status.admin) {
      try { await refreshAdmin(); }
      catch (e) {
        console.error("Admin refresh failed:", e);
        $("adminPanel").classList.remove("hidden");
        setMessage("adminMessage", "error", "پنل ادمین باز شد، اما بارگذاری اطلاعات با خطا مواجه شد: " + e.message);
      }
    }
  }

  $("adminLogin").onclick = async () => {
    const button = $("adminLogin");
    const password = $("adminPassword").value;
    setMessage("adminMessage", "", "");
    if (!password) {
      setMessage("adminMessage", "error", "رمز مدیر را وارد کنید.");
      $("adminPassword").focus();
      return;
    }
    button.disabled = true;
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      $("adminPassword").value = "";
      await checkAdminSession();
      if (new URLSearchParams(location.search).get("admin") !== "1") {
        history.replaceState({}, "", "?admin=1");
      }
    } catch (err) {
      setMessage("adminMessage", "error", err.message);
    } finally {
      button.disabled = false;
    }
  };

  function showToast(message, isError = false) {
    let root = $("toast");
    if (!root) { root = document.createElement("div"); root.id = "toast"; root.className = "toast"; document.body.appendChild(root); }
    root.className = `toast ${isError ? "toast-error" : ""} show`; root.textContent = message;
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => root.classList.remove("show"), 3600);
  }

  // One delegated handler covers dynamic buttons and removes inline onclick usage.
  document.addEventListener("click", e => {
    const target = e.target.closest("[data-action]"); if (!target) return;
    const action = target.dataset.action;
    if (action === "lord") { e.preventDefault(); e.stopPropagation(); window.khataOpenCharacter?.(target.dataset.lord); return; }
    if (action === "region") openRegion(Number(target.dataset.index));
    else if (action === "back-regions") backRegions();
    else if (action === "castle") openCastleDetails(Number(target.dataset.region), Number(target.dataset.castle));
    else if (action === "my-castle-manage") { e.preventDefault(); e.stopImmediatePropagation(); openCastleManagementSafe(target.dataset.castle); }
    else if (action === "war-expedition") window.khataOpenWarExpedition?.(target.dataset.castle);
    else if (action === "trade") window.khataOpenTrade?.(target.dataset.castle);
    else if (action === "trade-requests") window.khataOpenTradeRequests?.();
    else if (action === "cancel-war") { e.preventDefault(); e.stopImmediatePropagation(); e.__khataMyCastleHandled = true; cancelWarExpedition(target.dataset.warId); }
    else if (action === "scenario-submit") openSubmission("scenario",{warId:target.dataset.warId,side:target.dataset.side,castle:target.dataset.castle,opponentCastle:target.dataset.opponent||""});
    else if (action === "role-submit") { if(!target.disabled) openSubmission("role",{castle:target.dataset.castle}); }
    else if (action === "admin-cancel-war") cancelAdminWar(target.dataset.warId);
    else if (action === "admin-outcome") setAdminOutcome(target.dataset.warId,target.dataset.outcome);
    else if (action === "save-casualties") saveAdminCasualties(target.dataset.warId);
    else if (action === "claim") { if(claimLocked) showToast("انتخاب قلعه فعلاً توسط ادمین قفل است.",true); else openClaim(Number(target.dataset.region), Number(target.dataset.castle)); }
    else if (action === "go-register") openPage("register").catch(() => {});
    else if (action === "delete-player") deletePlayer(target.dataset.id);
  });

  async function openCastleManagementSafe(castle) {
    const modal = $("castleManagementModal");
    const root = $("castleManagementRoot");
    if (!modal || !root) return;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    root.innerHTML = '<div class="cm-placeholder">در حال بارگذاری مدیریت قلعه...</div>';
    try {
      if (typeof window.khataOpenCastleManagement !== "function") {
        await new Promise((resolve, reject) => {
          const tag = document.createElement("script");
          tag.src = "/js/castle-management-v2.js?v=10";
          tag.onload = resolve;
          tag.onerror = () => reject(new Error("فایل مدیریت قلعه بارگذاری نشد."));
          document.head.appendChild(tag);
        });
      }
      if (typeof window.khataOpenCastleManagement !== "function") {
        throw new Error("مدیریت قلعه بارگذاری نشد.");
      }
      await window.khataOpenCastleManagement(castle);
    } catch (err) {
      root.innerHTML = '<div class="cm-error">❌ ' + escapeHTML(err.message || "مدیریت قلعه باز نشد.") + '</div>';
    }
  }

  // Map zoom is bounded and works with mouse/touch-friendly controls.
  $("mapZoomIn").onclick = () => { mapScale = Math.min(1.6, +(mapScale + .1).toFixed(1)); updateMapZoom(); };
  $("mapZoomOut").onclick = () => { mapScale = Math.max(1, +(mapScale - .1).toFixed(1)); updateMapZoom(); };
  $("mapZoomReset").onclick = () => { mapScale = 1; updateMapZoom(); };

  window.addEventListener("scroll", () => { if (currentUser && !$("gameApp").classList.contains("hidden")) $("gameApp").classList.toggle("scrolled", window.scrollY > 180); }, { passive: true });

  boot();
});

// Fallback handlers for My Castles controls. These live outside the main initializer so they still work if an unrelated optional initializer fails.
document.addEventListener("click", async e => {
  const manage = e.target.closest('[data-action="my-castle-manage"]');
  if (manage && !e.__khataMyCastleHandled) {
    e.__khataMyCastleHandled = true;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (typeof window.khataOpenCastleManagement === "function") {
      await window.khataOpenCastleManagement(manage.dataset.castle);
    } else {
      await new Promise((resolve, reject) => {
        const tag = document.createElement("script");
        tag.src = "/js/castle-management-v2.js?v=10";
        tag.onload = resolve;
        tag.onerror = () => reject(new Error("فایل مدیریت قلعه بارگذاری نشد."));
        document.head.appendChild(tag);
      });
      await window.khataOpenCastleManagement?.(manage.dataset.castle);
    }
    return;
  }
  const cancel = e.target.closest('[data-action="cancel-war"]');
  if (cancel && !e.__khataMyCastleHandled) {
    e.__khataMyCastleHandled = true;
    e.preventDefault();
    e.stopImmediatePropagation();
    const id = cancel.dataset.warId;
    if (!id || !confirm("این لشکرکشی لغو شود؟ نیروها و ادوات انتخاب‌شده به قلعه بازمی‌گردند.")) return;
    cancel.disabled = true;
    cancel.textContent = "در حال لغو...";
    try {
      const res = await fetch("/api/war-expeditions/" + encodeURIComponent(id) + "/cancel", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "لغو لشکرکشی انجام نشد.");
      if (typeof window.khataRefreshMyCastles === "function") await window.khataRefreshMyCastles();
      window.khataLoadWarLog?.();
      showMyCastleFallbackToast("لشکرکشی لغو شد و نیروها و ادوات به قلعه مبدأ برگشتند.");
    } catch (err) {
      cancel.disabled = false;
      cancel.textContent = "لغو لشکرکشی";
      showMyCastleFallbackToast(err.message || "لغو لشکرکشی انجام نشد.", true);
    }
  }
});
function showMyCastleFallbackToast(message, isError=false) {
  const root = document.getElementById("toast") || (() => {
    const x = document.createElement("div"); x.id = "toast"; x.className = "toast"; document.body.appendChild(x); return x;
  })();
  root.className = "toast " + (isError ? "toast-error " : "") + "show";
  root.textContent = message;
  clearTimeout(window.__khataFallbackToastTimer);
  window.__khataFallbackToastTimer = setTimeout(() => root.classList.remove("show"), 3600);
}

// Small cinematic blood-drop effect at every click, disabled for keyboard and touch precision.
document.addEventListener("click", e => {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const splash = document.createElement("span"); splash.className = "blood-splash"; splash.style.left = e.clientX + "px"; splash.style.top = (e.clientY + 4) + "px";
  splash.innerHTML = '<i class="drop"></i><i class="drop"></i><i class="drop"></i>'; document.body.appendChild(splash); setTimeout(() => splash.remove(), 900);
});
