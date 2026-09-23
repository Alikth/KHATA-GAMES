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
    { house: "Night's Watch", castle: "Castle Black", icon: "🌟🏰" },
    { house: "Night's Watch", castle: "Eastwatch", icon: "⚓" },
    { house: "Night's Watch", castle: "Shadow Tower", icon: "🏰" }
  ]},
  { region: "North", icon: "🐺", castles: [
    { house: "Stark", castle: "Winterfell", icon: "🌟🔱" },
    { house: "Bolton", castle: "The Dreadfort", icon: "🏯" },
    { house: "Karstark", castle: "Karhold", icon: "⚓" }
  ]},
  { region: "Riverlands", icon: "🌊", castles: [
    { house: "Tully", castle: "Riverrun", icon: "🌟🔱" },
    { house: "Frey", castle: "The Twins", icon: "🏯" },
    { house: "Mallister", castle: "Seagard", icon: "⚓" }
  ]},
  { region: "Vale", icon: "⛰️", castles: [
    { house: "Arryn", castle: "The Eyrie", icon: "🌟🔱" },
    { house: "Grafton", castle: "Gulltown", icon: "⚓" },
    { house: "Redfort", castle: "Redfort", icon: "🏯" }
  ]},
  { region: "Iron Islands", icon: "⚒️", castles: [
    { house: "Greyjoy", castle: "Pyke", icon: "🌟🔱⚓" },
    { house: "Harlaw", castle: "Ten Towers", icon: "⚓" },
    { house: "Goodbrother", castle: "Hammerhorn", icon: "⚓" }
  ]},
  { region: "Westerlands", icon: "🦁", castles: [
    { house: "Lannister", castle: "Casterly Rock", icon: "🌟🔱⚓" },
    { house: "Brax", castle: "Hornvale", icon: "🏯" },
    { house: "Marbrand", castle: "Ashemark", icon: "🏯" }
  ]},
  { region: "Crownlands", icon: "🐉", castles: [
    { house: "Crownlands", castle: "King's Landing", icon: "🌟👑" },
    { house: "Targaryen", castle: "Dragonstone", icon: "⚓" },
    { house: "Bar Emmon", castle: "Sharp Point", icon: "🏯" }
  ]},
  { region: "Stormlands", icon: "🦌", castles: [
    { house: "Baratheon", castle: "Storm's End", icon: "🌟🔱⚓" },
    { house: "Fell", castle: "Fellwood", icon: "🏯" },
    { house: "Dondarrion", castle: "Blackhaven", icon: "🏯" }
  ]},
  { region: "Reach", icon: "🏵️", castles: [
    { house: "Tyrell", castle: "Highgarden", icon: "🌟🔱" },
    { house: "Tarly", castle: "Horn Hill", icon: "🏯" },
    { house: "Hightower", castle: "Oldtown", icon: "⚓" }
  ]},
  { region: "Dorne", icon: "☀️", castles: [
    { house: "Martell", castle: "Sunspear", icon: "🌟🔱⚓" },
    { house: "Manwoody", castle: "Kingsgrave", icon: "🏯" },
    { house: "Yronwood", castle: "Yronwood", icon: "⚓" }
  ]}
];
