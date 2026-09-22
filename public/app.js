window.addEventListener("DOMContentLoaded", () => {
  let houses = [], players = [], selected = null, currentUser = null;
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
      if (!auth.authenticated) {
        showAuth();
        if (adminRequested) {
          setAuthTab("login");
          setMessage("authMessage", "error", "ابتدا وارد حساب کاربری شوید؛ سپس بخش مدیریت باز می‌شود.");
        }
        return;
      }
      currentUser = auth.user;
      await enterAuthenticated();
      if (adminRequested) {
        showAdminOnly();
        await checkAdminSession();
      }
    } catch (err) {
      console.error(err);
      showAuth();
      setMessage("authMessage", "error", "ارتباط با سرور برقرار نشد. اتصال اینترنت و اجرای سرور را بررسی کنید.");
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
    try { mine = await api("/api/my-castles"); } catch { mine = players.filter(p => p.accountId === currentUser.id); }
    if (!mine.length) {
      root.innerHTML = `<div class="my-castles-empty"><div class="empty-castle-icon">🏰</div><h3>NO CASTLES YET</h3><p>هنوز هیچ قلعه‌ای با این حساب ثبت نشده است.</p><button class="primary" type="button" data-action="go-register">انتخاب قلعه</button></div>`;
      return;
    }
    root.innerHTML = mine.map(p => {
      const r = houses.find(x => x.region === p.region), c = r?.castles.find(x => x.castle === p.castle);
      return `<article class="my-castle-card"><div class="my-castle-art">${escapeHTML(c?.icon || "🏰")}</div><div class="my-castle-body"><span class="my-castle-region">${escapeHTML(r?.icon || "")} ${escapeHTML(p.region)}</span><h3>${escapeHTML(p.castle)}</h3><p>HOUSE ${escapeHTML(p.house)}</p><div class="my-castle-meta"><span>👤 ${escapeHTML(p.username)}</span><span class="owned-badge">YOUR CASTLE</span></div></div><div class="my-castle-actions"><button class="castle-open" type="button" data-action="my-castle-manage">🏰 مدیریت قلعه</button><button class="castle-open" type="button" data-action="war-expedition">⚔️ لشکرکشی</button></div></article>`;
    }).join("");
  }

  async function openPage(page) {
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.toggle("active", x.dataset.page === page));
    document.querySelectorAll(".page").forEach(x => x.classList.toggle("active", x.id === page));
    if (page === "players") { players = await api("/api/players"); renderPlayers(); renderMap(); }
    if (page === "myCastles") { players = await api("/api/players"); await renderMyCastles(); }
    window.scrollTo({ top: document.querySelector("main")?.offsetTop || 0, behavior: "smooth" });
  }
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => openPage(btn.dataset.page).catch(e => showToast(e.message, true))));

  function fillAdminRegions() { if (!$('adminRegion')) return; $('adminRegion').innerHTML = houses.map(r => `<option value="${escapeHTML(r.region)}">${escapeHTML(r.region)}</option>`).join(""); updateAdminCastles(); }
  function updateAdminCastles() { const r = houses.find(x => x.region === $("adminRegion").value); if (!r) return; const a = r.castles.filter(c => !players.some(p => p.region === r.region && p.castle === c.castle)); $("adminCastle").innerHTML = a.length ? a.map(c => `<option value="${escapeHTML(c.castle)}">${escapeHTML(c.castle)} — ${escapeHTML(c.house)}</option>`).join("") : `<option value="">همه قلعه‌های این اقلیم گرفته شده‌اند</option>`; $("adminAdd").disabled = !a.length; }
  $("adminRegion").addEventListener("change", updateAdminCastles);

  async function refreshAdmin() {
    players = await api("/api/players"); renderPlayers(); renderMap(); updateAdminCastles();
    $("adminPlayers").innerHTML = players.length ? players.map(p => `<div class="admin-row"><span>${escapeHTML(p.username)} · ${escapeHTML(p.castle)}</span><button class="delete" type="button" data-action="delete-player" data-id="${escapeHTML(p.id)}">DELETE</button></div>`).join("") : "<small>هیچ پلیری ثبت نشده.</small>";
  }
  $("adminLogin").onclick = async () => {
    const button = $("adminLogin"); button.disabled = true;
    try { await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: $("adminPassword").value }) }); $("adminPassword").value = ""; $("adminLoginBox").classList.add("hidden"); $("adminPanel").classList.remove("hidden"); setMessage("adminMessage", "", ""); await refreshAdmin(); }
    catch (e) { setMessage("adminMessage", "error", e.message); }
    finally { button.disabled = false; }
  };
  $("adminAdd").onclick = async () => {
    const button = $("adminAdd"); button.disabled = true;
    try { await api("/api/admin/players", { method: "POST", body: JSON.stringify({ username: $("adminUsername").value, region: $("adminRegion").value, castle: $("adminCastle").value }) }); $("adminUsername").value = ""; await refreshAdmin(); showToast("لرد با موفقیت اضافه شد."); }
    catch (e) { setMessage("adminMessage", "error", e.message); }
    finally { button.disabled = false; }
  };
  async function deletePlayer(id) { if (!confirm("این پلیر حذف شود؟")) return; try { await api("/api/admin/players/" + encodeURIComponent(id), { method: "DELETE" }); await refreshAdmin(); showToast("پلیر حذف شد."); } catch (e) { showToast(e.message, true); } }
  $("adminLogout").onclick = async () => { try { await api("/api/admin/logout", { method: "POST" }); } catch {} currentUser = null; resetGameState(); showAuth(); setAuthTab("login"); };

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
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active")); $("admin").classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active")); window.scrollTo({ top: 0, behavior: "auto" });
  }
  async function checkAdminSession() {
    const status = await api("/api/admin/status");
    $("adminLoginBox").classList.toggle("hidden", status.admin); $("adminPanel").classList.toggle("hidden", !status.admin);
    if (status.admin) await refreshAdmin();
  }

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
