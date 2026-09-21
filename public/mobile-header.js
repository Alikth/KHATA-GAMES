(function(){
  if(!window.matchMedia('(max-width:600px)').matches)return;
  const hero=document.querySelector('.hero');
  if(!hero)return;
  hero.style.backgroundImage='url("/assets/hero-4k.png?v=1")';
  hero.style.backgroundSize='cover';
  hero.style.backgroundPosition='center center';
})();