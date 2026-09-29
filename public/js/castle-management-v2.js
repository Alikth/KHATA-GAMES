(() => {
  const ICONS = {
    coins:['coins.webp','سکه'],wood:['wood.webp','چوب'],stone:['stone.webp','سنگ'],iron:['iron.webp','آهن'],
    meat:['meat.webp','گوشت'],fish:['fish.webp','ماهی'],grain:['grain.webp','غلات'],horses:['horses.webp','اسب'],
    dragon_glass:['dragon-glass.webp','شیشه اژدها'],tar:['tar.webp','قیر'],grapes:['grapes.webp','انگور'],
    swordsman:['swordsman.webp','شمشیرزن'],archer:['archer.webp','کماندار'],spearman:['spearman.webp','نیزه‌دار'],cavalry:['cavalry.webp','سواره‌نظام'],
    ladder:['ladder.webp','نردبان'],ram:['ram.webp','دژکوب'],catapult:['catapult.webp','منجنیق'],scorpion:['scorpion.webp','اسکورپین'],siege_tower:['siege-tower.webp','برج محاصره']
  };
  const labels=Object.fromEntries(Object.values(ICONS).map(([file,label])=>[label,file]));
  const strip=s=>String(s||'').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu,'').trim();
  const matchLabel=s=>{const t=strip(s);for(const label of Object.keys(labels))if(t===label||t.startsWith(label+':')||t.startsWith(label+' '))return label;return null};

  function transparentize(img){
    if(!img||img.dataset.khataTransparent==='1'||!img.naturalWidth)return;
    try{
      const maxSide=128, iw=img.naturalWidth, ih=img.naturalHeight, scale=Math.min(1,maxSide/Math.max(iw,ih));
      const w=Math.max(1,Math.round(iw*scale)),h=Math.max(1,Math.round(ih*scale));
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.className=img.className;canvas.title=img.title||'';canvas.setAttribute('aria-label',img.alt||'');canvas.dataset.khataTransparent='1';
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
      const px=ctx.getImageData(0,0,w,h),d=px.data,seen=new Uint8Array(w*h),q=new Int32Array(w*h);let head=0,tail=0;
      const bg=p=>{const i=p*4,r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(!a)return false;const max=Math.max(r,g,b),min=Math.min(r,g,b);return (r+g+b)/3>=145&&(max-min)<=28};
      const push=p=>{if(p>=0&&p<w*h&&!seen[p]){seen[p]=1;q[tail++]=p}};
      for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}
      while(head<tail){const p=q[head++];if(!bg(p))continue;d[p*4+3]=0;const x=p%w,y=(p/w)|0;if(x)push(p-1);if(x<w-1)push(p+1);if(y)push(p-w);if(y<h-1)push(p+w)}
      ctx.putImageData(px,0,0);
      const r=img.getBoundingClientRect();canvas.style.cssText=img.style.cssText;canvas.style.width=(r.width||24)+'px';canvas.style.height=(r.height||24)+'px';canvas.style.objectFit='contain';canvas.style.verticalAlign='middle';canvas.style.display='inline-block';canvas.style.background='transparent';canvas.style.mixBlendMode='normal';
      img.replaceWith(canvas);
    }catch(e){console.warn('KHATA transparent icon failed',e)}
  }

  function decorate(el){
    if(!el||el.dataset.khataIconized==='1')return;const label=matchLabel(el.textContent);if(!label)return;
    const raw=String(el.textContent||'').trim(),suffix=raw.slice(label.length),file=labels[label];el.textContent='';
    const img=document.createElement('img');img.src='/assets/game-icons/'+file;img.alt=label;img.className='khata-item-icon';img.loading='eager';img.decoding='async';
    img.addEventListener('load',()=>transparentize(img),{once:true});el.append(img,document.createTextNode(' '+label+suffix));el.dataset.khataIconized='1';if(img.complete)transparentize(img);
  }
  function scan(root=document){root.querySelectorAll?.('.cm-resources span,.cm-army-unit span,.cm-card-head strong,.cm-confirm-row span:first-child').forEach(decorate)}
  function style(){if(document.getElementById('khata-item-icons-style'))return;const s=document.createElement('style');s.id='khata-item-icons-style';s.textContent='.khata-item-icon{width:24px;height:24px;object-fit:contain;vertical-align:middle;display:inline-block;margin-inline-end:5px;background:transparent!important;mix-blend-mode:normal!important}.cm-resources span .khata-item-icon{width:22px;height:22px}.cm-army-unit span .khata-item-icon{width:30px;height:30px}.cm-card-head strong .khata-item-icon{width:30px;height:30px}.cm-confirm-row span:first-child .khata-item-icon{width:22px;height:22px}';document.head.appendChild(s)}
  function boot(){style();scan(document);const root=document.getElementById('castleManagementRoot');if(root&&!root.dataset.khataIconObserver){new MutationObserver(()=>scan(root)).observe(root,{childList:true,subtree:true});root.dataset.khataIconObserver='1'}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
