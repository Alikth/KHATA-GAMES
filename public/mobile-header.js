(function(){
  if(!window.matchMedia('(max-width:600px)').matches)return;
  const hero=document.querySelector('.hero');
  if(!hero)return;
  fetch('/assets/mobile-hero-khata.b64.txt',{cache:'force-cache'})
    .then(r=>r.text())
    .then(b64=>{
      if(!b64.trim())return;
      hero.style.backgroundImage='url("data:image/webp;base64,'+b64.trim()+'")';
    })
    .catch(()=>{});
})();