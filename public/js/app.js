window.addEventListener("DOMContentLoaded", () => {
  let houses = [], players = [], adminPlayers = [], selected = null, currentUser = null, adminWars = [];
  let castleRequestId = 0;
  let adminRequested = new URLSearchParams(location.search).get("admin") === "1";
  const $ = id => document.getElementById(id);

  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));
  const stripAt = value => String(value || "").replace(/^@+/, "");

  async function api(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const res = await fetch(url, { cache: "no-store", ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || "خطایی رخ داد.");
      error.status = res.status;
      throw error;
    }
    return data;
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
    houses = await api("/api/houses");
    players = await api("/api/players");
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
      return `<button class="castle-card ${p ? "claimed" : "available"}" type="button" data-action="castle" data-region="${i}" data-castle="${j}"><div class="castle-top"><span class="castle-icon">${escapeHTML(c.icon)}</span><span class="status">${p ? "🔒 CLAIMED" : "🟢 AVAILABLE"}</span></div><h3>${escapeHTML(c.castle)}</h3><div class="house">HOUSE ${escapeHTML(c.house)}</div><div class="claim-by">${p ? escapeHTML(p.username) : "مشاهده اطلاعات و موقعیت قلعه"}</div>${window.khataLordByCastle?.[c.castle] ? `<span class="lord-link" data-action="lord" data-lord="${escapeHTML(window.khataLordByCastle[c.castle])}">مشاهده لرد</span>` : ""}</button>`;
    }).join("")}</div>`;
  }
  function backRegions() { $("castles").classList.add("hidden"); $("regions").classList.remove("hidden"); }

  async function openCastleDetails(regionIndex, castleIndex) {
    const r = houses[regionIndex], c = r?.castles[castleIndex];
    if (!r || !c) return;
    const requestId = ++castleRequestId;
    const p = players.find(x => x.region === r.region && x.castle === c.castle);
    $("castleDetails").innerHTML = `<div class="modal-loading"><span class="spinner"></span> در حال دریافت اطلاعات قلعه...</div>`;
    openModal("castleModal");
    let info = {};
    try { info = await api("/api/castles/" + encodeURIComponent(c.castle)); } catch (e) { console.warn(e); }
    if (requestId !== castleRequestId) return;
    $("castleDetails").innerHTML = `<div class="detail-icon">${escapeHTML(c.icon)}</div><div class="eyebrow">${escapeHTML(r.region)}</div><h2>${escapeHTML(c.castle)}</h2><div class="detail-house">HOUSE ${escapeHTML(c.house)}</div><div class="detail-grid"><div><span>📍 LOCATION</span><b>${escapeHTML(info.location || r.region)}</b></div><div><span>🏰 CASTLE</span><b>${escapeHTML(c.castle)}</b></div><div><span>👑 RULING HOUSE</span><b>${escapeHTML(c.house)}</b></div><div><span>STATUS</span><b class="${p ? "taken" : "free"}">${p ? "OCCUPIED · " + escapeHTML(p.username) : "FREE"}</b></div></div><p class="detail-description">${escapeHTML(info.description || "اطلاعات این قلعه در حال تکمیل است.")}</p>${p ? "" : `<button class="primary wide" type="button" data-action="claim" data-region="${regionIndex}" data-castle="${castleIndex}">CLAIM THIS CASTLE</button>`}`;
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
    $("regionPanel").innerHTML = `<div class="region-panel-head"><div class="panel-icon">${escapeHTML(r.icon)}</div><div><span>REALM</span><h3>${escapeHTML(regionShort[r.region] || r.region)}</h3><small>${r.castles.length} CASTLES · ${claimed} CLAIMED</small></div></div><div class="region-panel-divider"></div><p class="panel-hint">خاندان‌ها و قلعه‌ها</p><div class="region-castles">${r.castles.map((c, i) => { const p = players.find(x => x.region === r.region && x.castle === c.castle); return `<button class="region-castle ${p ? "claimed" : "free"}" type="button" data-action="castle" data-region="${index}" data-castle="${i}"><span class="castle-mini-icon">${escapeHTML(c.icon)}</span><span class="castle-info"><strong>${escapeHTML(c.castle)}</strong><small>HOUSE ${escapeHTML(c.house)}</small></span><span class="castle-state">${p ? "♛ " + escapeHTML(p.username) : "FREE"}</span></button>`; }).join("")}</div>`;
  }

  function renderPlayers() {
    $("playerCount").textContent = players.length;
    $("playerList").innerHTML = houses.map(r => {
      const rp = players.filter(p => p.region === r.region);
      if (!rp.length) return `<div class="realm-group empty"><div class="realm-heading"><span>${escapeHTML(r.icon)} ${escapeHTML(r.region)}</span><small>0 / ${r.castles.length} CLAIMED</small></div><div class="empty-realm">هنوز لردی در این اقلیم ثبت نشده است.</div></div>`;
      return `<div class="realm-group"><div class="realm-heading"><span>${escapeHTML(r.icon)} ${escapeHTML(r.region)}</span><small>${rp.length} / ${r.castles.length} CLAIMED</small></div>${rp.map(p => `<div class="player"><div><strong>${escapeHTML(p.username)}</strong><small>${escapeHTML(p.house)}</small></div><div class="castle">${escapeHTML(p.castle)}</div></div>`).join("")}</div>`;
    }).join("");
  }

  async function renderMyCastles() {
    const root = $("myCastlesList"); if (!root || !currentUser) return;
    let mine = [];
    let activeWars = [];
    let arrivedWars = [];
    let tradeNotice = {byCastle:{}};
    try { [mine, activeWars, arrivedWars, tradeNotice] = await Promise.all([api("/api/my-castles"), api("/api/my-war-expeditions/active"), api("/api/my-war-expeditions/arrived"), api("/api/trades/notifications")]); }
    catch { mine = players.filter(p => p.accountId === currentUser.id); }
    if (!mine.length) {
      root.innerHTML = `<div class="my-castles-empty"><div class="empty-castle-icon">🏰</div><h3>NO CASTLES YET</h3><p>هنوز هیچ قلعه‌ای با این حساب ثبت نشده است.</p><button class="primary" type="button" data-action="go-register">انتخاب قلعه</button></div>`;
      return;
    }
    root.innerHTML = mine.map(p => {
      const r = houses.find(x => x.region === p.region), c = r?.castles.find(x => x.castle === p.castle);
      const wars = (activeWars.expeditions||[]).filter(w => w.sourceCastle === p.castle);
      const arrived = (arrivedWars.expeditions||[]).filter(w => w.sourceCastle === p.castle && !w.command);
      const badge = Number(tradeNotice.byCastle?.[p.castle]||0);
      const warHtml = (wars.length || arrived.length) ? '<div class="my-castle-war">'+wars.map(w => `<article class="active-war-card"><strong>⚔️ لشکرکشی به ${escapeHTML(w.destinationCastle)} — ${Math.ceil(Number(w.remainingSeconds||0)/60)} دقیقه باقی‌مانده</strong><div>${w.type==='sea'?'دریایی':'زمینی'} ${w.fake?' · فیک':''}</div><button class="war-cancel-btn" type="button" data-action="cancel-war" data-war-id="${escapeHTML(w.id)}">لغو لشکرکشی</button></article>`).join('')+arrived.map(w=>`<article class="active-war-card arrived-war-card"><strong>⚔️ لشکرکشی به ${escapeHTML(w.destinationCastle)} رسید.</strong><div>دستور خود را وارد کنید</div><div class="war-command-actions"><button type="button" data-action="war-command" data-command="attack" data-war-id="${escapeHTML(w.id)}">حمله</button><button type="button" data-action="war-command" data-command="deployment" data-war-id="${escapeHTML(w.id)}">استقرار</button><button type="button" data-action="war-command" data-command="siege" data-war-id="${escapeHTML(w.id)}">محاصره</button></div></article>`).join('')+'</div>' : '';
      return `<article class="my-castle-card"><div class="my-castle-art">${escapeHTML(c?.icon || "🏰")}</div><div class="my-castle-body"><span class="my-castle-region">${escapeHTML(r?.icon || "")} ${escapeHTML(p.region)}</span><h3>${escapeHTML(p.castle)}</h3><p>HOUSE ${escapeHTML(p.house)}</p><div class="my-castle-meta"><span>👤 ${escapeHTML(p.username)}</span><span class="owned-badge">YOUR CASTLE</span></div></div><div class="my-castle-actions"><button class="castle-open" type="button" data-action="my-castle-manage">🏰 مدیریت قلعه</button><button class="castle-open" type="button" data-action="war-expedition">⚔️ لشکرکشی</button><button class="castle-open trade-open" type="button" data-action="trade" data-castle="${escapeHTML(p.castle)}">⚖️ تجارت <span class="trade-badge-wrap"><span class="trade-badge ${badge?'':'hidden'}" data-trade-notification="${escapeHTML(p.castle)}">${badge||''}</span></span></button><button class="castle-open trade-request-open" type="button" data-action="trade-requests">📜 درخواست تجارت</button></div>${warHtml}</article>`;
    }).join("");
    window.khataRefreshTradeNotifications?.();
  }
  async function issueWarCommand(id,command){
    try{await api("/api/war-expeditions/"+encodeURIComponent(id)+"/command",{method:"POST",body:JSON.stringify({command})});await renderMyCastles();await window.khataLoadWarLog?.();showToast("دستور ثبت شد.");}
    catch(e){showToast(e.message,true);}
  }
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
    if (page === "warsLive") { window.khataLoadWarsLive?.(); }

    if (navSlideDemo) {
      await animateNavPage(current, page, direction);
    }

    window.scrollTo({ top: document.querySelector("main")?.offsetTop || 0, behavior: "smooth" });
  }
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => openPage(btn.dataset.page).catch(e => showToast(e.message, true))));

  const ADMIN_RESOURCE_LABELS = {peasants:"👥 رعیت",coins:"💰 سکه",wood:"🪵 چوب",stone:"🪨 سنگ",iron:"⛓ آهن",meat:"🥩 گوشت",fish:"🐟 ماهی",grain:"🌾 غلات",horses:"🐎 اسب",dragon_glass:"🌑 شیشه اژدها",wildfire:"🧪 وایلدفایر",tar:"🛢 قیر",grapes:"🍇 انگور"};
  const ADMIN_EQUIPMENT_LABELS = {ladder:"🪜 نردبان",ram:"🔩 دژکوب",catapult:"☄ منجنیق",scorpion:"🦂 اسکورپین",siege_tower:"🏗 برج محاصره"};
  const ADMIN_ARMY_LABELS = {swordsman:"شمشیرزن",archer:"کماندار",spearman:"نیزه‌دار",cavalry:"سواره‌نظام",giant:"غول",giants:"غول"};
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
    updateAdminCastles();
    updateAdminAssignCastles();
    if($('adminNewCastleRegion'))$('adminNewCastleRegion').innerHTML=houses.map(r=>'<option value="'+escapeHTML(r.region)+'">'+escapeHTML(r.region)+'</option>').join('');
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
    html+='</div><div class="admin-editor-actions"><button class="primary" id="adminSaveCastleAssets">ذخیره تغییرات</button><button class="ghost" id="adminReloadCastleAssets">بازخوانی</button></div>';
    root.innerHTML=html;
    $("adminSaveCastleAssets").onclick=saveAdminCastleAssets;
    $("adminReloadCastleAssets").onclick=()=>loadAdminCastleAssets($("adminCastleSelect").value);
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
    return changes;
  }
  async function saveAdminCastleAssets(){
    const castle=$("adminCastleSelect").value;if(!castle)return;
    if(!adminConfirm('تغییرات دارایی‌های قلعه «'+castle+'» ذخیره شود؟'))return;
    try{await api('/api/admin/castle-assets',{method:'POST',body:JSON.stringify({castle,changes:collectAdminChanges()})});await loadAdminCastleAssets(castle);showToast('دارایی‌های قلعه بروزرسانی شد.');}
    catch(e){showToast(e.message,true);}
  }

  async function refreshAdmin(){
    const [lordList,adminLordList,houseList,warData,tradeData,controlData,castleData,gameData]=await Promise.all([api('/api/players'),api('/api/admin/players'),api('/api/houses'),api('/api/admin/war-expeditions'),api('/api/admin/trades'),api('/api/admin/controls'),api('/api/admin/castles'),api('/api/game/status')]);
    players=lordList;adminPlayers=adminLordList;houses=houseList;renderPlayers();renderMap();fillAdminRegions();updateAdminAssignPlayers();
    $("adminPlayers").innerHTML=players.length?players.map(p=>'<div class="admin-row"><span>'+escapeHTML(p.username)+' · '+escapeHTML(p.castle)+'</span><button class="delete" type="button" data-action="delete-player" data-id="'+escapeHTML(p.id)+'">DELETE</button></div>').join(''):'<small>هیچ پلیری ثبت نشده.</small>';
    const wars=warData.expeditions||[]; adminWars=wars;
    $("adminLordCount").textContent=players.length;$("adminWarCount").textContent=wars.length;$("adminActiveWarCount").textContent=wars.filter(x=>x.active).length;
    $("adminWarList").innerHTML=wars.length?wars.map(x=>{let assets={};try{assets=JSON.parse(x.assetsJson||'{}');}catch{};const lines=Object.entries(assets).map(([kind,obj])=>'<div><b>'+escapeHTML(kind==='army'?'نیروها':kind==='equipment'?'ادوات':'ناوگان')+'</b>'+adminAssetLines(obj,kind==='army'?ADMIN_ARMY_LABELS:kind==='equipment'?ADMIN_EQUIPMENT_LABELS:ADMIN_FLEET_LABELS)+'</div>').join('');return '<article class="admin-war-card '+(x.active?'active ':'')+(Number(x.cancelled)?'cancelled':'')+'"><div class="admin-war-top"><div><span class="admin-war-status">'+(Number(x.cancelled)?'✓ لغو شده':x.active?'● فعال':'⌛ رسیده')+'</span><h3>'+escapeHTML(x.attackerUsername)+' · '+escapeHTML(x.sourceCastle)+' → '+escapeHTML(x.destinationCastle)+'</h3></div><span>'+escapeHTML(x.arrivalTime)+'</span></div><div class="admin-war-details"><span>آیدی پلیر: '+escapeHTML(x.attackerAccountId||'—')+'</span><span>لرد: '+escapeHTML(x.lordName||'—')+'</span><span>نوع: '+(x.type==='sea'?'دریایی':'زمینی')+'</span><span>'+((x.fake)?'فیک':'واقعی')+'</span><span>ثبت: '+escapeHTML(x.createdAt)+'</span></div><div class="admin-war-assets">'+(lines||'<div class="admin-muted">بدون دارایی</div>')+'</div>'+(x.active&&!Number(x.cancelled)?'<button class="war-cancel-btn" type="button" data-action="admin-cancel-war" data-war-id="'+escapeHTML(x.id)+'">لغو لشکرکشی از طرف ادمین</button>':'')+'</article>';}).join(''):'<div class="admin-empty">هنوز لشکرکشی‌ای ثبت نشده است.</div>';
    const trades=tradeData.trades||[];
    $("adminCasualtyList").innerHTML=wars.filter(x=>!Number(x.cancelled)&&!x.active&&x.command==='attack'&&String(x.casualtiesJson||'{}')==='{}').map(x=>'<article class="admin-war-card"><h3>'+escapeHTML(x.attackerUsername)+' · '+escapeHTML(x.sourceCastle)+' → '+escapeHTML(x.destinationCastle)+'</h3><p>دستور حمله ثبت شده؛ تلفات را وارد کن.</p><button class="primary" type="button" data-action="admin-open-casualty" data-war-id="'+escapeHTML(x.id)+'">ورود تلفات</button></article>').join('')||'<div class="admin-empty">نبردی برای ثبت تلفات وجود ندارد.</div>';
    $("adminTradeCount").textContent=trades.length;
    $("adminTradeList").innerHTML=trades.length?trades.map(x=>'<article class="admin-trade-card"><div class="admin-trade-head"><div><b>'+escapeHTML(x.sender_username||'—')+'</b> · '+escapeHTML(x.sender_castle)+' → <b>'+escapeHTML(x.receiver_username||'—')+'</b> · '+escapeHTML(x.receiver_castle)+'</div><span>'+escapeHTML(x.status)+'</span></div><div class="admin-trade-ids">فرستنده ID: '+escapeHTML(x.sender_account_id)+' · گیرنده ID: '+escapeHTML(x.receiver_account_id)+' · درخواست ID: '+escapeHTML(x.id)+'</div><div class="admin-trade-assets"><div><strong>ارسال</strong>'+adminAssetLines(x.sendAssets,ADMIN_RESOURCE_LABELS)+'</div><div><strong>دریافت</strong>'+adminAssetLines(x.receiveAssets,ADMIN_RESOURCE_LABELS)+'</div></div><small>'+escapeHTML(x.created_at)+(x.responded_at?' · پاسخ: '+escapeHTML(x.responded_at):'')+'</small></article>').join(''):'<div class="admin-empty">هنوز تجارتی ثبت نشده است.</div>';
    const controls=controlData.controls||{};$("adminGameRunState").textContent=gameData.running?'در حال اجرا':'متوقف است';$("adminGameStartBtn").disabled=!!gameData.running;$("adminGameStopBtn").disabled=!gameData.running;$("adminWarLockBtn").textContent=controls.war?'🔓 باز کردن لشکرکشی':'🔒 قفل کردن لشکرکشی';$("adminTradeLockBtn").textContent=controls.trade?'🔓 باز کردن تجارت':'🔒 قفل کردن تجارت';$("adminWarLockState").textContent=controls.war?'قفل است':'باز است';$("adminTradeLockState").textContent=controls.trade?'قفل است':'باز است';
    const castles=castleData.castles||[];$("adminCastleSelect").innerHTML=castles.map(c=>'<option value="'+escapeHTML(c.castle)+'">'+escapeHTML(c.castle)+' — '+escapeHTML(c.region)+' — '+escapeHTML(c.username||'آزاد')+'</option>').join('');
    if(castles.length)await loadAdminCastleAssets(castles[0].castle);
  }
  async function setAdminGameState(action){try{await api('/api/admin/game-control',{method:'POST',body:JSON.stringify({action})});await refreshAdmin();showToast(action==='start'?'بازی شروع شد.':'بازی متوقف شد و تایمرها فریز شدند.');}catch(e){showToast(e.message,true);}}
  async function openAdminCasualty(id){
    const war=adminWars.find(x=>x.id===id);if(!war)return;
    try{
      const d=await api('/api/admin/castle-assets?castle='+encodeURIComponent(war.destinationCastle));
      let original={};try{original=JSON.parse(war.assetsJson||'{}');}catch{}
      const labels={...ADMIN_ARMY_LABELS,...ADMIN_EQUIPMENT_LABELS,...ADMIN_FLEET_LABELS};
      const row=(side,kind,obj)=>Object.entries(obj||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>'<label class="admin-editor-field"><span>'+escapeHTML(labels[k]||k)+' · موجودی '+Number(v).toLocaleString('en-US')+'</span><input type="number" min="0" max="'+Number(v)+'" value="'+Number(v)+'" data-casualty-side="'+side+'" data-kind="'+escapeHTML(kind)+'" data-kind-key="'+escapeHTML(k)+'"></label>').join('');
      $("adminCasualtyList").innerHTML='<div class="admin-box"><h3>'+escapeHTML(war.sourceCastle)+' → '+escapeHTML(war.destinationCastle)+'</h3><p>عدد واردشده «تعداد باقی‌مانده بعد از جنگ» است.</p><h4>مهاجم</h4><div class="admin-editor-grid">'+Object.entries(original).map(([k,o])=>row('attacker',k,o)).join('')+'</div><h4>مدافع</h4><div class="admin-editor-grid">'+row('defender','army',d.army)+row('defender','equipment',d.equipment)+row('defender','fleet',d.fleet)+'</div><button class="primary" id="adminApplyCasualties">اعمال تلفات</button></div>';
      $("adminApplyCasualties").onclick=async()=>{const out={attacker:{},defender:{}};document.querySelectorAll('[data-casualty-side]').forEach(el=>{const side=el.dataset.casualtySide;const kind=el.dataset.kind;const key=el.dataset.kindKey;out[side][kind]??={};out[side][kind][key]=Math.floor(Number(el.value||0));});try{await api('/api/admin/war-expeditions/'+encodeURIComponent(id)+'/casualties',{method:'POST',body:JSON.stringify(out)});await refreshAdmin();showToast('تلفات اعمال شد.');}catch(e){showToast(e.message,true);}};
    }catch(e){showToast(e.message,true);}
  }

    const button=key==='war'?$("adminWarLockBtn"):$("adminTradeLockBtn");const currentlyLocked=button.textContent.includes('باز کردن');
    const action=currentlyLocked?'باز کردن':'قفل کردن';
    if(!adminConfirm(action+' '+(key==='war'?'لشکرکشی':'تجارت')+' انجام شود؟'))return;
    try{await api('/api/admin/controls',{method:'POST',body:JSON.stringify({key,locked:!currentlyLocked})});await refreshAdmin();showToast(action+' انجام شد.');}catch(e){showToast(e.message,true);}
  }
  async function runAdminWeeklyUpdate(){
    if(!adminConfirm('آپدیت هفتگی انجام شود؟ بازدهی تولیدی‌ها و کمپ‌ها و تولید بندر برای همه قلعه‌ها اعمال می‌شود و این عملیات برای هفته جاری ثبت خواهد شد.'))return;
    try{await api('/api/admin/weekly-update',{method:'POST',body:JSON.stringify({})});showToast('آپدیت هفتگی انجام شد.');await refreshAdmin();}catch(e){showToast(e.message,true);}
  }
  async function createAdminCastle(){
    const region=$("adminNewCastleRegion")?.value,name=$("adminNewCastleName")?.value.trim(),house=$("adminNewCastleHouse")?.value.trim(),icon=$("adminNewCastleIcon")?.value.trim()||"🏰",location=$("adminNewCastleLocation")?.value.trim(),description=$("adminNewCastleDescription")?.value.trim();
    if(!region||!name||!house)return showToast("اقلیم، نام قلعه و خاندان را کامل کن.",true);
    if(!adminConfirm("قلعه «"+name+"» به بازی اضافه شود؟"))return;
    try{await api("/api/admin/castles",{method:"POST",body:JSON.stringify({region,castle:name,house,icon,location,description})});$("adminNewCastleName").value="";$("adminNewCastleHouse").value="";$("adminNewCastleLocation").value="";$("adminNewCastleDescription").value="";await refreshAdmin();showToast("قلعه اضافه شد.");}catch(e){showToast(e.message,true);}
  }
  async function assignAdminCastle(){
    const player=$("adminAssignPlayer").value,region=$("adminAssignRegion").value,castle=$("adminAssignCastle").value;
    if(!player||!castle)return showToast('پلیر و قلعه را انتخاب کن.',true);
    if(!adminConfirm('قلعه «'+castle+'» به این پلیر اضافه شود؟'))return;
    try{await api('/api/admin/players/'+encodeURIComponent(player)+'/castles',{method:'POST',body:JSON.stringify({region,castle})});await refreshAdmin();showToast('قلعه به لیست پلیر اضافه شد.');}catch(e){showToast(e.message,true);}
  }

  $("adminRegion").addEventListener("change",updateAdminCastles);
  $("adminAssignRegion")?.addEventListener("change",updateAdminAssignCastles);
  $("adminAssignPlayer")?.addEventListener("change",updateAdminAssignCastles);
  $("adminCastleSelect")?.addEventListener("change",()=>loadAdminCastleAssets($("adminCastleSelect").value));
  $("adminRefreshWars").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminRefreshTrades").onclick=()=>refreshAdmin().catch(e=>showToast(e.message,true));
  $("adminGameStartBtn").onclick=()=>setAdminGameState('start');
  $("adminGameStopBtn").onclick=()=>setAdminGameState('stop');
  $("adminWarLockBtn").onclick=()=>toggleAdminControl('war');
  $("adminTradeLockBtn").onclick=()=>toggleAdminControl('trade');
  $("adminWeeklyUpdate").onclick=runAdminWeeklyUpdate;
  $("adminAssignCastleBtn").onclick=assignAdminCastle;
  $("adminCreateCastleBtn").onclick=createAdminCastle;
  $("adminScenariosBtn").onclick=()=>showToast('بخش سناریوها آماده می‌شود.');
  $("adminRolesBtn").onclick=()=>showToast('بخش رول‌ها آماده می‌شود.');

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
    else if (action === "my-castle-manage") window.khataOpenCastleManagement?.();
    else if (action === "war-expedition") window.khataOpenWarExpedition?.();
    else if (action === "trade") window.khataOpenTrade?.(target.dataset.castle);
    else if (action === "trade-requests") window.khataOpenTradeRequests?.();
    else if (action === "cancel-war") cancelWarExpedition(target.dataset.warId);
    else if (action === "war-command") issueWarCommand(target.dataset.warId,target.dataset.command);
    else if (action === "admin-cancel-war") cancelAdminWar(target.dataset.warId);
    else if (action === "admin-open-casualty") openAdminCasualty(target.dataset.warId);
    else if (action === "claim") openClaim(Number(target.dataset.region), Number(target.dataset.castle));
    else if (action === "go-register") openPage("register").catch(() => {});
    else if (action === "delete-player") deletePlayer(target.dataset.id);
  });

  // Map zoom is bounded and works with mouse/touch-friendly controls.
  $("mapZoomIn").onclick = () => { mapScale = Math.min(1.6, +(mapScale + .1).toFixed(1)); updateMapZoom(); };
  $("mapZoomOut").onclick = () => { mapScale = Math.max(1, +(mapScale - .1).toFixed(1)); updateMapZoom(); };
  $("mapZoomReset").onclick = () => { mapScale = 1; updateMapZoom(); };

  window.addEventListener("scroll", () => { if (currentUser && !$("gameApp").classList.contains("hidden")) $("gameApp").classList.toggle("scrolled", window.scrollY > 180); }, { passive: true });

  boot();
});

// Small cinematic blood-drop effect at every click, disabled for keyboard and touch precision.
document.addEventListener("click", e => {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const splash = document.createElement("span"); splash.className = "blood-splash"; splash.style.left = e.clientX + "px"; splash.style.top = (e.clientY + 4) + "px";
  splash.innerHTML = '<i class="drop"></i><i class="drop"></i><i class="drop"></i>'; document.body.appendChild(splash); setTimeout(() => splash.remove(), 900);
});
