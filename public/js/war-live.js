(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const coords={
    'Castle Black':[60,7],'Eastwatch':[70,8],'Shadow Tower':[49,8],'Winterfell':[55,25],'The Dreadfort':[64,28],'Karhold':[69,21],
    'Riverrun':[50,45],'The Twins':[57,39],'Seagard':[42,40],'The Eyrie':[72,44],'Gulltown':[78,48],'Redfort':[67,51],
    'Pyke':[27,43],'Ten Towers':[23,48],'Hammerhorn':[31,50],'Casterly Rock':[34,58],'Hornvale':[39,54],'Ashemark':[42,61],
    "King's Landing":[65,61],'Dragonstone':[76,63],'Sharp Point':[72,56],"Storm's End":[74,74],'Fellwood':[67,76],'Blackhaven':[64,82],
    'Highgarden':[47,70],'Horn Hill':[52,78],'Oldtown':[39,82],'Sunspear':[63,94],'Kingsgrave':[56,88],'Yronwood':[51,91]
  };

  // Routes are represented as ordered castle waypoints instead of a direct source→destination line.
  // This keeps the movement on the defined road/sea corridor and naturally passes through
  // intermediate castles when a route has them.
  const landRoutes=[
    ['Castle Black','Winterfell'],['Winterfell','The Dreadfort'],['The Dreadfort','Karhold'],
    ['Winterfell','The Twins','Riverrun'],['The Twins','Seagard'],['Riverrun','Casterly Rock'],
    ['Riverrun','The Eyrie'],['The Eyrie','Gulltown'],['Gulltown',"King's Landing"],
    ['Casterly Rock','Hornvale','Ashemark','Highgarden'],['Casterly Rock','King\'s Landing'],
    ['Highgarden','Horn Hill','Blackhaven',"Storm's End"],['Highgarden','Oldtown'],
    ['King\'s Landing','Dragonstone'],['King\'s Landing','Sharp Point','Storm\'s End'],
    ['Storm\'s End','Blackhaven'],['Oldtown','Kingsgrave','Sunspear'],['Kingsgrave','Yronwood','Sunspear'],
    ['Pyke','Ten Towers','Hammerhorn'],['Hammerhorn','Casterly Rock']
  ];
  const seaRoutes=[
    ['Seagard','Pyke'],['Seagard','Gulltown'],['Pyke','Hammerhorn','Casterly Rock'],
    ['Gulltown',"King's Landing"],['King\'s Landing','Dragonstone'],
    ['Dragonstone',"Storm's End"],['Oldtown','Sunspear'],['Sunspear','Yronwood']
  ];

  const fmt=sec=>{const s=Math.max(0,Math.ceil(sec));if(s<60)return s+' ثانیه';return Math.floor(s/60)+' دقیقه';};
  async function api(url){const r=await fetch(url,{cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطایی رخ داد.');return d;}

  function graphRoutes(type){
    const edges=(type==='sea'?seaRoutes:landRoutes).map(points=>points.filter(p=>coords[p]));
    return edges;
  }
  function findRoute(type,from,to){
    const edges=graphRoutes(type), adj=new Map();
    const add=(a,b)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);};
    for(const e of edges)for(let i=0;i<e.length-1;i++){add(e[i],e[i+1]);add(e[i+1],e[i]);}
    if(!adj.has(from)||!adj.has(to))return [from,to].filter(x=>coords[x]);
    const q=[[from]], seen=new Set([from]);
    while(q.length){
      const p=q.shift(),last=p[p.length-1];if(last===to)return p;
      for(const n of adj.get(last)||[])if(!seen.has(n)){seen.add(n);q.push([...p,n]);}
    }
    return [from,to].filter(x=>coords[x]);
  }
  function pointsFor(x){return findRoute(x.type,x.sourceCastle,x.destinationCastle).map(n=>coords[n]).filter(Boolean);}
  function interpolate(points,p){
    if(points.length<2)return points[0]||[0,0];
    const lengths=[];let total=0;
    for(let i=0;i<points.length-1;i++){const dx=points[i+1][0]-points[i][0],dy=points[i+1][1]-points[i][1],l=Math.hypot(dx,dy);lengths.push(l);total+=l;}
    let d=p*total;
    for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const t=lengths[i]?d/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];}d-=lengths[i];}
    return points[points.length-1];
  }

  let zoom=1, panX=0, panY=0, dragState=null;
  function render(logs){
    const root=$('warsLiveRoot');if(!root)return;
    const active=(logs||[]).filter(x=>Number(x.remainingSeconds)>0&&!Number(x.cancelled));
    root.innerHTML='<div class="wars-live-toolbar"><span>⚔️ LIVE WAR MAP</span><div><button id="wlMinus">−</button><button id="wlReset">100%</button><button id="wlPlus">+</button></div></div><div class="wars-live-map"><img id="warsLiveMapImage" src="/assets/IMG_20240207_002412_374.jpg" alt="Westeros map"><svg id="warsLiveSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div id="warsLiveLabels"></div></div><div class="wars-live-list">'+(active.length?active.map(x=>'<article><b>'+esc(x.attackerUsername)+' · '+esc(x.sourceCastle)+' → '+esc(x.destinationCastle)+'</b><span>'+fmt(x.remainingSeconds)+' باقی مانده</span></article>').join(''):'<div class="wars-live-empty">در حال حاضر لشکرکشی فعالی وجود ندارد.</div>')+'</div>';
    const map=$('warsLiveMapImage'),svg=$('warsLiveSvg'),lab=$('warsLiveLabels');
    const clampPan=()=>{
      const maxX=Math.max(0,(map.parentElement.clientWidth*(zoom-1))/2);
      const maxY=Math.max(0,(map.parentElement.clientHeight*(zoom-1))/2);
      panX=Math.max(-maxX,Math.min(maxX,panX));panY=Math.max(-maxY,Math.min(maxY,panY));
    };
    const apply=()=>{clampPan();const transform='translate3d('+panX+'px,'+panY+'px,0) scale('+zoom+')';map.style.transform=transform;svg.style.transform=transform;lab.style.transform=transform;$('wlReset').textContent=Math.round(zoom*100)+'%';};
    $('wlMinus').onclick=()=>{zoom=Math.max(1,+(zoom-.1).toFixed(1));apply();};
    $('wlPlus').onclick=()=>{zoom=Math.min(3,+(zoom+.1).toFixed(1));apply();};
    $('wlReset').onclick=()=>{zoom=1;panX=0;panY=0;apply();};
    const viewport=$('.wars-live-map');
    viewport.onpointerdown=e=>{if(e.target.closest('button'))return;dragState={x:e.clientX,y:e.clientY,panX,panY};viewport.setPointerCapture?.(e.pointerId);viewport.classList.add('is-dragging');};
    viewport.onpointermove=e=>{if(!dragState)return;panX=dragState.panX+(e.clientX-dragState.x);panY=dragState.panY+(e.clientY-dragState.y);apply();};
    viewport.onpointerup=viewport.onpointercancel=()=>{dragState=null;viewport.classList.remove('is-dragging');};

    const routeMarkup=[];
    const labels=[];
    for(const x of active){
      const pts=pointsFor(x); if(pts.length<2)continue;
      routeMarkup.push('<polyline class="war-route" points="'+pts.map(p=>p[0]+','+p[1]).join(' ')+'"></polyline>');
      const total=Math.max(1,Number(x.durationMinutes||1)*60);
      const progress=Math.min(1,Math.max(0,1-Number(x.remainingSeconds||0)/total));
      const [px,py]=interpolate(pts,progress);
      labels.push('<div class="war-live-arrow" style="left:'+px+'%;top:'+py+'%"><span>'+esc(x.attackerUsername)+'</span>➤</div>');
    }
    svg.innerHTML=routeMarkup.join('');
    lab.innerHTML=labels.join('');
    apply();
  }
  async function load(){try{const d=await api('/api/war-logs');render(d.logs||[]);}catch(e){const r=$('warsLiveRoot');if(r)r.innerHTML='<div class="wars-live-empty">'+esc(e.message)+'</div>';}}
  window.khataLoadWarsLive=load;
  document.addEventListener('DOMContentLoaded',()=>{load();setInterval(()=>{if(!$('warsLive')?.classList.contains('active'))return;load();},1000);});
})();