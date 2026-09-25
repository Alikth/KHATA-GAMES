(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('en-US');
  const labels={coins:'💰 سکه',wood:'🪵 چوب',stone:'🪨 سنگ',iron:'⛓ آهن',meat:'🥩 گوشت',fish:'🐟 ماهی',grain:'🌾 غلات',horses:'🐎 اسب',dragon_glass:'🌑 شیشه اژدها',wildfire:'🧪 وایلدفایر',tar:'🛢 قیر',grapes:'🍇 انگور'};
  const keys=Object.keys(labels);
  async function api(url,options={}){const h=new Headers(options.headers||{});if(options.body&&!h.has('Content-Type'))h.set('Content-Type','application/json');const r=await fetch(url,{cache:'no-store',...options,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطایی رخ داد.');return d;}
  function rows(prefix,resources){return keys.map(k=>{const hasInventory=resources&&Object.keys(resources).length>0;const max=hasInventory?Number(resources[k]||0):100000000;return '<div class="trade-item"><span>'+labels[k]+'</span><small>موجودی: '+(resources?fmt(resources[k]):'مقدار درخواستی')+'</small><input type="number" min="0" max="'+max+'" value="0" data-trade-side="'+prefix+'" data-trade-key="'+k+'"></div>';}).join('');}
  function modal(){return $('tradeModal');}
  async function open(sourceCastle){
    const m=modal(); if(!m)return;
    m.classList.remove('hidden');document.body.classList.add('modal-open');
    $('tradeRoot').innerHTML='<div class="trade-loading">در حال بارگذاری دارایی‌ها و قلعه‌ها...</div>';
    try{
      const [assets,destinations]=await Promise.all([api('/api/my-castle/assets?castle='+encodeURIComponent(sourceCastle||'')),api('/api/trades/destinations')]);
      const options=(destinations.castles||[]).filter(c=>c.castle!==sourceCastle).map(c=>'<option value="'+esc(c.castle)+'">'+esc(c.castle)+' — '+esc(c.house)+(c.username?' · '+esc(c.username):'')+'</option>').join('');

      $('tradeRoot').innerHTML='<div class="trade-modal-head"><div><span>TRADE</span><h2>⚖️ تجارت</h2><p>قلعه مبدا: <b>'+esc(sourceCastle)+'</b></p></div><button id="tradeClose" class="trade-close">×</button></div><div class="trade-body"><h3>مایل به ارسال چه کالایی هستید؟</h3><div class="trade-list">'+rows('send',assets.resources)+'</div><h3>مایل به دریافت چه کالایی هستید؟</h3><div class="trade-list">'+rows('receive',{})+'</div><div class="trade-field"><label>مقصد</label><select id="tradeDestination">'+options+'</select></div><div class="trade-actions"><button id="tradeSubmit" class="trade-btn primary">ارسال درخواست تجارت</button><button id="tradeRequests" class="trade-btn">درخواست‌های تجارت</button></div><div id="tradeError" class="trade-error"></div><div id="tradeIncoming" class="trade-incoming hidden"></div></div>';
      $('tradeClose').onclick=close;
      $('tradeSubmit').onclick=()=>submit(sourceCastle);
      $('tradeRequests').onclick=showIncoming;
    }catch(e){$('tradeRoot').innerHTML='<div class="trade-error">❌ '+esc(e.message)+'</div>';}
  }
  function close(){modal()?.classList.add('hidden');document.body.classList.remove('modal-open');}
  async function submit(sourceCastle){
    const sendAssets={},receiveAssets={};
    document.querySelectorAll('[data-trade-side]').forEach(x=>{const n=Math.floor(Number(x.value||0));if(n>0)(x.dataset.tradeSide==='send'?sendAssets:receiveAssets)[x.dataset.tradeKey]=n;});
    const destination=$('tradeDestination')?.value,err=$('tradeError');err.textContent='';
    if(!destination||!Object.keys(sendAssets).length||!Object.keys(receiveAssets).length){err.textContent='حداقل یک کالا برای ارسال و یک کالا برای دریافت انتخاب کن.';return;}
    const b=$('tradeSubmit');b.disabled=true;
    try{await api('/api/trades',{method:'POST',body:JSON.stringify({source:sourceCastle,destination,sendAssets,receiveAssets})});alert('درخواست تجارت ارسال شد.');close();}
    catch(e){err.textContent=e.message;b.disabled=false;}
  }
  async function showIncoming(){
    const root=$('tradeIncoming');root.classList.remove('hidden');root.innerHTML='در حال بارگذاری...';
    try{
      const d=await api('/api/trades/incoming');
      root.innerHTML=d.requests.length?d.requests.map(x=>'<article class="trade-request"><div><b>از '+esc(x.sender_castle)+'</b> به <b>'+esc(x.receiver_castle)+'</b></div><div>ارسال: '+assetText(x.sendAssets)+'</div><div>دریافت: '+assetText(x.receiveAssets)+'</div><div class="trade-request-actions"><button class="trade-btn accept" data-trade-response="accept" data-trade-id="'+esc(x.id)+'">تأیید</button><button class="trade-btn reject" data-trade-response="reject" data-trade-id="'+esc(x.id)+'">رد</button></div></article>').join(''):'<div class="trade-empty">درخواست تجارتی وجود ندارد.</div>';
    }catch(e){root.innerHTML='<div class="trade-error">'+esc(e.message)+'</div>';}
  }
  function assetText(obj){return Object.entries(obj||{}).map(([k,v])=>labels[k]+' × '+fmt(v)).join(' · ')||'—';}
  async function respond(id,action,button){
    if(button)button.disabled=true;
    try{await api('/api/trades/'+encodeURIComponent(id)+'/respond',{method:'POST',body:JSON.stringify({action})});await showIncoming();await refreshNotifications();alert(action==='accept'?'تجارت تأیید شد.':'درخواست تجارت رد شد.');}
    catch(e){if(button)button.disabled=false;alert(e.message);}
  }
  async function refreshNotifications(){
    try{
      const d=await api('/api/trades/notifications');
      document.querySelectorAll('[data-trade-notification]').forEach(x=>{
        const count=Number(d.byCastle?.[x.dataset.tradeNotification]||0);
        x.textContent=count||'';
        x.classList.toggle('hidden',!count);
      });
      return d.count||0;
    }catch{return 0;}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-trade-response]');if(b){e.preventDefault();respond(b.dataset.tradeId,b.dataset.tradeResponse,b);}if(e.target.id==='tradeModal'||e.target.id==='tradeClose')close();});
  async function openRequests(){const m=modal();if(!m)return;m.classList.remove('hidden');document.body.classList.add('modal-open');$('tradeRoot').innerHTML='<div class="trade-modal-head"><div><span>TRADE REQUESTS</span><h2>📜 درخواست تجارت</h2></div><button id="tradeClose" class="trade-close">×</button></div><div class="trade-body"><div id="tradeIncoming" class="trade-incoming"></div></div>';$('tradeClose').onclick=close;await showIncoming();}
  window.khataOpenTrade=open;window.khataOpenTradeRequests=openRequests;window.khataRefreshTradeNotifications=refreshNotifications;
})();