(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const coords={
    'Castle Black':[60,7],'Eastwatch':[70,8],'Shadow Tower':[49,8],'Winterfell':[55,25],'The Dreadfort':[64,28],'Karhold':[69,21],
    'Riverrun':[50,45],'The Twins':[57,39],'Seagard':[42,40],'The Eyrie':[72,44],'Gulltown':[78,48],'Redfort':[67,51],
    'Pyke':[27,43],'Ten Towers':[23,48],'Hammerhorn':[31,50],'Casterly Rock':[34,58],'Hornvale':[39,54],'Ashemark':[42,61],
    "King's Landing":[65,61],'Dragonstone':[76,63],'Sharp Point':[72,56],"Storm's End":[74,74],'Fellwood':[67,76],'Blackhaven':[64,82],
    'Highgarden':[47,70],'Horn Hill':[52,78],'Oldtown':[39,82],'Sunspear':[63,94],'Kingsgrave':[56,88],'Yronwood':[51,91]
  };
  let zoom=1;
  const fmt=sec=>{const s=Math.max(0,Math.ceil(sec));if(s<60)return s+' ثانیه';return Math.floor(s/60)+' دقیقه';};
  async function api(url){const r=await fetch(url,{cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطایی رخ داد.');return d;}
  function render(logs){
    const root=$('warsLiveRoot');if(!root)return;const active=(logs||[]).filter(x=>x.active&&!Number(x.cancelled));
    root.innerHTML='<div class="wars-live-toolbar"><span>⚔️ LIVE WAR MAP</span><div><button id="wlMinus">−</button><button id="wlReset">100%</button><button id="wlPlus">+</button></div></div><div class="wars-live-map"><img id="warsLiveMapImage" src="/assets/IMG_20240207_002412_374.jpg" alt="Westeros map"><svg id="warsLiveSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div id="warsLiveLabels"></div></div><div class="wars-live-list">'+(active.length?active.map(x=>'<article><b>'+esc(x.attackerUsername)+' · '+esc(x.sourceCastle)+' → '+esc(x.destinationCastle)+'</b><span>'+fmt(x.remainingSeconds)+' باقی مانده</span></article>').join(''):'<div class="wars-live-empty">در حال حاضر لشکرکشی فعالی وجود ندارد.</div>')+'</div>';
    const map=$('warsLiveMapImage'),svg=$('warsLiveSvg'),lab=$('warsLiveLabels');
    const apply=()=>{map.style.transform='scale('+zoom+')';svg.style.transform='scale('+zoom+')';lab.style.transform='scale('+zoom+')';$('wlReset').textContent=Math.round(zoom*100)+'%';};
    $('wlMinus').onclick=()=>{zoom=Math.max(1,+(zoom-.1).toFixed(1));apply();};$('wlPlus').onclick=()=>{zoom=Math.min(3,+(zoom+.1).toFixed(1));apply();};$('wlReset').onclick=()=>{zoom=1;apply();};
    svg.innerHTML=active.map(x=>{const a=coords[x.sourceCastle],b=coords[x.destinationCastle];if(!a||!b)return '';return '<line class="war-route" x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'"></line>';}).join('');
    lab.innerHTML=active.map(x=>{const a=coords[x.sourceCastle],b=coords[x.destinationCastle];if(!a||!b)return '';const total=Math.max(1,Number(x.durationMinutes||1)*60),p=Math.min(1,Math.max(0,1-Number(x.remainingSeconds||0)/total)),px=a[0]+(b[0]-a[0])*p,py=a[1]+(b[1]-a[1])*p;return '<div class="war-live-arrow" style="left:'+px+'%;top:'+py+'%"><span>'+esc(x.attackerUsername)+'</span>➤</div>';}).join('');apply();
  }
  async function load(){try{const d=await api('/api/admin/war-expeditions');render(d.expeditions||[]);}catch(e){const r=$('warsLiveRoot');if(r)r.innerHTML='<div class="wars-live-empty">'+esc(e.message)+'</div>';}}
  window.khataLoadWarsLive=load;document.addEventListener('DOMContentLoaded',()=>{load();setInterval(()=>{if(!$('warsLive')?.classList.contains('active'))return;load();},1000);});
})();