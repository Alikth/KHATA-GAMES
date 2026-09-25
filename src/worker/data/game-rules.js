// Static game rules and economy configuration used by the Worker backend.
// This module contains no request/response or database logic.

export const GENERAL_PRODUCTIONS = {
  farm:{label:"🌾 مزرعه",max:50,cost:{coins:500,wood:100,stone:20,peasants:20},base:"grain",yield:500},
  lumber:{label:"🪵 چوب‌بری",max:50,cost:{coins:400,stone:25,peasants:20},base:"wood",yield:300},
  stone:{label:"🪨 معدن سنگ",max:50,cost:{coins:200,wood:100,peasants:20},base:"stone",yield:50},
  iron:{label:"⛓ معدن آهن",max:50,cost:{coins:200,wood:100,stone:25,peasants:20},base:"iron",yield:100},
  recreation:{label:"🕹 مرکز تفریحی",max:50,cost:{coins:500,wood:100,stone:25,peasants:25},base:"coins",yield:500},
  village:{label:"🏘 دهکده",max:50,cost:{coins:200,wood:100,stone:25,peasants:20},base:"peasants",yield:50},
  market:{label:"🛒 بازارچه",max:50,cost:{coins:1000,wood:200,stone:50,peasants:20},base:"coins",yield:800},
  stable:{label:"🐎 اصطبل",max:50,cost:{coins:200,wood:150,stone:25,peasants:20},base:"horses",yield:20},
  slaughterhouse:{label:"🥩 کشتارگاه",max:50,cost:{coins:300,wood:100,stone:20,peasants:20},base:"meat",yield:100}
};
export const SPECIAL_PRODUCTIONS = {
  Riverlands:{key:"fishery",label:"🐟 شیلات",max:20,cost:{coins:250,wood:150,peasants:15},base:"fish",yield:250},
  Westerlands:{key:"gold_mine",label:"🦁 معدن طلا",max:20,cost:{wood:300,iron:150,peasants:20},base:"coins",yield:2500},
  Crownlands:{key:"dragon_glass",label:"🐉 تولید شیشه اژدها",max:20,cost:{coins:1200,peasants:20,wood:70,iron:25},base:"dragon_glass",yield:50},
  Stormlands:{key:"tar",label:"🛢 تولید قیر",max:20,cost:{coins:200,wood:100,stone:250,peasants:20},base:"tar",yield:5},
  Dorne:{key:"vineyard",label:"🍇 تاکستان",max:20,cost:{coins:250,wood:100,peasants:20},base:"grapes",yield:300}
};
export const REGION_MULTIPLIERS = {
  "The Wall":{lumber:2},"North":{lumber:2},"Vale":{stone:2},"Iron Islands":{iron:2},"Reach":{farm:2},
  "Free Folk":{slaughterhouse:2}
};
export const GENERAL_CAMPS = {
  swordsman:{label:"🗡 کمپ شمشیرزن",max:20,unit:"swordsman",cost:{coins:300,wood:100,iron:25,peasants:100},yield:100},
  archer:{label:"🏹 کمپ کماندار",max:20,unit:"archer",cost:{coins:300,wood:100,iron:25,peasants:100},yield:100},
  spearman:{label:"🔱 کمپ نیزه‌دار",max:20,unit:"spearman",cost:{coins:300,wood:100,iron:25,peasants:100},yield:100},
  cavalry:{label:"🏇 کمپ سواره‌نظام",max:20,unit:"cavalry",cost:{coins:350,wood:150,iron:25,peasants:50,horses:50},yield:100}
};
export const SPECIAL_CAMPS = {
  "The Wall":[{key:"ranger",label:"🥷 کمپ رنجر",cost:{wood:200,iron:20,peasants:50},max:20,unit:"ranger",yield:50}],
  "North":[{key:"winter_soldier",label:"🐺 کمپ سرباز زمستان",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"winter_soldier",yield:50}],
  "Riverlands":[
    {key:"vale_knight",label:"😀 کمپ شوالیه ویل",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"vale_knight",yield:50},
    {key:"crossbowman",label:"🏹 کمپ کراسبو‌دار",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"crossbowman",yield:50}
  ],
  "Westerlands":[{key:"red_cloak",label:"🩸 کمپ ردا سرخ",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"red_cloak",yield:50}],
  "Crownlands":[{key:"dragon_knight",label:"🐉 کمپ شوالیه اژدها",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"dragon_knight",yield:50}],
  "Iron Islands":[{key:"axeman",label:"🪓 کمپ تبر‌دار",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"axeman",yield:50}],
  "Reach":[{key:"flower_knight",label:"🏵 شوالیه گل",cost:{coins:300,wood:200,iron:20,peasants:50},max:20,unit:"flower_knight",yield:50}],
  "Stormlands":[{key:"hammer_wielder",label:"🔨 پتک‌دار",cost:{coins:300,wood:200,iron:30,peasants:50},max:20,unit:"hammer_wielder",yield:50}],
  "Dorne":[{key:"dornish_spearman",label:"🔱 نیزه‌دار دورنیش",cost:{coins:300,wood:200,iron:10,peasants:50},max:20,unit:"dornish_spearman",yield:50}]
};
export const EQUIPMENT = {
  ladder:{label:"🪜 نردبان",level:1,cost:{wood:70},limit:10,period:"day"},
  ram:{label:"🔩 دژکوب",level:2,cost:{wood:500,iron:50},limit:3,period:"day"},
  catapult:{label:"☄ منجنیق",level:3,cost:{wood:700,stone:75},limit:3,period:"day"},
  scorpion:{label:"🦂 اسکورپین",level:4,cost:{wood:1200,iron:90},limit:1,period:"day"},
  siege_tower:{label:"🏗 برج محاصره",level:5,cost:{wood:1500,stone:120,iron:120},limit:2,period:"week"}
};
export const EQUIPMENT_UPGRADE_COST = 6000;
export const RESOURCE_KEYS = ["peasants","coins","wood","stone","iron","meat","fish","grain","horses","dragon_glass","wildfire","tar","grapes"];
export const RESOURCE_LABELS = {peasants:"👥 رعیت",coins:"💰 سکه",wood:"🪵 چوب",stone:"🪨 سنگ",iron:"⛓ آهن",meat:"🥩 گوشت",fish:"🐟 ماهی",grain:"🌾 غلات",horses:"🐎 اسب",dragon_glass:"🌑 شیشه اژدها",wildfire:"🧪 وایلدفایر",tar:"🛢 قیر",grapes:"🍇 انگور"};
export const WAR_LORDS = {
  "Castle Black":"Jon Snow","Eastwatch":"Eddison Tollett","Shadow Tower":"Alliser Thorne",
  "Winterfell":"Sam Stark","The Dreadfort":"Roderick Bolton","Karhold":"Edrik Karstark",
  "Riverrun":"Elyas Tully","The Twins":"Elyas Tully","Seagard":"Harwyn Mallister",
  "The Eyrie":"Elyon Arryn","Gulltown":"Marq Grafton","Redfort":"Alric Redfort",
  "Pyke":"Euron Greyjoy","Ten Towers":"Maron Harlaw","Hammerhorn":"Gorold Goodbrother",
  "Casterly Rock":"Damon Lannister","Hornvale":"Tytos Brax","Ashemark":"Addam Marbrand",
  "King's Landing":"","Dragonstone":"Vaeron Targaryen","Sharp Point":"Lucan Bar Emmon",
  "Storm's End":"Stannis Baratheon","Fellwood":"Ronnel Fell","Blackhaven":"Beric Dondarrion",
  "Highgarden":"Mace Tyrell","Horn Hill":"Randyll Tarly","Oldtown":"Leyton Hightower",
  "Sunspear":"Doran Martell","Kingsgrave":"Nymeria Manwoody","Yronwood":"Anders Yronwood"
};
