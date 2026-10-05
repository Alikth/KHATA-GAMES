(() => {
  const characters = [
    {id:"sam-stark",name:"Sam Stark",region:"The North",castle:"Winterfell",house:"Stark",age:41,premium:true,image:"/assets/characters/5863836446446259906.jpg",about:"Sam Stark، لرد ۴۱ ساله‌ی وینترفل، مردی‌ست که زمستان‌های طولانی شمال را با سختی و سکوت پشت سر گذاشته است. زخم روی صورتش یادگار نبردی‌ست که او را تغییر داد؛ اما چیزی که در نگاهش باقی مانده، اراده‌ای سرد و محکم برای حفظ وینترفل است. اکنون در وینترفل، هر تصمیم او می‌تواند سرنوشت خاندان استارک و سرزمین‌های شمال را تغییر دهد."},
    {id:"roderick-bolton",name:"Roderick Bolton",region:"The North",castle:"The Dreadfort",house:"Bolton",age:38,premium:false,image:"/assets/characters/roderick-bolton-300q68.txt",about:"Roderick Bolton، لرد ۳۸ ساله‌ی Dreadfort، از میان سرمای بی‌رحم شمال برخاسته؛ جایی که ترس گاهی از شمشیر قدرتمندتر است. او مردی آرام و حسابگر است که پیش از هر تصمیم، چند قدم جلوتر از دشمنانش را می‌بیند. دیوارهای سرد Dreadfort برای او نمادی از قدرت خاندان بولتون‌اند."},
    {id:"edrik-karstark",name:"Edrik Karstark",region:"The North",castle:"Karhold",house:"Karstark",age:28,premium:false,image:"/assets/characters/edrik-karstark-300q68.txt",about:"Edrik Karstark، لرد ۲۸ ساله‌ی Karhold، از نسل جنگجویانی برخاسته که سرمای شمال را بخشی از وجود خود می‌دانند. جوان است، اما در نگاهش چیزی از بی‌تجربگی دیده نمی‌شود. زخم روی پیشانی‌اش یادگاری از نبردی است که او را به فرمانروایی محتاط تبدیل کرد."},
    {id:"elyas-tully",name:"Elyas Tully",region:"Riverlands",castle:"The Twins",house:"Tully",age:40,premium:true,image:"/assets/characters/edric-tully-300q52.txt",about:"Elyas Tully، لرد ۴۰ ساله‌ی The Twins، در قلب سرزمین‌های رودخانه‌ای میان وفاداری خاندان، سیاست و خطر دائمی جنگ فرمان می‌راند. او مردی آرام و حسابگر است که می‌داند هر پیمان می‌تواند روزی به یک جنگ تبدیل شود؛ برای همین، پیش از هر تصمیم مسیر رودخانه و شمشیر را با هم می‌سنجد."},
    {id:"walder-frey",name:"Walder Frey",region:"Riverlands",castle:"The Twins",house:"Frey",age:34,premium:false,image:"/assets/characters/walder-frey-300q68.txt",about:"Walder Frey، لرد ۳۴ ساله‌ی خاندان Frey، در The Twins بر یکی از مهم‌ترین گذرگاه‌های Riverlands فرمان می‌راند. او مردی جاه‌طلب و حسابگر است که ارزش هر پیمان و هر اتحاد را به‌خوبی می‌داند. برای Walder، قدرت همیشه در میدان نبرد به دست نمی‌آید؛ گاهی کنترل یک گذرگاه و دانستن زمان درست برای مذاکره، از هزار شمشیر ارزشمندتر است."},
    {id:"harwyn-mallister",name:"Harwyn Mallister",region:"Riverlands",castle:"Seagard",house:"Mallister",age:29,premium:false,image:"/assets/characters/harwyn-mallister-300q68.txt",about:"Harwyn Mallister، لرد جوان ۲۹ ساله‌ی Seagard، از خاندان Mallister برخاسته و وظیفه‌ی محافظت از سواحل Riverlands را بر عهده دارد. او جنگجویی سریع و جسور است که از خطر عقب‌نشینی نمی‌کند. وفاداری عمیق Harwyn به خاندانش باعث شده حتی در سخت‌ترین شرایط نیز از Seagard و سرزمین‌های خود دفاع کند؛ اما جاه‌طلبی و جوانی ممکن است او را به نبردهایی بکشاند که بهای سنگینی دارند."},
    {id:"elyon-arryn",name:"Elyon Arryn",region:"Vale",castle:"The Eyrie",house:"Arryn",age:38,premium:true,image:"/assets/characters/elyon-arryn-300q68.txt",about:"Elyon Arryn، فرمانده ۳۸ ساله‌ی خاندان Arryn، از ارتفاعات The Eyrie بر سرزمین‌های Vale نظارت می‌کند. او مردی آرام، دقیق و سخت‌گیر است که به خوبی می‌داند کوهستان چگونه می‌تواند یک ارتش بزرگ را پیش از رسیدن به مقصد از پا درآورد. Elyon ترجیح می‌دهد دشمنانش را در زمین خودش شکست دهد؛ جایی که صخره‌ها، مسیرهای باریک و ارتفاعات بلند به یاری خاندان Arryn می‌آیند."},
    {id:"marq-grafton",name:"Marq Grafton",region:"Vale",castle:"Gulltown",house:"Grafton",age:39,premium:false,image:"/assets/characters/5863836446446260078.jpg",about:"Marq Grafton، لرد ۳۹ ساله‌ی خاندان Grafton، بر شهر بندری Gulltown فرمان می‌راند. او مردی عمل‌گرا و جاه‌طلب است که اهمیت تجارت، کشتی‌ها و ارتباط با سرزمین‌های دیگر را به‌خوبی می‌داند. برای Marq، قدرت تنها در تعداد سربازان خلاصه نمی‌شود؛ کنترل یک بندر مهم می‌تواند نفوذی به اندازه‌ی یک ارتش قدرتمند ایجاد کند."},
    {id:"alric-redfort",name:"Alric Redfort",region:"Vale",castle:"Redfort",house:"Redfort",age:37,premium:false,image:"/assets/characters/alric-redfort-300q68.txt",about:"Alric Redfort، لرد ۳۷ ساله‌ی خاندان Redfort، از دژ مستحکم Redfort بر سرزمین‌های Vale نظارت می‌کند. او جنگجویی سرسخت و باتجربه است که سال‌ها برای تقویت دیوارها و نیروهای خاندانش تلاش کرده است. Alric باور دارد که یک قلعه‌ی قدرتمند تنها زمانی ارزشمند است که مردانی آماده برای دفاع از آن پشت دیوارهایش ایستاده باشند."},
    {id:"gorold-goodbrother",name:"Gorold Goodbrother",region:"Iron Islands",castle:"Hammerhorn",house:"Goodbrother",age:37,premium:false,image:"/assets/characters/gorold-goodbrother-300q25.txt",about:"Gorold Goodbrother، لرد ۳۷ ساله‌ی Hammerhorn، از خاندان Goodbrother در Iron Islands برخاسته است. او مردی سخت‌گیر و اهل دریاست که قدرت خاندانش را در کشتی‌ها، آهن و کنترل سواحل می‌بیند. Gorold پیش از هر تصمیم، هزینه‌ی یک نبرد را می‌سنجد و ترجیح می‌دهد دشمنانش را در جایی غافلگیر کند که دریا به یاری او بیاید."},
    {id:"damon-lannister",name:"Damon Lannister",region:"Westerlands",castle:"Casterly Rock",house:"Lannister",age:40,premium:true,image:"/assets/characters/5866231268670901925.jpg",about:"Damon Lannister، لرد ۴۰ ساله‌ی Casterly Rock، از خاندان Lannister و یکی از چهره‌های بانفوذ Westerlands است. او مردی مغرور، حسابگر و آشنا با سیاست دربار است که ثروت و قدرت خاندانش را دو ستون جدایی‌ناپذیر می‌داند. Damon می‌داند که گاهی یک پیمان درست، از یک پیروزی در میدان نبرد ارزشمندتر است."},
    {id:"tytos-brax",name:"Tytos Brax",region:"Westerlands",castle:"Hornvale",house:"Brax",age:34,premium:false,image:"/assets/characters/5866231268670901935.jpg",about:"Tytos Brax، لرد ۳۴ ساله‌ی Hornvale، از خاندان Brax در Westerlands فرمان می‌راند. او جنگجویی منضبط و وفادار است که به جای نمایش قدرت، روی آموزش نیروها و استحکام موقعیت خاندانش تمرکز دارد. Tytos می‌داند که در جنگ‌های بزرگ، نظم و زمان‌بندی می‌تواند نتیجه را تعیین کند."},
    {id:"addam-marbrand",name:"Addam Marbrand",region:"Westerlands",castle:"Ashemark",house:"Marbrand",age:29,premium:false,image:"/assets/characters/5866231268670901937.jpg",about:"Addam Marbrand، لرد ۲۹ ساله‌ی Ashemark، از خاندان Marbrand در Westerlands برخاسته است. جوان و جسور است و به سرعت عمل و حملات غافلگیرکننده تکیه دارد. Addam تلاش می‌کند در کنار وفاداری به خاندانش، جایگاه Marbrand را میان خاندان‌های قدرتمند Westerlands بالاتر ببرد."},
    {id:"euron-greyjoy",name:"Euron Greyjoy",region:"Iron Islands",castle:"Pyke",house:"Greyjoy",age:39,premium:true,image:"/assets/characters/euron-greyjoy-300q68.txt",about:"Euron Greyjoy، یکی از جنگجویان برجسته‌ی خاندان Greyjoy، از دژ سنگی Pyke بر جزایر آهنین فرمان می‌راند. او مردی بی‌رحم، جسور و غیرقابل‌پیش‌بینی است که دریا را همانند میدان نبرد خود می‌شناسد. برای Euron، ترس دشمنان یک سلاح است و کسی که در برابر طوفان عقب‌نشینی کند، شایسته‌ی فرمانروایی بر Iron Islands نیست."},
    {id:"maron-harlaw",name:"Maron Harlaw",region:"Iron Islands",castle:"Ten Towers",house:"Harlaw",age:35,premium:true,image:"/assets/characters/maron-harlaw-300q68.txt",about:"Maron Harlaw، لرد ۳۵ ساله‌ی خاندان Harlaw، از دژ Ten Towers بر یکی از قدرتمندترین خاندان‌های Iron Islands فرمان می‌راند. او مردی آرام اما خطرناک است که قدرت خود را بیشتر با حسابگری و صبر نشان می‌دهد تا خشم و هیاهو. Maron می‌داند که در جزایر آهنین، احترام گرفتن آسان نیست و تنها کسانی دوام می‌آورند که هم قدرت جنگیدن داشته باشند و هم زمان مناسب برای حمله را بشناسند."},
    {id:"vaeron-targaryen",name:"Vaeron Targaryen",region:"Crownlands",castle:"Dragonstone",house:"Targaryen",age:30,premium:true,image:"/assets/characters/5866231268670902017.jpg",about:"Vaeron Targaryen، لرد ۳۰ ساله‌ی Dragonstone، وارث یکی از کهن‌ترین خاندان‌های وستروس است. او با اژدها و آتش پیوندی عمیق دارد و از قلعه‌ی سنگی Dragonstone بر آب‌های Crownlands نظارت می‌کند. Vaeron مردی سرد و باوقار است که قدرت خاندانش را نه تنها در شمشیر، بلکه در میراث والریایی و ترس دشمنان از نام Targaryen می‌بیند."},
    {id:"lucan-bar-emmon",name:"Lucan Bar Emmon",region:"Crownlands",castle:"Sharp Point",house:"Bar Emmon",age:42,premium:false,image:"/assets/characters/5866231268670902016.jpg",about:"Lucan Bar Emmon، لرد ۴۲ ساله‌ی Sharp Point، از خاندان Bar Emmon و یکی از نجیب‌زادگان قدیمی Crownlands است. سال‌ها تجربه به او آموخته که قدرت یک دژ ساحلی تنها به دیوارهایش وابسته نیست؛ بلکه به کشتی‌ها، دیده‌بان‌ها و توانایی کنترل مسیرهای دریایی بستگی دارد. Lucan آرام و محتاط است و پیش از هر نبرد، به دنبال راهی برای تبدیل موقعیت جغرافیایی قلعه به برتری می‌گردد."},
    {id:"stannis-baratheon",name:"Stannis Baratheon",region:"Stormlands",castle:"Storm's End",house:"Baratheon",age:46,premium:true,image:"",crest:"🦌",about:"Stannis Baratheon، فرمانروای Storm's End، مردی سخت‌گیر و منضبط است که قدرت خود را در نظم، دفاع مستحکم و وفاداری به خاندانش می‌بیند."},
    {id:"ronnel-fell",name:"Ronnel Fell",region:"Stormlands",castle:"Fellwood",house:"Fell",age:39,premium:false,image:"",crest:"🦌",about:"Ronnel Fell، لرد Fellwood، بر یکی از خاندان‌های شناخته‌شده Stormlands فرمان می‌راند و بیش از هر چیز به استحکام دژ و آمادگی نیروهایش اهمیت می‌دهد."},
    {id:"beric-dondarrion",name:"Beric Dondarrion",region:"Stormlands",castle:"Blackhaven",house:"Dondarrion",age:38,premium:false,image:"",crest:"⚡",about:"Beric Dondarrion، لرد Blackhaven، جنگجویی سرسخت از مرزهای Stormlands است که سال‌ها از دژ و مسیرهای جنوبی محافظت کرده است."},
    {id:"mace-tyrell",name:"Mace Tyrell",region:"Reach",castle:"Highgarden",house:"Tyrell",age:45,premium:true,image:"",crest:"🌹",about:"Mace Tyrell، لرد Highgarden، از قلب سرزمین‌های حاصلخیز Reach بر خاندان Tyrell فرمان می‌راند و قدرت را در اتحاد، ثروت و نفوذ سیاسی می‌بیند."},
    {id:"randyll-tarly",name:"Randyll Tarly",region:"Reach",castle:"Horn Hill",house:"Tarly",age:49,premium:false,image:"",crest:"🌹",about:"Randyll Tarly، لرد Horn Hill، فرماندهی سخت‌گیر و باتجربه است که سپاه منظم و انضباط را مهم‌ترین سرمایه خاندان خود می‌داند."},
    {id:"leyton-hightower",name:"Leyton Hightower",region:"Reach",castle:"Oldtown",house:"Hightower",age:62,premium:false,image:"",crest:"🗼",about:"Leyton Hightower، لرد Oldtown، از یکی از بزرگ‌ترین مراکز بندری و علمی Westeros فرمان می‌راند و شبکه‌ای گسترده از تجارت و نفوذ در اختیار دارد."},
    {id:"doran-martell",name:"Doran Martell",region:"Dorne",castle:"Sunspear",house:"Martell",age:53,premium:true,image:"",crest:"☀️",about:"Doran Martell، شاهزاده Sunspear، مردی صبور و حسابگر است که سیاست، صبر و شناخت دقیق دشمنان را سلاح اصلی خاندان Martell می‌داند."},
    {id:"nymeria-manwoody",name:"Nymeria Manwoody",region:"Dorne",castle:"Kingsgrave",house:"Manwoody",age:36,premium:false,image:"",crest:"☀️",about:"Nymeria Manwoody، بانوی Kingsgrave، از یکی از خاندان‌های قدیمی Dorne برخاسته و قدرت خود را بر شناخت صحرا، مسیرهای جنوبی و وفاداری خاندانش بنا کرده است."},
    {id:"anders-yronwood",name:"Anders Yronwood",region:"Dorne",castle:"Yronwood",house:"Yronwood",age:44,premium:false,image:"",crest:"☀️",about:"Anders Yronwood، لرد Yronwood، بر دژی بزرگ در شمال‌غربی Dorne فرمان می‌راند و مرزهای دشوار این سرزمین را با دقت زیر نظر دارد."},
    {id:"jon-snow",name:"Jon Snow",region:"The Wall",castle:"Castle Black",house:"Night's Watch",age:24,premium:true,image:"",crest:"🛡️",about:"Jon Snow، فرمانده Castle Black، در سخت‌ترین بخش شمال به نگهبانان شب خدمت می‌کند و وظیفه دفاع از دیوار را بر هر جاه‌طلبی شخصی مقدم می‌داند."},
    {id:"eddison-tollett",name:"Eddison Tollett",region:"The Wall",castle:"Eastwatch",house:"Night's Watch",age:34,premium:false,image:"",crest:"🛡️",about:"Eddison Tollett، از افسران Eastwatch، سال‌ها در برابر سرمای شمال و تهدیدهای فراتر از دیوار ایستاده و یکی از چهره‌های باتجربه نگهبانان شب است."},
    {id:"alliser-thorne",name:"Alliser Thorne",region:"The Wall",castle:"Shadow Tower",house:"Night's Watch",age:52,premium:false,image:"",crest:"🛡️",about:"Alliser Thorne، از فرماندهان Shadow Tower، مردی سخت‌گیر و جنگ‌آزموده است که آموزش سربازان و نگهبانی از مسیرهای غربی دیوار را جدی می‌گیرد."},
  ];
  const regions=["The North","Riverlands","Vale","Iron Islands","Westerlands","Crownlands","Stormlands","Reach","Dorne","The Wall"];
  const categories={founding:"تأسیس",packs:"پک‌ها",items:"آیتم‌ها",special:"ویژه"};
  const foundingPackages=[
    {name:"BASIC",className:"basic",price:"399T💎",resources:[["👥 رعیت","600"],["💰 سکه","5000"],["🪵 چوب","500"],["🪨 سنگ","500"],["⛓ آهن","500"],["🍇 انگور","50"],["🥩 گوشت","500"],["🐟 ماهی","500"],["🌾 غلات","4000"],["🐎 اسب","0"],["🌑 شیشه اژدها","0"],["🧪 وایلدفایر","0"]],buildings:[["🌾 مزرعه","Lv.1","500"],["🪵 چوب‌بری","Lv.0","0"],["🪨 معدن سنگ","Lv.0","0"],["⛓ معدن آهن","Lv.0","0"],["🛒 بازارچه","Lv.0","0"],["🥩 کشتارگاه","Lv.0","0"],["🐎 اصطبل","Lv.0","0"],["🏘️ دهکده","Lv.1","0"],["🎮 مرکز تفریحی","Lv.0","0"]],military:[["🗡️ کمپ شمشیرزن","Lv.1","100"],["🏹 کمپ کماندار","Lv.0","0"],["🔱 کمپ نیزه‌دار","Lv.0","0"],["🏇 کمپ سواره‌نظام","Lv.0","0"],["⭐ کمپ ویژه اقلیم","Lv.0","0"],["🏭 ادوات","","0"],["⛵ کشتی‌سازی","","0"]],units:[["🗡 شمشیرزن","500"],["🏹 کماندار","200"],["🔱 نیزه‌دار","100"],["🏇 سواره‌نظام","100"],["⭐ نیروی ویژه اقلیم","50"],["🪜 نردبان","5"],["🔩 دژکوب","3"],["☄️ منجنیق","2"],["🦂 اسکورپ","1"],["🏗️ برج محاصره","1"]],fleet:[["⛵ کشتی ترابری","1"],["⛴️ کشتی جنگی","1"]]},
    {name:"PRO",className:"pro",price:"849T💎",resources:[["👥 رعیت","500"],["💰 سکه","9000"],["🪵 چوب","1100"],["🪨 سنگ","1000"],["⛓ آهن","950"],["🍇 انگور","100"],["🥩 گوشت","750"],["🐟 ماهی","750"],["🌾 غلات","6000"],["🐎 اسب","70"],["🌑 شیشه اژدها","50"],["🧪 وایلدفایر","1"]],buildings:[["🌾 مزرعه","Lv.3","1500"],["🪵 چوب‌بری","Lv.1","300"],["🪨 معدن سنگ","Lv.1","50"],["⛓ معدن آهن","Lv.1","100"],["🛒 بازارچه","Lv.1","800"],["🥩 کشتارگاه","Lv.1","100"],["🐎 اصطبل","Lv.1","20"],["🏘️ دهکده","Lv.1","50"],["🎮 مرکز تفریحی","Lv.1","500"]],military:[["🗡️ کمپ شمشیرزن","Lv.3","300"],["🏹 کمپ کماندار","Lv.2","200"],["🔱 کمپ نیزه‌دار","Lv.2","200"],["🏇 کمپ سواره‌نظام","Lv.2","200"],["⭐ کمپ ویژه اقلیم","Lv.1","50"],["🏭 ادوات","","2"],["⛵ کشتی‌سازی","","1"]],units:[["🗡 شمشیرزن","850"],["🏹 کماندار","400"],["🔱 نیزه‌دار","300"],["🏇 سواره‌نظام","250"],["⭐ نیروی ویژه اقلیم","100"],["🪜 نردبان","10"],["🔩 دژکوب","5"],["☄️ منجنیق","4"],["🦂 اسکورپ","3"],["🏗️ برج محاصره","3"]],fleet:[["⛵ کشتی ترابری","2"],["⛴️ کشتی جنگی","3"]]},
    {name:"EPIC",className:"epic",price:"1299T💎",resources:[["👥 رعیت","750"],["💰 سکه","12000"],["🪵 چوب","1450"],["🪨 سنگ","1200"],["⛓ آهن","1150"],["🍇 انگور","200"],["🥩 گوشت","1000"],["🐟 ماهی","1000"],["🌾 غلات","8000"],["🐎 اسب","150"],["🌑 شیشه اژدها","80"],["🧪 وایلدفایر","2"]],buildings:[["🌾 مزرعه","Lv.4","2000"],["🪵 چوب‌بری","Lv.2","600"],["🪨 معدن سنگ","Lv.2","100"],["⛓ معدن آهن","Lv.2","200"],["🛒 بازارچه","Lv.2","1600"],["🥩 کشتارگاه","Lv.2","200"],["🐎 اصطبل","Lv.2","40"],["🏘️ دهکده","Lv.3","150"],["🎮 مرکز تفریحی","Lv.2","1000"]],military:[["🗡️ کمپ شمشیرزن","Lv.4","400"],["🏹 کمپ کماندار","Lv.3","300"],["🔱 کمپ نیزه‌دار","Lv.3","300"],["🏇 کمپ سواره‌نظام","Lv.3","300"],["⭐ کمپ ویژه اقلیم","Lv.2","100"],["🏭 ادوات","","3"],["⛵ کشتی‌سازی","","3"]],units:[["🗡 شمشیرزن","1200"],["🏹 کماندار","850"],["🔱 نیزه‌دار","650"],["🏇 سواره‌نظام","500"],["⭐ نیروی ویژه اقلیم","200"],["🪜 نردبان","20"],["🔩 دژکوب","10"],["☄️ منجنیق","8"],["🦂 اسکورپ","4"],["🏗️ برج محاصره","4"]],fleet:[["⛵ کشتی ترابری","6"],["⛴️ کشتی جنگی","8"]]}
  ];
  const shopPacks={
    resources:[
      {name:"BASIC",className:"basic",price:"389T",renew:"هر هفته",lord:"لرد تک قلعه ای (۳عدد)",multi:"لرد چند قلعه ای (۲ عدد برای یک قلعه ۱ عدد برای هر قلعه )",rows:[["👤 رعیت","500"],["💰 سکه","4500"],["🪵 چوب","850"],["🪨 سنگ","600"],["⛓️ آهن","500"],["🍇 انگور","200"],["🥩 گوشت","500"],["🐟 ماهی","700"],["🌾 غلات","1500"],["🐎 اسب","100"],["🛢 قیر","5"],["🐉 دراگون گلس","100"]]},
      {name:"EPIC",className:"epic",price:"755T",renew:"هر هفته یکی",lord:"لرد تک قلعه ای (2عدد)",multi:"لرد چند قلعه ای (1 عدد برای هر قلعه)",rows:[["👤 رعیت","1100"],["💰 سکه","8500"],["🪵 چوب","1600"],["🪨 سنگ","1100"],["⛓️ آهن","1000"],["🍇 انگور","400"],["🥩 گوشت","900"],["🐟 ماهی","1300"],["🌾 غلات","3000"],["🐎 اسب","200"],["🛢 قیر","10"],["🐉 دراگون گلس","105"]]}
    ],
    army:[
      {name:"BASIC",className:"basic",price:"350T",renew:"هر هفته 3 عدد",units:[["🗡️ شمشیر زن","600"],["🏹 کماندار","600"],["🔱 نیزه دار","600"],["🏇 سواره نظام","400"],["🌍 ویژه اقلیم","300"]],siege:[["🪜 نردبان","8"],["🔩 دژکوب","3"],["☄️ منجنیق","3"],["🦂 اسکورپ","1"],["🗼 برج محاصره","0"]]},
      {name:"EPIC",className:"epic",price:"800T",renew:"هفته ای یکی",units:[["🗡️ شمشیر زن","1300"],["🏹 کماندار","1300"],["🔱 نیزه دار","1200"],["🏇 سواره نظام","800"],["🌍 مخصوص هر اقلیم","620"]],siege:[["🪜 نردبان","17"],["🔩 دژکوب","6"],["☄️ منجنیق","6"],["🦂 اسکورپ","2"],["🗼 برج محاصره","2"]]}
    ]
  };
  window.khataLordByCastle={Winterfell:"sam-stark","The Dreadfort":"roderick-bolton",Karhold:"edrik-karstark","The Twins":"elyas-tully",Seagard:"harwyn-mallister","The Eyrie":"elyon-arryn",Gulltown:"marq-grafton",Redfort:"alric-redfort",Pyke:"euron-greyjoy","Ten Towers":"maron-harlaw",Hammerhorn:"gorold-goodbrother","Casterly Rock":"damon-lannister",Hornvale:"tytos-brax",Ashemark:"addam-marbrand",Dragonstone:"vaeron-targaryen","Sharp Point":"lucan-bar-emmon","Storm's End":"stannis-baratheon",Fellwood:"ronnel-fell",Blackhaven:"beric-dondarrion",Highgarden:"mace-tyrell","Horn Hill":"randyll-tarly",Oldtown:"leyton-hightower",Sunspear:"doran-martell",Kingsgrave:"nymeria-manwoody",Yronwood:"anders-yronwood","Castle Black":"jon-snow",Eastwatch:"eddison-tollett","Shadow Tower":"alliser-thorne"};

  const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  function bytesToBase64(bytes){
    let binary="";
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(binary);
  }
  async function loadImage(path){
    if(!path)return "";
    try{
      const r=await fetch(path,{cache:"no-store"});
      if(!r.ok)throw new Error("image fetch failed");
      const buffer=new Uint8Array(await r.arrayBuffer());
      const isWebP=buffer.length>=12&&buffer[0]===0x52&&buffer[1]===0x49&&buffer[2]===0x46&&buffer[3]===0x46&&buffer[8]===0x57&&buffer[9]===0x45&&buffer[10]===0x42&&buffer[11]===0x50;
      const isPNG=buffer.length>=8&&buffer[0]===0x89&&buffer[1]===0x50&&buffer[2]===0x4e&&buffer[3]===0x47&&buffer[4]===0x0d&&buffer[5]===0x0a&&buffer[6]===0x1a&&buffer[7]===0x0a;
      const isJPG=buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
      if(isWebP||isPNG||isJPG){
        const mime=isWebP?"image/webp":isPNG?"image/png":"image/jpeg";
        return "data:"+mime+";base64,"+bytesToBase64(buffer);
      }
      const t=new TextDecoder().decode(buffer).trim();
      if(!t)return "";
      const raw=t.startsWith("data:image/")?t.slice(t.indexOf(",")+1):t;
      const binary=atob(raw.replace(/\\s+/g,""));
      const decoded=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)decoded[i]=binary.charCodeAt(i);
      const dWebP=decoded.length>=12&&decoded[0]===0x52&&decoded[1]===0x49&&decoded[2]===0x46&&decoded[3]===0x46&&decoded[8]===0x57&&decoded[9]===0x45&&decoded[10]===0x42&&decoded[11]===0x50;
      const dPNG=decoded.length>=8&&decoded[0]===0x89&&decoded[1]===0x50&&decoded[2]===0x4e&&decoded[3]===0x47&&decoded[4]===0x0d&&decoded[5]===0x0a&&decoded[6]===0x1a&&decoded[7]===0x0a;
      const dJPG=decoded.length>=3&&decoded[0]===0xff&&decoded[1]===0xd8&&decoded[2]===0xff;
      if(!dWebP&&!dPNG&&!dJPG)return "";
      const mime=dWebP?"image/webp":dPNG?"image/png":"image/jpeg";
      return "data:"+mime+";base64,"+bytesToBase64(decoded);
    }catch{return ""}
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
      .khcs-card-img{width:100%;aspect-ratio:1/1;object-fit:contain;display:block;background:#111}.khcs-card-placeholder{display:grid;place-items:center;font-size:78px;color:#777;background:radial-gradient(circle at center,#202020 0,#0b0b0b 70%)}.khcs-detail-placeholder{width:100%;aspect-ratio:1/1;max-height:650px;display:grid;place-items:center;font-size:120px;color:#777;background:radial-gradient(circle at center,#202020 0,#0b0b0b 70%)}
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
      .khcs-pack-switch{position:sticky;top:12px;z-index:20;display:flex;justify-content:flex-start;gap:8px;margin:0 0 22px;padding:6px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(10,10,10,.9);backdrop-filter:blur(12px);box-shadow:0 12px 30px rgba(0,0,0,.3)}
      .khcs-pack-switch button{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#101010;color:#777;padding:11px 22px;font:700 13px Cinzel,serif;cursor:pointer;transition:all .25s ease}.khcs-pack-switch button:hover{color:#ddd;border-color:rgba(255,255,255,.22)}
      .khcs-pack-switch button.active{color:#fff;background:#252525;border-color:#aaa;box-shadow:0 0 18px rgba(255,255,255,.08)}
      .khcs-packs-content{animation:khcsPackIn .35s ease both}.khcs-pack-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}.khcs-pack-card{position:relative;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:radial-gradient(circle at 50% 0,rgba(255,255,255,.08),transparent 35%),linear-gradient(180deg,#171717,#080808);overflow:hidden;box-shadow:0 16px 45px rgba(0,0,0,.38);transition:transform .3s ease,box-shadow .3s ease}.khcs-pack-card:hover{transform:translateY(-7px);box-shadow:0 24px 55px rgba(0,0,0,.55)}
      .khcs-pack-card.pro{border-color:rgba(156,0,0,.45)}.khcs-pack-card.epic{border-color:rgba(123,63,180,.55);box-shadow:0 0 30px rgba(123,63,180,.18),0 16px 45px rgba(0,0,0,.38)}.khcs-pack-card.basic{border-color:rgba(255,255,255,.16)}
      .khcs-pack-card-head{padding:28px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08)}.khcs-pack-card-head h4{margin:0;font:800 32px Cinzel,serif;letter-spacing:4px;color:#eee}.khcs-pack-card-head small{display:block;margin-top:8px;color:#777;font-size:12px}.khcs-pack-card-section{padding:20px;border-bottom:1px solid rgba(255,255,255,.06)}.khcs-pack-card-section h5{margin:0 0 14px;color:#aaa;font:700 14px Cinzel,serif;letter-spacing:1.3px}.khcs-pack-card-list{display:grid;gap:9px}.khcs-pack-card-row{display:flex;justify-content:space-between;gap:14px;color:#aaa;font-size:14px}.khcs-pack-card-row b{color:#ddd}.khcs-pack-card-row span{color:#fff;font-weight:800}.khcs-pack-card-footer{margin-top:auto;padding:20px;text-align:center;border-top:1px solid rgba(255,255,255,.08)}.khcs-pack-card-footer strong{display:block;color:#fff;font:900 24px Cinzel,serif;text-shadow:0 0 18px rgba(255,255,255,.18)}.khcs-pack-card-footer small{display:block;margin-top:7px;color:#777;font-size:12px}
      .khcs-pack-card-note{padding:0 20px 18px;color:#999;font-size:12px;line-height:1.9;text-align:center}.khcs-pack-card-note b{color:#ddd;display:block}.khcs-pack-card-note span{display:block}
      @keyframes khcsPackIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:760px){.khcs-pack-grid{grid-template-columns:1fr}.khcs-pack-switch{top:6px}.khcs-pack-switch button{flex:1;padding:10px 12px}}

      .khcs-empty{text-align:center;padding:90px 20px;color:#666}.khcs-empty-mark{font-size:34px;color:#555}.khcs-empty h3{color:#aaa}.khcs-empty p{color:#666}
      .khcs-founding-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;align-items:stretch}
      .khcs-package{position:relative;display:flex;flex-direction:column;min-height:100%;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:radial-gradient(circle at 50% 0,rgba(255,255,255,.09),transparent 34%),linear-gradient(180deg,#171717,#080808 72%);overflow:hidden;box-shadow:0 16px 45px rgba(0,0,0,.38);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .35s}
      .khcs-package:before{content:"";position:absolute;inset:-2px;border-radius:30px;padding:2px;background:conic-gradient(from 0deg,transparent 0 55%,rgba(255,255,255,.5),transparent 70% 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:khcsSpin 6s linear infinite;pointer-events:none;opacity:.5}
      .khcs-package:hover{transform:translateY(-10px) scale(1.015);box-shadow:0 25px 65px rgba(0,0,0,.55);border-color:rgba(255,255,255,.28)}
      .khcs-package.pro{border-color:rgba(156,0,0,.5);box-shadow:0 0 32px rgba(156,0,0,.28),0 16px 45px rgba(0,0,0,.38)}
      .khcs-package.pro:before{background:conic-gradient(from 0deg,transparent 0 35%,rgba(255,45,45,.95),rgba(156,0,0,.35) 55%,transparent 72% 100%);opacity:.8}
      .khcs-package.pro:hover{box-shadow:0 0 48px rgba(156,0,0,.5),0 25px 65px rgba(0,0,0,.55)}
      .khcs-package.epic{border-color:rgba(123,63,180,.55);box-shadow:0 0 36px rgba(123,63,180,.3),0 16px 45px rgba(0,0,0,.38)}
      .khcs-package.epic:before{background:conic-gradient(from 0deg,transparent 0 35%,rgba(190,105,255,.95),rgba(123,63,180,.35) 55%,transparent 72% 100%);opacity:.82}
      .khcs-package.epic:hover{box-shadow:0 0 52px rgba(123,63,180,.55),0 25px 65px rgba(0,0,0,.55)}
      .khcs-package:after{content:"";position:absolute;top:-80px;left:-35%;width:35%;height:140%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent);transform:rotate(18deg);animation:khcsShine 4.8s ease-in-out infinite;pointer-events:none}
      .khcs-package-head{position:relative;padding:30px 20px 24px;border-bottom:1px solid rgba(255,255,255,.08);text-align:center;z-index:1}
      .khcs-package-head h4{margin:0;font:800 34px Cinzel,serif;letter-spacing:4px;color:#eee;text-shadow:0 0 22px rgba(255,255,255,.18)}
      .khcs-package.basic .khcs-package-head{border-top:4px solid #777}.khcs-package.pro .khcs-package-head{border-top:4px solid #9c0000}.khcs-package.epic .khcs-package-head{border-top:4px solid #7b3fb4}
      .khcs-package-price{display:none}
      .khcs-package-section{position:relative;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.06);z-index:1}
      .khcs-package-section:last-of-type{border-bottom:0}
      .khcs-package-section h5{margin:0 0 13px;color:#aaa;font:700 14px Cinzel,serif;letter-spacing:1.5px}
      .khcs-package-list{display:grid;gap:8px}
      .khcs-package-row{display:flex;justify-content:space-between;gap:14px;color:#999;font-size:13px;line-height:1.55}
      .khcs-package-row b{color:#ddd;font-weight:600}.khcs-package-row span:last-child{color:#ddd;font-weight:700;white-space:nowrap}
      .khcs-package-footer{position:relative;margin-top:auto;padding:24px 20px 28px;text-align:center;border-top:1px solid rgba(255,255,255,.09);z-index:1;background:rgba(0,0,0,.18)}
      .khcs-package-footer small{display:block;color:#777;font:700 11px Cinzel,serif;letter-spacing:2px;margin-bottom:7px}
      .khcs-package-footer strong{display:block;color:#fff;font:900 25px Cinzel,serif;letter-spacing:1px;text-shadow:0 0 18px rgba(255,255,255,.2)}
      @keyframes khcsSpin{to{transform:rotate(360deg)}}@keyframes khcsShine{0%,55%{left:-45%;opacity:0}65%{opacity:1}85%,100%{left:125%;opacity:0}}
      @media(max-width:1000px){.khcs-founding-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:680px){.khcs-founding-grid{grid-template-columns:1fr}}
      .khcs-modal{max-width:980px}.khcs-detail{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:28px;align-items:center}
      .khcs-detail img{width:100%;aspect-ratio:1/1;max-height:650px;object-fit:contain;background:#111}.khcs-detail h2{margin:0;font:600 31px Cinzel,serif;color:#eee}.khcs-detail p{margin-top:15px;color:#999;line-height:2}
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
    root.innerHTML='<div class="khcs-grid">'+list.map(c=>'<button class="khcs-card" type="button" data-khcs-character="'+c.id+'"><div style="position:relative">'+(c._image?'<img class="khcs-card-img" src="'+c._image+'" alt="'+esc(c.name)+'">':'<div class="khcs-card-img khcs-card-placeholder">'+esc(c.crest||"⚔")+'</div>')+(c.premium?'<span class="khcs-badge">PREMIUM</span>':"")+'</div><div class="khcs-card-body"><h3>'+esc(c.name)+'</h3><p>'+esc(c.about)+'</p><div class="khcs-meta"><span>'+esc(c.castle)+'</span><span>HOUSE '+esc(c.house)+'</span><span>AGE '+c.age+'</span></div></div></button>').join("")+'</div>';
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
    d.innerHTML='<div class="khcs-detail">'+(c._image?'<img src="'+c._image+'" alt="'+esc(c.name)+'">':'<div class="khcs-detail-placeholder">'+esc(c.crest||"⚔")+'</div>')+'<div><div class="eyebrow">'+(c.premium?"PREMIUM CHARACTER":"CHARACTER")+'</div><h2>'+esc(c.name)+'</h2><div class="khcs-meta"><span>'+esc(c.region)+'</span><span>'+esc(c.castle)+'</span><span>HOUSE '+esc(c.house)+'</span><span>AGE '+c.age+'</span></div><p>'+esc(c.about)+'</p></div></div>';
    m.classList.remove("hidden");document.body.classList.add("modal-open");
  };
  function setupShop(){
    const side=document.getElementById("khcs-shop-side"); if(!side)return;
    side.innerHTML=Object.entries(categories).map(([k,v],i)=>'<button class="khcs-tab '+(i===0?"active":"")+'" type="button" data-khcs-shop="'+k+'"><span>'+v+'</span><small>'+k.toUpperCase()+'</small></button>').join("");
    openShop("founding");
  }
  function renderPacks(mode){
    const root=document.getElementById("khcs-shop-main");if(!root)return;
    const packList=shopPacks[mode]||shopPacks.resources;
    const isArmy=mode==="army";
    const section=(title,rows)=>'<section class="khcs-pack-card-section"><h5>'+title+'</h5><div class="khcs-pack-card-list">'+rows.map(r=>'<div class="khcs-pack-card-row"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>').join("")+'</div></section>';
    root.innerHTML='<div class="khcs-head"><h3>پک‌ها</h3><p>'+ (isArmy?"پک‌های ارتش":"پک‌های منابع") +'</p></div><div class="khcs-pack-switch"><button type="button" class="'+(!isArmy?"active":"")+'" data-khcs-pack-mode="resources">💎 منابع</button><button type="button" class="'+(isArmy?"active":"")+'" data-khcs-pack-mode="army">⚔️ ارتش</button></div><div class="khcs-packs-content"><div class="khcs-pack-grid">'+packList.map(p=>'<article class="khcs-pack-card '+p.className+'"><header class="khcs-pack-card-head"><h4>'+esc(p.name)+'</h4><small>KILL THE KING</small></header>'+section(isArmy?"🩸 واحد های جنگی 🩸":"💎 منابع",p.rows||p.units)+(isArmy?section("🪜 ادوات 🪜",p.siege):'<div class="khcs-pack-card-note"><b>'+esc(p.lord)+'</b><span>'+esc(p.multi)+'</span></div>')+'<footer class="khcs-pack-card-footer"><strong>👑 PRICE: '+esc(p.price)+'</strong><small>🔄 RENEW : '+esc(p.renew)+'</small></footer></article>').join("")+'</div></div>';
  }
  function openShop(k){
    const root=document.getElementById("khcs-shop-main");if(!root)return;
    document.querySelectorAll("[data-khcs-shop]").forEach(b=>b.classList.toggle("active",b.dataset.khcsShop===k));
    if(k==="packs"){
      renderPacks("resources");
      return;
    }
    if(k!=="founding"){
      root.innerHTML='<div class="khcs-head"><h3>'+esc(categories[k])+'</h3><p>محتوای این دسته هنوز اضافه نشده است.</p></div>'+empty(categories[k],"بعداً آیتم‌های این دسته اضافه می‌شوند.");
      return;
    }
    const section=(title,rows,three)=>'<section class="khcs-package-section"><h5>'+title+'</h5><div class="khcs-package-list">'+rows.map(r=>'<div class="khcs-package-row"><b>'+esc(r[0])+(three&&r[1]?'〔'+esc(r[1])+'〕':'')+'</b><span>'+esc(three?r[2]:r[1])+'</span></div>').join("")+'</div></section>';
    root.innerHTML='<div class="khcs-head"><h3>تأسیس</h3><p>سه بسته‌ی آغازین قلمرو، به‌صورت جداگانه و کامل.</p></div><div class="khcs-founding-grid">'+foundingPackages.map(p=>'<article class="khcs-package '+p.className+'"><header class="khcs-package-head"><h4>'+esc(p.name)+'</h4><span class="khcs-package-price">PRICE: '+esc(p.price)+'</span></header>'+section("📦 منابع",p.resources,false)+section("🏗️ ساختمان‌ها",p.buildings,true)+section("🛡️ اردوگاه نظامی",p.military,true)+section("⚔️ نیروهای نظامی",p.units,false)+section("⚓ ناوگان دریایی",p.fleet,false)+'<footer class="khcs-package-footer"><small>PRICE</small><strong>'+esc(p.price)+'</strong></footer></article>').join("")+'</div>';
  }
  function init(){
    css();renderRegionTabs();setupModal();setupShop();
    characters.forEach(c=>c._image="");
    activeRegion="The North";
    render(activeRegion);
    characters.forEach(async c=>{
      const image=await loadImage(c.image);
      c._image=image;
      if(c.region===activeRegion) render(activeRegion);
    });
  }
  let activeRegion="The North";
  document.addEventListener("click",e=>{
    const r=e.target.closest("[data-khcs-region]");
    if(r){
      activeRegion=r.dataset.khcsRegion;
      render(activeRegion);
      document.querySelectorAll("[data-khcs-region]").forEach(b=>b.classList.toggle("active",b.dataset.khcsRegion===activeRegion));
    }
    const c=e.target.closest("[data-khcs-character]");if(c)window.khataOpenCharacter(c.dataset.khcsCharacter);
    const s=e.target.closest("[data-khcs-shop]");if(s)openShop(s.dataset.khcsShop);\n    const pm=e.target.closest("[data-khcs-pack-mode]");if(pm)renderPacks(pm.dataset.khcsPackMode);
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();