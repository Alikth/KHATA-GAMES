(async function(){
  if(!window.matchMedia('(max-width:600px)').matches)return;
  const hero=document.querySelector('.hero');
  if(!hero)return;
  try{
    const parts=await Promise.all(Array.from({length:3},(_,i)=>
      fetch('/assets/mobile-hero-320.part'+i+'.txt?v=3',{cache:'no-store'}).then(r=>r.text())
    ));
    const b64=parts.join('').trim();
    hero.style.backgroundImage='url("data:image/webp;base64,'+b64+'")';
    hero.style.backgroundSize='cover';
    hero.style.backgroundPosition='center center';
  }catch(e){}
})();