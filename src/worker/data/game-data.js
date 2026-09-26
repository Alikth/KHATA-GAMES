// Static game data and rules used by the Worker backend.
// This module contains no request/response or database logic.

export const castleInfo = {
  "Castle Black": { location: "The Wall", description: "دژ اصلی نگهبانان شب در دیوار؛ یکی از مهم‌ترین پایگاه‌های دفاعی شمال و محل فرماندهی Lord Commander." },
  "Eastwatch": { location: "ساحل شرقی دیوار", description: "قلعه‌ای ساحلی در انتهای شرقی دیوار که بر مسیرهای دریایی و دفاع از بخش شرقی دیوار نظارت دارد." },
  "Shadow Tower": { location: "بخش غربی دیوار", description: "یکی از قلعه‌های اصلی Night's Watch در امتداد دیوار، در ناحیه غربی Castle Black." },
  "Winterfell": { location: "North، مرکز سرزمین‌های شمالی", description: "قلعه باستانی خاندان Stark و مرکز سیاسی و نظامی North؛ در میان سرزمین‌های شمالی و بر مسیرهای مهم آن قرار دارد." },
  "The Dreadfort": { location: "شرق North", description: "دژ تاریخی خاندان Bolton در شمال؛ قلعه‌ای سنگی و مستحکم که در سرزمین‌های Bolton قرار دارد." },
  "Karhold": { location: "شمال شرقی North", description: "دژ خاندان Karstark در شمال شرقی؛ یکی از پایگاه‌های مهم خاندان‌های شمالی." },
  "Riverrun": { location: "Riverlands، محل تلاقی Red Fork و Tumblestone", description: "دژ اصلی خاندان Tully و قلعه‌ای آبیاری‌شده در محل پیوند رودها؛ موقعیت آن برای دفاع و کنترل Riverlands اهمیت زیادی دارد." },
  "The Twins": { location: "Riverlands، گذرگاه Green Fork", description: "دو قلعه خاندان Frey در دو سوی Green Fork که پل بزرگ میان آن‌ها یکی از مهم‌ترین گذرگاه‌های Riverlands است." },
  "Seagard": { location: "ساحل غربی Riverlands", description: "دژ ساحلی خاندان Mallister که برای دفاع از Riverlands در برابر حملات دریایی Ironborn اهمیت دارد." },
  "The Eyrie": { location: "کوه‌های Moon، Vale", description: "قلعه مرتفع خاندان Arryn بر فراز Mountains of the Moon؛ دسترسی به آن دشوار و موقعیت دفاعی آن بسیار قدرتمند است." },
  "Gulltown": { location: "ساحل شرقی Vale", description: "بزرگ‌ترین شهر و بندر Vale و یکی از مهم‌ترین مراکز تجاری این منطقه؛ تحت نفوذ خاندان Grafton." },
  "Redfort": { location: "Vale، جنوب The Eyrie", description: "قلعه خاندان Redfort در Vale که در مسیرهای داخلی منطقه قرار دارد و از دژهای شناخته‌شده این قلمرو است." },
  "Pyke": { location: "جزایر Iron Islands، جزیره Pyke", description: "دژ و مقر خاندان Greyjoy؛ قلعه‌ای دریایی که بر صخره‌های جزیره Pyke ساخته شده و با پل‌ها و برج‌های سنگی به هم پیوند خورده است." },
  "Ten Towers": { location: "جزیره Harlaw، Iron Islands", description: "دژ خاندان Harlaw و یکی از استحکامات مهم جزیره Harlaw در Iron Islands." },
  "Hammerhorn": { location: "جزیره Great Wyk، Iron Islands", description: "دژ خاندان Goodbrother در Great Wyk و یکی از مراکز مهم قدرت این خاندان در Iron Islands." },
  "Casterly Rock": { location: "ساحل غربی Westerlands", description: "دژ باستانی خاندان Lannister که در دل یک توده عظیم سنگی قرار دارد؛ از ثروتمندترین و استراتژیک‌ترین دژهای Westeros." },
  "Hornvale": { location: "Westerlands", description: "مقر خاندان Brax در Westerlands؛ قلعه‌ای مهم در شبکه دژهای اشرافی این منطقه." },
  "Ashemark": { location: "Westerlands، شرق Casterly Rock", description: "دژ خاندان Marbrand در Westerlands که بر سرزمین‌های اطراف و مسیرهای داخلی منطقه نظارت دارد." },
  "King's Landing": { location: "ساحل شرقی Westeros، Crownlands، دهانه Blackwater Rush", description: "پایتخت هفت پادشاهی و بزرگ‌ترین شهر Westeros؛ بر تپه‌های اطراف Blackwater ساخته شده و مرکز قدرت سیاسی تاج‌وتخت است." },
  "Dragonstone": { location: "جزیره Dragonstone، ورودی Blackwater Bay", description: "قلعه آتشفشانی خاندان Targaryen بر جزیره Dragonstone؛ موقعیتی استراتژیک برای کنترل ورودی Blackwater Bay دارد." },
  "Sharp Point": { location: "ساحل شرقی Crownlands", description: "دژ خاندان Bar Emmon در ساحل Crownlands، نزدیک مسیرهای دریایی Blackwater Bay." },
  "Storm's End": { location: "ساحل شرقی Stormlands", description: "دژ افسانه‌ای خاندان Baratheon با دیوارهای عظیم و مقاوم در برابر طوفان؛ یکی از مستحکم‌ترین قلعه‌های Westeros." },
  "Fellwood": { location: "Stormlands", description: "مرکز خاندان Fell در Stormlands و یکی از املاک شناخته‌شده این خاندان در منطقه." },
  "Blackhaven": { location: "مرز شمالی Dorne و جنوب Stormlands", description: "دژ خاندان Dondarrion در مرزهای Stormlands؛ موقعیتی مهم برای کنترل مسیرهای زمینی جنوب." },
  "Highgarden": { location: "مرکز Reach، کنار Mander", description: "مقر خاندان Tyrell و مرکز سیاسی Reach؛ در میان زمین‌های حاصلخیز و مسیرهای مهم رود Mander قرار دارد." },
  "Horn Hill": { location: "Reach، جنوب Highgarden", description: "مقر خاندان Tarly در Reach؛ دژی شناخته‌شده در منطقه و خانه یکی از خاندان‌های نظامی قدرتمند جنوب." },
  "Oldtown": { location: "جنوب‌غربی Reach، دهانه Honeywine", description: "یکی از قدیمی‌ترین و بزرگ‌ترین شهرهای Westeros؛ مرکز خاندان Hightower و محل Citadel، با بندری مهم در جنوب‌غربی قاره." },
  "Sunspear": { location: "ساحل شرقی Dorne", description: "مقر خاندان Martell و مرکز سیاسی Dorne؛ شهری ساحلی که بر سرزمین‌های جنوب شرقی Dorne مشرف است." },
  "Kingsgrave": { location: "Dorne", description: "مقر خاندان Manwoody در Dorne و یکی از دژهای مهم خاندان‌های نجیب این منطقه." },
  "Yronwood": { location: "Dorne، شمال‌غربی Dorne", description: "مقر خاندان Yronwood و یکی از بزرگ‌ترین دژهای Dorne؛ بر مسیرهای مهم شمال‌غربی منطقه قرار دارد." }
};

export const houses = [
  { region: "The Wall", icon: "🌓", castles: [
    { house: "Night's Watch", flag: "https://awoiaf.westeros.org/images/8/8b/Night%27s_Watch.svg", castle: "Castle Black", icon: "🌟🏰" },
    { house: "Night's Watch", flag: "https://awoiaf.westeros.org/images/8/8b/Night%27s_Watch.svg", castle: "Eastwatch", icon: "⚓" },
    { house: "Night's Watch", flag: "https://awoiaf.westeros.org/images/8/8b/Night%27s_Watch.svg", castle: "Shadow Tower", icon: "🏰" }
  ]},
  { region: "North", icon: "🐺", castles: [
    { house: "Stark", flag: "https://awoiaf.westeros.org/images/d/d1/House_Stark.svg", castle: "Winterfell", icon: "🌟🔱" },
    { house: "Bolton", flag: "https://awoiaf.westeros.org/images/0/03/House_Bolton.svg", castle: "The Dreadfort", icon: "🏯" },
    { house: "Karstark", flag: "https://awoiaf.westeros.org/images/f/f5/House_Karstark.svg", castle: "Karhold", icon: "⚓" }
  ]},
  { region: "Riverlands", icon: "🌊", castles: [
    { house: "Tully", flag: "https://awoiaf.westeros.org/images/3/36/House_Tully.svg", castle: "Riverrun", icon: "🌟🔱" },
    { house: "Frey", flag: "https://awoiaf.westeros.org/images/6/66/House_Frey.svg", castle: "The Twins", icon: "🏯" },
    { house: "Mallister", flag: "https://awoiaf.westeros.org/images/d/d1/House_Mallister.svg", castle: "Seagard", icon: "⚓" }
  ]},
  { region: "Vale", icon: "⛰️", castles: [
    { house: "Arryn", flag: "https://awoiaf.westeros.org/images/6/61/House_Arryn.svg", castle: "The Eyrie", icon: "🌟🔱" },
    { house: "Grafton", flag: "https://awoiaf.westeros.org/images/d/d3/House_Grafton.svg", castle: "Gulltown", icon: "⚓" },
    { house: "Redfort", flag: "https://awoiaf.westeros.org/images/5/5f/House_Redfort.svg", castle: "Redfort", icon: "🏯" }
  ]},
  { region: "Iron Islands", icon: "⚒️", castles: [
    { house: "Greyjoy", flag: "https://awoiaf.westeros.org/images/7/7d/House_Greyjoy.svg", castle: "Pyke", icon: "🌟🔱⚓" },
    { house: "Harlaw", flag: "https://awoiaf.westeros.org/images/5/5c/House_Harlaw.svg", castle: "Ten Towers", icon: "⚓" },
    { house: "Goodbrother", flag: "https://awoiaf.westeros.org/images/8/83/House_Goodbrother.svg", castle: "Hammerhorn", icon: "⚓" }
  ]},
  { region: "Westerlands", icon: "🦁", castles: [
    { house: "Lannister", flag: "https://awoiaf.westeros.org/images/b/b2/House_Lannister.svg", castle: "Casterly Rock", icon: "🌟🔱⚓" },
    { house: "Brax", flag: "https://awoiaf.westeros.org/images/c/c4/House_Brax.svg", castle: "Hornvale", icon: "🏯" },
    { house: "Marbrand", flag: "https://awoiaf.westeros.org/images/5/54/House_Marbrand.svg", castle: "Ashemark", icon: "🏯" }
  ]},
  { region: "Crownlands", icon: "🐉", castles: [
    { house: "Crownlands", flag: "/assets/houses/crownlands.svg", castle: "King's Landing", icon: "🌟👑⚓" },
    { house: "Targaryen", flag: "https://awoiaf.westeros.org/images/3/36/House_Targaryen.svg", castle: "Dragonstone", icon: "⚓" },
    { house: "Bar Emmon", flag: "https://awoiaf.westeros.org/images/6/66/House_Bar_Emmon.svg", castle: "Sharp Point", icon: "🏯" }
  ]},
  { region: "Stormlands", icon: "🦌", castles: [
    { house: "Baratheon", flag: "https://awoiaf.westeros.org/images/8/81/House_Baratheon.svg", castle: "Storm's End", icon: "🌟🔱⚓" },
    { house: "Fell", flag: "https://awoiaf.westeros.org/images/a/a2/House_Fell.svg", castle: "Fellwood", icon: "🏯" },
    { house: "Dondarrion", flag: "https://awoiaf.westeros.org/images/5/54/House_Dondarrion.svg", castle: "Blackhaven", icon: "🏯" }
  ]},
  { region: "Reach", icon: "🏵️", castles: [
    { house: "Tyrell", flag: "https://awoiaf.westeros.org/images/f/fe/House_Tyrell.svg", castle: "Highgarden", icon: "🌟🔱" },
    { house: "Tarly", flag: "https://awoiaf.westeros.org/images/5/55/House_Tarly.svg", castle: "Horn Hill", icon: "🏯" },
    { house: "Hightower", flag: "https://awoiaf.westeros.org/images/b/b3/House_Hightower.svg", castle: "Oldtown", icon: "⚓" }
  ]},
  { region: "Dorne", icon: "☀️", castles: [
    { house: "Martell", flag: "https://awoiaf.westeros.org/images/8/8e/House_Martell.svg", castle: "Sunspear", icon: "🌟🔱⚓" },
    { house: "Manwoody", flag: "https://awoiaf.westeros.org/images/2/22/House_Manwoody.svg", castle: "Kingsgrave", icon: "🏯" },
    { house: "Yronwood", flag: "https://awoiaf.westeros.org/images/7/78/House_Yronwood.svg", castle: "Yronwood", icon: "⚓" }
  ]}
];
