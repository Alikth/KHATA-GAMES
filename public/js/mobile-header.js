(function(){
  const mobile=window.matchMedia('(max-width:600px)');
  if(!mobile.matches)return;

  document.documentElement.classList.add('mobile-fx-enabled');
  document.body.classList.add('mobile-fx-enabled');

  const hero=document.querySelector('.hero');
  if(hero){
    hero.style.backgroundImage='url("/assets/hero-4k.png?v=1")';
    hero.style.backgroundSize='cover';
    hero.style.backgroundPosition='center center';
  }

  const layer=document.createElement('div');
  layer.className='mobile-fx-layer';
  layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="mobile-fx-vignette"></div><div class="mobile-fx-glow"></div>';
  document.body.appendChild(layer);

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){
    for(let i=0;i<14;i++){
      const ember=document.createElement('i');
      ember.className='mobile-fx-ember';
      ember.style.left=(5+Math.random()*90)+'%';
      ember.style.bottom=(-5+Math.random()*25)+'vh';
      ember.style.setProperty('--drift',(-24+Math.random()*48)+'px');
      ember.style.animationDuration=(4.5+Math.random()*5)+'s';
      ember.style.animationDelay=(-Math.random()*8)+'s';
      layer.appendChild(ember);
    }
  }

  let lastHaptic=0;
  function haptic(ms){
    const now=Date.now();
    if(now-lastHaptic<80)return;
    lastHaptic=now;
    if(navigator.vibrate&&!reduced)navigator.vibrate(ms||8);
  }

  function ripple(x,y){
    if(reduced)return;
    const el=document.createElement('span');
    el.className='mobile-fx-ripple';
    el.style.left=x+'px';
    el.style.top=y+'px';
    document.body.appendChild(el);
    el.addEventListener('animationend',()=>el.remove(),{once:true});
  }

  function flash(){
    if(reduced)return;
    const el=document.createElement('span');
    el.className='mobile-fx-flash';
    document.body.appendChild(el);
    el.addEventListener('animationend',()=>el.remove(),{once:true});
  }

  document.addEventListener('pointerdown',function(e){
    const target=e.target.closest('button,.game-card,[role="button"],.castle-card,.region-marker');
    if(!target)return;
    ripple(e.clientX,e.clientY);
    haptic(7);
  },{passive:true});

  document.addEventListener('click',function(e){
    const target=e.target.closest('.primary,.game-card,.castle-card,.region-marker');
    if(!target)return;
    if(target.classList.contains('game-card')||target.classList.contains('castle-card')||target.classList.contains('region-marker')){
      haptic(10);
      flash();
    }
  });

  // A tiny impact effect for the main game surface, never on desktop.
  document.addEventListener('click',function(e){
    const target=e.target.closest('.nav-btn,.primary,.danger');
    if(!target||reduced)return;
    const app=document.getElementById('gameApp');
    if(app){app.classList.remove('mobile-fx-shake');void app.offsetWidth;app.classList.add('mobile-fx-shake');}
  });

  mobile.addEventListener?.('change',function(){
    if(!mobile.matches)layer.remove();
  });
})();