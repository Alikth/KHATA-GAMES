(() => {
  const characters = [
    {id:"sam-stark",name:"Sam Stark",region:"The North",castle:"Winterfell",house:"Stark",age:41,premium:true,image:"/assets/characters/sam-300q68.txt",about:"Sam Stark، لرد ۴۱ ساله‌ی وینترفل، مردی‌ست که زمستان‌های طولانی شمال را با سختی و سکوت پشت سر گذاشته است. زخم روی صورتش یادگار نبردی‌ست که او را تغییر داد؛ اما چیزی که در نگاهش باقی مانده، اراده‌ای سرد و محکم برای حفظ وینترفل است. اکنون در وینترفل، هر تصمیم او می‌تواند سرنوشت خاندان استارک و سرزمین‌های شمال را تغییر دهد."},
    {id:"roderick-bolton",name:"Roderick Bolton",region:"The North",castle:"Dreadfort",house:"Bolton",age:38,premium:false,image:"/assets/characters/roderick-bolton-300q68.txt",about:"Roderick Bolton، لرد ۳۸ ساله‌ی Dreadfort، از میان سرمای بی‌رحم شمال برخاسته؛ جایی که ترس گاهی از شمشیر قدرتمندتر است. او مردی آرام و حسابگر است که پیش از هر تصمیم، چند قدم جلوتر از دشمنانش را می‌بیند. دیوارهای سرد Dreadfort برای او نمادی از قدرت خاندان بولتون‌اند."},
    {id:"edrik-karstark",name:"Edrik Karstark",region:"The North",castle:"Karhold",house:"Karstark",age:28,premium:false,image:"/assets/characters/edrik-karstark-300q68.txt",about:"Edrik Karstark، لرد ۲۸ ساله‌ی Karhold، از نسل جنگجویانی برخاسته که سرمای شمال را بخشی از وجود خود می‌دانند. جوان است، اما در نگاهش چیزی از بی‌تجربگی دیده نمی‌شود. زخم روی پیشانی‌اش یادگاری از نبردی است که او را به فرمانروایی محتاط تبدیل کرد."},
    {id:"elyas-tully",name:"Elyas Tully",region:"Riverlands",castle:"The Twins",house:"Tully",age:40,premium:true,image:"/assets/characters/edric-tully-300q52.txt",about:"Elyas Tully، لرد ۴۰ ساله‌ی The Twins، در قلب سرزمین‌های رودخانه‌ای میان وفاداری خاندان، سیاست و خطر دائمی جنگ فرمان می‌راند. او مردی آرام و حسابگر است که می‌داند هر پیمان می‌تواند روزی به یک جنگ تبدیل شود؛ برای همین، پیش از هر تصمیم مسیر رودخانه و شمشیر را با هم می‌سنجد."},
    {id:"walder-frey",name:"Walder Frey",region:"Riverlands",castle:"The Twins",house:"Frey",age:34,premium:false,image:"/assets/characters/walder-frey-300q68.txt",about:"Walder Frey، لرد ۳۴ ساله‌ی خاندان Frey، در The Twins بر یکی از مهم‌ترین گذرگاه‌های Riverlands فرمان می‌راند. او مردی جاه‌طلب و حسابگر است که ارزش هر پیمان و هر اتحاد را به‌خوبی می‌داند. برای Walder، قدرت همیشه در میدان نبرد به دست نمی‌آید؛ گاهی کنترل یک گذرگاه و دانستن زمان درست برای مذاکره، از هزار شمشیر ارزشمندتر است."},
    {id:"harwyn-mallister",name:"Harwyn Mallister",region:"Riverlands",castle:"Seagard",house:"Mallister",age:29,premium:false,image:"/assets/characters/harwyn-mallister-300q68.txt",about:"Harwyn Mallister، لرد جوان ۲۹ ساله‌ی Seagard، از خاندان Mallister برخاسته و وظیفه‌ی محافظت از سواحل Riverlands را بر عهده دارد. او جنگجویی سریع و جسور است که از خطر عقب‌نشینی نمی‌کند. وفاداری عمیق Harwyn به خاندانش باعث شده حتی در سخت‌ترین شرایط نیز از Seagard و سرزمین‌های خود دفاع کند؛ اما جاه‌طلبی و جوانی ممکن است او را به نبردهایی بکشاند که بهای سنگینی دارند."},
    {id:"elyon-arryn",name:"Elyon Arryn",region:"Vale",castle:"The Eyrie",house:"Arryn",age:38,premium:true,image:"/assets/characters/elyon-arryn-300q68.txt",about:"Elyon Arryn، فرمانده ۳۸ ساله‌ی خاندان Arryn، از ارتفاعات The Eyrie بر سرزمین‌های Vale نظارت می‌کند. او مردی آرام، دقیق و سخت‌گیر است که به خوبی می‌داند کوهستان چگونه می‌تواند یک ارتش بزرگ را پیش از رسیدن به مقصد از پا درآورد. Elyon ترجیح می‌دهد دشمنانش را در زمین خودش شکست دهد؛ جایی که صخره‌ها، مسیرهای باریک و ارتفاعات بلند به یاری خاندان Arryn می‌آیند."}
    {id:"marq-grafton",name:"Marq Grafton",region:"Vale",castle:"Gulltown",house:"Grafton",age:39,premium:false,image:"/assets/characters/marq-grafton-300q68.txt",about:"Marq Grafton، لرد ۳۹ ساله‌ی خاندان Grafton، بر شهر بندری Gulltown فرمان می‌راند. او مردی عمل‌گرا و جاه‌طلب است که اهمیت تجارت، کشتی‌ها و ارتباط با سرزمین‌های دیگر را به‌خوبی می‌داند. برای Marq، قدرت تنها در تعداد سربازان خلاصه نمی‌شود؛ کنترل یک بندر مهم می‌تواند نفوذی به اندازه‌ی یک ارتش قدرتمند ایجاد کند."},
    {id:"alric-redfort",name:"Alric Redfort",region:"Vale",castle:"Redfort",house:"Redfort",age:37,premium:false,image:"/assets/characters/alric-redfort-300q68.txt",about:"Alric Redfort، لرد ۳۷ ساله‌ی خاندان Redfort، از دژ مستحکم Redfort بر سرزمین‌های Vale نظارت می‌کند. او جنگجویی سرسخت و باتجربه است که سال‌ها برای تقویت دیوارها و نیروهای خاندانش تلاش کرده است. Alric باور دارد که یک قلعه‌ی قدرتمند تنها زمانی ارزشمند است که مردانی آماده برای دفاع از آن پشت دیوارهایش ایستاده باشند."},
    {id:"euron-greyjoy",name:"Euron Greyjoy",region:"Iron Islands",castle:"Pyke",house:"Greyjoy",age:39,premium:true,image:"/assets/characters/euron-greyjoy-300q68.txt",about:"Euron Greyjoy، یکی از جنگجویان برجسته‌ی خاندان Greyjoy، از دژ سنگی Pyke بر جزایر آهنین فرمان می‌راند. او مردی بی‌رحم، جسور و غیرقابل‌پیش‌بینی است که دریا را همانند میدان نبرد خود می‌شناسد. برای Euron، ترس دشمنان یک سلاح است و کسی که در برابر طوفان عقب‌نشینی کند، شایسته‌ی فرمانروایی بر Iron Islands نیست."},
    {id:"maron-harlaw",name:"Maron Harlaw",region:"Iron Islands",castle:"Ten Towers",house:"Harlaw",age:35,premium:true,image:"/assets/characters/maron-harlaw-300q68.txt",about:"Maron Harlaw، لرد ۳۵ ساله‌ی خاندان Harlaw، از دژ Ten Towers بر یکی از قدرتمندترین خاندان‌های Iron Islands فرمان می‌راند. او مردی آرام اما خطرناک است که قدرت خود را بیشتر با حسابگری و صبر نشان می‌دهد تا خشم و هیاهو. Maron می‌داند که در جزایر آهنین، احترام گرفتن آسان نیست و تنها کسانی دوام می‌آورند که هم قدرت جنگیدن داشته باشند و هم زمان مناسب برای حمله را بشناسند."}
  ];
  const regions=["The North","Riverlands","Vale","Iron Islands","Westerlands","Crownlands","Stormlands","Reach","Dorne","The Wall"];
  const categories={founding:"تأسیس",packs:"پک‌ها",items:"آیتم‌ها",special:"ویژه"};
  window.khataLordByCastle={Winterfell:"sam-stark",Dreadfort:"roderick-bolton",Karhold:"edrik-karstark","The Twins":"elyas-tully",Seagard:"harwyn-mallister","The Eyrie":"elyon-arryn",Gulltown:"marq-grafton",Redfort:"alric-redfort",Pyke:"euron-greyjoy","Ten Towers":"maron-harlaw"};

  const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  async function loadImage(path){
    if(!path)return "";
    try{const t=await fetch(path,{cache:"force-cache"}).then(r=>r.text());return "data:image/webp;base64,"+t.trim()}catch{return ""}
  }
  function css(){
    if(document.getElementById("khcs-style"))return;
    const s=document.createElement("style");s.id="khcs-style";
    s.textContent=`
      .khcs-region-tabs{display:flex;gap:8px;overflow:auto;margin-top:22px;padding:4px 0 12px}
      .khcs-region-tab{flex:0 0 auto;border:1px solid rgba(255,255,255,.1);background:#0d0d0d;color:#888;padding:10px 14px;cursor:pointer;font:11px Cinzel,serif}
      .khcs-region-tab.active{color:#eee;border-color:#9c0000}
      .khcs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;margin-top:22px}
      .khcs-card{position:relative;padding:0;border:1px solid rgba(255,255,255,.1);background:#0a0a0a;color:inherit;text-align:right;cursor:pointer;overflow:hidden;width:100%}
      .khcs-card:hover{transform:translateY(-4px);border-color:rgba(255,255,255,.3)}
      .khcs-card-img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;background:#111}
      .khcs-card-body{padding:15px 16px 17px}.khcs-card-body h3{margin:0;color:#e8e8e8;font:600 20px Cinzel,serif}
      .khcs-card-body p{margin:8px 0;color:#858585;line-height:1.8;font-size:13px}
      .khcs-badge{position:absolute;top:12px;left:12px;padding:5px 9px;border:1px solid #777;background:#080808cc;color:#ddd;font:10px Cinzel,serif}
      .khcs-meta{display:flex;gap:7px;flex-wrap:wrap;color:#777;font-size:11px}.khcs-meta span{border:1px solid rgba(255,255,255,.08);padding:4px 7px}
      .khcs-shop{display:grid;grid-template-columns:minmax(0,1fr) 235px;gap:24px;margin-top:28px;direction:ltr}
      .khcs-shop-main{min-height:500px;direction:rtl}.khcs-shop-side{display:flex;flex-direction:column;gap:9px;direction:rtl}
      .khcs-tab{position:relative;width:100%;padding:17px 18px;border:1px solid rgba(255,255,255,.1);background:#0d0d0de0;text-align:right;color:#999;cursor:pointer}
      .khcs-tab span{display:block;color:#ddd}.khcs-tab small{display:block;margin-top:4px;color:#666;font:9px Cinzel,serif;letter-spacing:1.5px}
      .khcs-tab.active{border-color:#777;background:#262626}.khcs-tab.active:before{content:'';position:absolute;right:0;top:0;bottom:0;width:3px;background:#9c0000}
      .khcs-head h3{margin:0;color:#eee;font:600 27px Cinzel,serif}.khcs-head p{margin:7px 0 20px;color:#707070}
      .khcs-empty{text-align:center;padding:90px 20px;color:#666}.khcs-empty-mark{font-size:34px;color:#555}.khcs-empty h3{color:#aaa}.khcs-empty p{color:#666}
      .khcs-modal{max-width:980px}.khcs-detail{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:28px;align-items:center}
      .khcs-detail img{width:100%;max-height:650px;object-fit:cover}.khcs-detail h2{margin:0;font:600 31px Cinzel,serif;color:#eee}.khcs-detail p{margin-top:15px;color:#999;line-height:2}
      .lord-link{display:inline-block;margin-top:10px;padding:7px 11px;border:1px solid rgba(255,255,255,.15);color:#aaa;font-size:11px;cursor:pointer}
      .lord-link:hover{color:#eee;border-color:#9c0000}
      @media(max-width:760px){.khcs-shop{grid-template-columns:1fr}.khcs-shop-side{order:-1;display:grid;grid-template-columns:1fr 1fr}.khcs-detail{grid-template-columns:1fr}.khcs-detail img{max-height:430px}}
      @media(max-width:470px){.khcs-shop-side{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }
  function empty(t,p){return '<div class="khcs-empty"><div class="khcs-empty-mark">◈</div><h3>'+esc(t)+'</h3><p>'+esc(p)+'</p></div>'}
  function renderRegionTabs(){
    const root=document.getElementById("khcs-region-tabs"); if(!root)return;
    root.innerHTML=regions.map((r,i)=>'<button class="khcs-region-tab '+(i===0?"active":"")+'" type="button" data-khcs-region="'+esc(r)+'">'+esc(r)+'</button>').join("");
  }
  function render(region){
    const root=document.getElementById("khcs-character-root"); if(!root)return;
    const list=characters.filter(c=>c.region===region);
    if(!list.length){root.innerHTML=empty(region,"هنوز کاراکتری برای این اقلیم ثبت نشده است.");return}
    root.innerHTML='<div class="khcs-grid">'+list.map(c=>'<button class="khcs-card" type="button" data-khcs-character="'+c.id+'"><div style="position:relative"><img class="khcs-card-img" src="'+c._image+'" alt="'+esc(c.name)+'">'+(c.premium?'<span class="khcs-badge">PREMIUM</span>':"")+'</div><div class="khcs-card-body"><h3>'+esc(c.name)+'</h3><p>'+esc(c.about)+'</p><div class="khcs-meta"><span>'+esc(c.castle)+'</span><span>HOUSE '+esc(c.house)+'</span><span>AGE '+c.age+'</span></div></div></button>').join("")+'</div>';
  }
  function setupModal(){
    if(document.getElementById("khcs-modal"))return;
    const m=document.createElement("div");m.id="khcs-modal";m.className="modal hidden";
    m.innerHTML='<div class="modal-card khcs-modal"><button class="close" id="khcs-close">×</button><div id="khcs-detail"></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click",e=>{if(e.target===m||e.target.id==="khcs-close"){m.classList.add("hidden");document.body.classList.remove("modal-open")}});
  }
  window.khataOpenCharacter=async id=>{
    const c=characters.find(x=>x.id===id);if(!c)return;
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="characters"));
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page==="characters"));
    document.querySelectorAll("[data-khcs-region]").forEach(b=>b.classList.toggle("active",b.dataset.khcsRegion===c.region));
    render(c.region);
    const m=document.getElementById("khcs-modal"),d=document.getElementById("khcs-detail");
    d.innerHTML='<div class="khcs-detail"><img src="'+c._image+'" alt="'+esc(c.name)+'"><div><div class="eyebrow">'+(c.premium?"PREMIUM CHARACTER":"CHARACTER")+'</div><h2>'+esc(c.name)+'</h2><div class="khcs-meta"><span>'+esc(c.region)+'</span><span>'+esc(c.castle)+'</span><span>HOUSE '+esc(c.house)+'</span><span>AGE '+c.age+'</span></div><p>'+esc(c.about)+'</p></div></div>';
    m.classList.remove("hidden");document.body.classList.add("modal-open");
  };
  function setupShop(){
    const side=document.getElementById("khcs-shop-side"); if(!side)return;
    side.innerHTML=Object.entries(categories).map(([k,v],i)=>'<button class="khcs-tab '+(i===0?"active":"")+'" type="button" data-khcs-shop="'+k+'"><span>'+v+'</span><small>'+k.toUpperCase()+'</small></button>').join("");
    openShop("founding");
  }
  function openShop(k){
    const root=document.getElementById("khcs-shop-main");if(!root)return;
    document.querySelectorAll("[data-khcs-shop]").forEach(b=>b.classList.toggle("active",b.dataset.khcsShop===k));
    root.innerHTML='<div class="khcs-head"><h3>'+esc(categories[k])+'</h3><p>محتوای این دسته هنوز اضافه نشده است.</p></div>'+empty(categories[k],"بعداً آیتم‌های این دسته اضافه می‌شوند.");
  }
  async function init(){
    css();renderRegionTabs();setupModal();setupShop();
    await Promise.all(characters.map(async c=>c._image=await loadImage(c.image)));
    render("The North");
  }
  document.addEventListener("click",e=>{
    const r=e.target.closest("[data-khcs-region]");if(r){render(r.dataset.khcsRegion);document.querySelectorAll("[data-khcs-region]").forEach(b=>b.classList.toggle("active",b===r))}
    const c=e.target.closest("[data-khcs-character]");if(c)window.khataOpenCharacter(c.dataset.khcsCharacter);
    const s=e.target.closest("[data-khcs-shop]");if(s)openShop(s.dataset.khcsShop);
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();