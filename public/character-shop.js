(() => {
  const characters = [
    {id:"sam-stark",name:"Sam Stark",region:"The North",castle:"Winterfell",house:"Stark",age:41,premium:true,image:"/assets/characters/sam-300q68.txt",about:"Sam Stark، لرد ۴۱ ساله‌ی وینترفل، مردی‌ست که زمستان‌های طولانی شمال را با سختی و سکوت پشت سر گذاشته است. زخم روی صورتش یادگار نبردی‌ست که او را تغییر داد؛ اما چیزی که در نگاهش باقی مانده، اراده‌ای سرد و محکم برای حفظ وینترفل است. اکنون در وینترفل، هر تصمیم او می‌تواند سرنوشت خاندان استارک و سرزمین‌های شمال را تغییر دهد."},
    {id:"roderick-bolton",name:"Roderick Bolton",region:"The North",castle:"Dreadfort",house:"Bolton",age:38,premium:false,image:"/assets/characters/roderick-bolton-300q68.txt",about:"Roderick Bolton، لرد ۳۸ ساله‌ی Dreadfort، از میان سرمای بی‌رحم شمال برخاسته؛ جایی که ترس گاهی از شمشیر قدرتمندتر است. او مردی آرام و حسابگر است که پیش از هر تصمیم، چند قدم جلوتر از دشمنانش را می‌بیند. دیوارهای سرد Dreadfort برای او نمادی از قدرت خاندان بولتون‌اند."},
    {id:"edrik-karstark",name:"Edrik Karstark",region:"The North",castle:"Karhold",house:"Karstark",age:28,premium:false,image:"/assets/characters/edrik-karstark-300q68.txt",about:"Edrik Karstark، لرد ۲۸ ساله‌ی Karhold، از نسل جنگجویانی برخاسته که سرمای شمال را بخشی از وجود خود می‌دانند. جوان است، اما در نگاهش چیزی از بی‌تجربگی دیده نمی‌شود. زخم روی پیشانی‌اش یادگاری از نبردی است که او را به فرمانروایی محتاط تبدیل کرد."},
    {id:"elyas-tully",name:"Elyas Tully",region:"Riverlands",castle:"The Twins",house:"Tully",age:40,premium:true,image:"/assets/characters/edric-tully-300q52.txt",about:"Elyas Tully، لرد ۴۰ ساله‌ی The Twins، در قلب سرزمین‌های رودخانه‌ای میان وفاداری خاندان، سیاست و خطر دائمی جنگ فرمان می‌راند. او مردی آرام و حسابگر است که می‌داند هر پیمان می‌تواند روزی به یک جنگ تبدیل شود؛ برای همین، پیش از هر تصمیم مسیر رودخانه و شمشیر را با هم می‌سنجد."},
    {id:"walder-frey",name:"Walder Frey",region:"Riverlands",castle:"The Twins",house:"Frey",age:34,premium:false,image:"/assets/characters/walder-frey-300q68.txt",about:"Walder Frey، لرد ۳۴ ساله‌ی خاندان Frey، در The Twins بر یکی از مهم‌ترین گذرگاه‌های Riverlands فرمان می‌راند. او مردی جاه‌طلب و حسابگر است که ارزش هر پیمان و هر اتحاد را به‌خوبی می‌داند. برای Walder، قدرت همیشه در میدان نبرد به دست نمی‌آید؛ گاهی کنترل یک گذرگاه و دانستن زمان درست برای مذاکره، از هزار شمشیر ارزشمندتر است."},
    {id:"harwyn-mallister",name:"Harwyn Mallister",region:"Riverlands",castle:"Seagard",house:"Mallister",age:29,premium:false,image:"/assets/characters/harwyn-mallister-300q68.txt",about:"Harwyn Mallister، لرد جوان ۲۹ ساله‌ی Seagard، از خاندان Mallister برخاسته و وظیفه‌ی محافظت از سواحل Riverlands را بر عهده دارد. او جنگجویی سریع و جسور است که از خطر عقب‌نشینی نمی‌کند. وفاداری عمیق Harwyn به خاندانش باعث شده حتی در سخت‌ترین شرایط نیز از Seagard و سرزمین‌های خود دفاع کند؛ اما جاه‌طلبی و جوانی ممکن است او را به نبردهایی بکشاند که بهای سنگینی دارند."},
    {id:"elyon-arryn",name:"Elyon Arryn",region:"Vale",castle:"The Eyrie",house:"Arryn",age:38,premium:true,image:"/assets/characters/elyon-arryn-300q68.txt",about:"Elyon Arryn، فرمانده ۳۸ ساله‌ی خاندان Arryn، از ارتفاعات The Eyrie بر سرزمین‌های Vale نظارت می‌کند. او مردی آرام، دقیق و سخت‌گیر است که به خوبی می‌داند کوهستان چگونه می‌تواند یک ارتش بزرگ را پیش از رسیدن به مقصد از پا درآورد. Elyon ترجیح می‌دهد دشمنانش را در زمین خودش شکست دهد؛ جایی که صخره‌ها، مسیرهای باریک و ارتفاعات بلند به یاری خاندان Arryn می‌آیند."},
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
  try{
    const t=await fetch(path,{cache:"force-cache"}).then(r=>r.text());
    const src="data:image/webp;base64,"+t.trim();
    const img=new Image();
    img.decoding="async";
    img.src=src;
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
    const size=800;
    const canvas=document.createElement("canvas");
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext("2d");
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";
    ctx.drawImage(img,0,0,size,size);
    return canvas.toDataURL("image/webp",0.95);
  }catch{return ""}
})();