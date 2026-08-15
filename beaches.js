const beaches=[
{name:'Централен плаж Бургас',lat:42.4965,lng:27.4820,flag:'green',score:92,waves:'0.3 m',water:'25.4°C',wind:'9 km/h',coordinateStatus:'needs_review',coordinateSource:'legacy prototype',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Хармани, Созопол',lat:42.41378,lng:27.70020,flag:'yellow',score:78,waves:'0.7 m',water:'25.1°C',wind:'18 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Слънчев бряг',lat:42.6931,lng:27.7142,flag:'red',score:41,waves:'1.4 m',water:'24.9°C',wind:'31 km/h',coordinateStatus:'needs_review',coordinateSource:'legacy prototype',lifeguard:{status:'unknown',posts:[],note:'Точната централна точка на плажната ивица още се проверява.'}},
{name:'Златни пясъци',lat:43.283909,lng:28.045143,flag:'green',score:88,waves:'0.4 m',water:'24.8°C',wind:'11 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg / open geographic data',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Кранево',lat:43.339966,lng:28.069176,flag:'green',score:86,waves:'0.4 m',water:'24.7°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Албена',lat:43.371841,lng:28.087933,flag:'green',score:90,waves:'0.3 m',water:'24.6°C',wind:'9 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Балчик Централен',lat:43.403900,lng:28.169489,flag:'yellow',score:75,waves:'0.6 m',water:'24.5°C',wind:'16 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Каварна',lat:43.4147,lng:28.3477,flag:'yellow',score:73,waves:'0.7 m',water:'24.3°C',wind:'18 km/h',coordinateStatus:'needs_review',coordinateSource:'legacy prototype',lifeguard:{status:'unknown',posts:[],note:'Плажната точка около Каварна още се уточнява.'}},
{name:'Варна Централен',lat:43.2056,lng:27.9242,flag:'green',score:87,waves:'0.4 m',water:'25.0°C',wind:'12 km/h',coordinateStatus:'needs_review',coordinateSource:'legacy prototype',lifeguard:{status:'unknown',posts:[],note:'Централната плажна точка във Варна още се проверява.'}},
{name:'Поморие Централен',lat:42.5606,lng:27.6465,flag:'green',score:85,waves:'0.4 m',water:'25.2°C',wind:'13 km/h',coordinateStatus:'needs_review',coordinateSource:'legacy prototype',lifeguard:{status:'unknown',posts:[],note:'Централната плажна точка в Поморие още се проверява.'}},
{name:'Несебър Южен плаж',lat:42.653866,lng:27.714540,flag:'yellow',score:77,waves:'0.6 m',water:'25.0°C',wind:'17 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Приморско Северен',lat:42.281223,lng:27.754110,flag:'green',score:89,waves:'0.4 m',water:'25.3°C',wind:'11 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Китен Атлиман',lat:42.24047,lng:27.76949,flag:'green',score:91,waves:'0.3 m',water:'25.4°C',wind:'9 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026 / OpenStreetMap-derived reference',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Лозенец Централен',lat:42.21271,lng:27.80364,flag:'yellow',score:79,waves:'0.6 m',water:'25.2°C',wind:'16 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Царево Централен',lat:42.173176,lng:27.850792,flag:'green',score:84,waves:'0.4 m',water:'25.1°C',wind:'12 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}},
{name:'Ахтопол Централен',lat:42.0976,lng:27.9430,flag:'yellow',score:76,waves:'0.7 m',water:'25.0°C',wind:'18 km/h',coordinateStatus:'needs_review',coordinateSource:'legacy prototype',lifeguard:{status:'unknown',posts:[],note:'Точната плажна точка в Ахтопол още се проверява.'}},
{name:'Синеморец Бутамята',lat:42.054596,lng:27.986870,flag:'green',score:93,waves:'0.4 m',water:'24.9°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'kilometri.bg / current beach references',lifeguard:{status:'unknown',posts:[],note:'Точните постове още не са потвърдени.'}}
,
{name:'Крапец',lat:43.64334,lng:28.57381,flag:'green',score:82,waves:'0.3 m',water:'23.8°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Спасителната информация още се проверява.'}},
{name:'Камчия',lat:43.03226,lng:27.88811,flag:'green',score:80,waves:'0.3 m',water:'24.3°C',wind:'11 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Спасителната информация още се проверява.'}},
{name:'Крайморие',lat:42.44576,lng:27.49168,flag:'green',score:84,waves:'0.3 m',water:'25.4°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Спасителната информация още се проверява.'}},
{name:'Росенец',lat:42.44543,lng:27.57321,flag:'green',score:81,waves:'0.3 m',water:'25.4°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Спасителната информация още се проверява.'}},
{name:'Градина',lat:42.41934,lng:27.64684,flag:'green',score:88,waves:'0.4 m',water:'25.4°C',wind:'11 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'Созопол Централен',lat:42.42274,lng:27.69508,flag:'green',score:87,waves:'0.4 m',water:'24.9°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Точните постове още се проверяват.'}},
{name:'Каваците',lat:42.39600,lng:27.70660,flag:'green',score:90,waves:'0.4 m',water:'25.1°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'Смокиня',lat:42.38797,lng:27.70660,flag:'green',score:89,waves:'0.4 m',water:'25.1°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'ММЦ',lat:42.25185,lng:27.75164,flag:'green',score:86,waves:'0.5 m',water:'25.1°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'Караагач',lat:42.22758,lng:27.77670,flag:'green',score:84,waves:'0.5 m',water:'25.1°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'Гардения',lat:42.22337,lng:27.78264,flag:'green',score:83,waves:'0.5 m',water:'25.1°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Спасителната информация още се проверява.'}},
{name:'Корал',lat:42.21630,lng:27.79090,flag:'yellow',score:74,waves:'0.5 m',water:'25.1°C',wind:'12 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unguarded',posts:[],note:'Част от плажа е неохраняема; официалният статут се пази отделно в каталога.'}},
{name:'Оазис',lat:42.20018,lng:27.81924,flag:'green',score:88,waves:'0.5 m',water:'24.9°C',wind:'11 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'Варвара',lat:42.12773,lng:27.90747,flag:'green',score:82,waves:'0.5 m',water:'24.9°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Спасителната информация още се проверява.'}},
{name:'Варвара - север',lat:42.12871,lng:27.90422,flag:'yellow',score:76,waves:'0.5 m',water:'24.9°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unguarded',posts:[],note:'Див/неохраняем участък според текущия каталог.'}},
{name:'Делфин',lat:42.10679,lng:27.91939,flag:'green',score:85,waves:'0.5 m',water:'24.8°C',wind:'10 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'guarded',posts:[],note:'Източникът посочва охраняем плаж; точните GPS позиции на постовете още се проверяват.'}},
{name:'Силистар',lat:42.02179,lng:28.00980,flag:'green',score:92,waves:'0.7 m',water:'24.7°C',wind:'9 km/h',coordinateStatus:'verified',coordinateSource:'plajovete.com 2026',lifeguard:{status:'unknown',posts:[],note:'Точните постове още се проверяват.'}}];

const officialUnguarded2026=[
{region:'Добрич',municipality:'Шабла',name:'Дуранкулак - север 1'},
{region:'Добрич',municipality:'Шабла',name:'Дуранкулак - север 2'},
{region:'Добрич',municipality:'Шабла',name:'Космос'},
{region:'Добрич',municipality:'Шабла',name:'Дуранкулак - езеро'},
{region:'Добрич',municipality:'Шабла',name:'Крапец-север - част'},
{region:'Добрич',municipality:'Шабла',name:'Крапец-централен'},
{region:'Добрич',municipality:'Шабла',name:'Крапец - юг'},
{region:'Добрич',municipality:'Шабла',name:'Шабла'},
{region:'Добрич',municipality:'Шабла',name:'Добруджа - север 1 и Добруджа - север 2'},
{region:'Добрич',municipality:'Шабла',name:'Добруджа - юг - част'},
{region:'Добрич',municipality:'Каварна',name:'Русалка (комплекс от плажове)'},
{region:'Добрич',municipality:'Каварна',name:'Тауклиман'},
{region:'Добрич',municipality:'Каварна',name:'Болата'},
{region:'Добрич',municipality:'Балчик',name:'Тузлата'},
{region:'Добрич',municipality:'Балчик',name:'Сребристият бряг'},
{region:'Добрич',municipality:'Балчик',name:'Робинзон 2'},
{region:'Добрич',municipality:'Балчик',name:'Фиш - фиш - нов'},

{region:'Варна',municipality:'Варна',name:'Чайка - централен 2'},
{region:'Варна',municipality:'Варна',name:'Чайка - централен 1'},
{region:'Варна',municipality:'Варна',name:'Чайка - юг'},
{region:'Варна',municipality:'Варна',name:'Минерален басейн - юг'},
{region:'Варна',municipality:'Варна',name:'Евксиноград 1'},
{region:'Варна',municipality:'Варна',name:'Евксиноград 2'},
{region:'Варна',municipality:'Варна',name:'Евксиноград 3'},
{region:'Варна',municipality:'Варна',name:'Офицерски'},
{region:'Варна',municipality:'Варна',name:'Галата - север'},
{region:'Варна',municipality:'Варна',name:'Галата - изток'},
{region:'Варна',municipality:'Варна',name:'Фичоза - север'},
{region:'Варна',municipality:'Варна',name:'Фичоза'},
{region:'Варна',municipality:'Варна',name:'Фичоза - юг'},
{region:'Варна',municipality:'Варна',name:'Хижа Черноморец - север'},
{region:'Варна',municipality:'Варна',name:'Паша дере'},
{region:'Варна',municipality:'Аврен',name:'Романтика'},
{region:'Варна',municipality:'Аврен',name:'Камчия - север 1, 2, 4 и 5'},
{region:'Варна',municipality:'Долни Чифлик',name:'Камчия-юг'},
{region:'Варна',municipality:'Долни Чифлик',name:'Изгрев - Хоризонт'},
{region:'Варна',municipality:'Долни Чифлик',name:'Шкорпиловци - север'},
{region:'Варна',municipality:'Бяла',name:'Бяла - север'},
{region:'Варна',municipality:'Бяла',name:'Бяла - централен I'},
{region:'Варна',municipality:'Бяла',name:'Бяла - централен III'},
{region:'Варна',municipality:'Бяла',name:'Бяла - централен IV'},
{region:'Варна',municipality:'Бяла',name:'Бяла - Чайка, в т.ч. Бяла - Чайка 1'},

{region:'Бургас',municipality:'Несебър',name:'Смриките'},
{region:'Бургас',municipality:'Несебър',name:'Емона - юг'},
{region:'Бургас',municipality:'Несебър',name:'Емона - Бунарджика'},
{region:'Бургас',municipality:'Несебър',name:'Елените - изток 1 и 2'},
{region:'Бургас',municipality:'Несебър',name:'Елените 1 и 2'},
{region:'Бургас',municipality:'Несебър',name:'Козлука'},
{region:'Бургас',municipality:'Несебър',name:'Робинзон-запад 2'},
{region:'Бургас',municipality:'Несебър',name:'Несебър- изток'},
{region:'Бургас',municipality:'Поморие',name:'Ахелой -север'},
{region:'Бургас',municipality:'Поморие',name:'Къмпинг Ахелой - без част 3'},
{region:'Бургас',municipality:'Поморие',name:'Поморийска коса'},
{region:'Бургас',municipality:'Поморие',name:'Поморие Буната'},
{region:'Бургас',municipality:'Поморие',name:'Къмпинг Европа'},
{region:'Бургас',municipality:'Поморие',name:'Лахана 1'},
{region:'Бургас',municipality:'Бургас',name:'Сарафово - север'},
{region:'Бургас',municipality:'Бургас',name:'Атанасовска коса - част 2'},
{region:'Бургас',municipality:'Бургас',name:'Крайморие - север 1'},
{region:'Бургас',municipality:'Бургас',name:'Крайморие - север 2'},
{region:'Бургас',municipality:'Бургас',name:'Крайморие - север 3'},
{region:'Бургас',municipality:'Бургас',name:'Крайморие - юг 1 и 2'},
{region:'Бургас',municipality:'Бургас',name:'Росенец'},
{region:'Бургас',municipality:'Бургас',name:'Отманли'},
{region:'Бургас',municipality:'Бургас',name:'Росенец - запад'},
{region:'Бургас',municipality:'Бургас',name:'Росенец - централен'},
{region:'Бургас',municipality:'Бургас',name:'Росенец - изток'},
{region:'Бургас',municipality:'Созопол',name:'Вромос'},
{region:'Бургас',municipality:'Созопол',name:'Алепу'},
{region:'Бургас',municipality:'Приморско',name:'Аркутино лилии'},
{region:'Бургас',municipality:'Приморско',name:'Ропотамо'},
{region:'Бургас',municipality:'Царево',name:'Лозенец-юг'},
{region:'Бургас',municipality:'Царево',name:'Малък оазис 1, 2, 3 и 4'},
{region:'Бургас',municipality:'Царево',name:'Малък оазис зона 1,2,4 - централен-изток'},
{region:'Бургас',municipality:'Царево',name:'Царево - север 1, 2 и 3'},
{region:'Бургас',municipality:'Царево',name:'Попски плаж - север 1, 2, 3, 4 и 5'},
{region:'Бургас',municipality:'Царево',name:'Царево - централен'},
{region:'Бургас',municipality:'Царево',name:'Царево - Василико'},
{region:'Бургас',municipality:'Царево',name:'Скалите'},
{region:'Бургас',municipality:'Царево',name:'Лафина - север 1'},
{region:'Бургас',municipality:'Царево',name:'Манастирич'},
{region:'Бургас',municipality:'Царево',name:'Варвара север'},
{region:'Бургас',municipality:'Царево',name:'Ахтопол - фара'},
{region:'Бургас',municipality:'Царево',name:'Ахтопол - север - западна зона'},
{region:'Бургас',municipality:'Царево',name:'Айроди - север'},
{region:'Бургас',municipality:'Царево',name:'Айроди - юг'},
{region:'Бургас',municipality:'Царево',name:'Липите'},
{region:'Бургас',municipality:'Царево',name:'Листи'},
{region:'Бургас',municipality:'Царево',name:'Силистар-север'},
{region:'Бургас',municipality:'Царево',name:'Резово - кастрич'},
{region:'Бургас',municipality:'Царево',name:'Резово'}
];

const natureTourismBeaches2026=[
{name:'Бяла - Карадере',municipality:'Бяла',region:'Варна'},
{name:'Иракли',municipality:'Несебър',region:'Бургас'},
{name:'Корал',municipality:'Царево',region:'Бургас'}
];

// 2026 examples where Burgas regional administration procured partial lifeguard coverage.
// Exact post coordinates are intentionally NOT invented.
const partialLifeguardCoverage2026={
  'Иракли':{jul:2,aug:2,sep:1,note:'Частично обезпечаване; през септември се закрива пост №2.'},
  'Несебър- изток':{jul:2,aug:2,sep:1,note:'Частично обезпечаване; през септември се закрива пост №1.'},
  'Поморийска коса':{jul:2,aug:2,sep:1,note:'Частично обезпечаване; през септември се закрива пост №1.'},
  'Крайморие - север 1':{jul:2,aug:2,sep:1,note:'Частично обезпечаване; през септември се закрива пост №1.'},
  'Алепу':{jul:2,aug:2,sep:1,note:'Частично обезпечаване; през септември се закрива пост №2.'},
  'Резово':{jul:1,aug:1,sep:1,note:'Частично обезпечаване през юли–септември.'}
};


// VERIFIED OFFICIAL LIFEGUARD POSTS
// Source: Областна администрация Бургас, "Схеми плажове 2020".
// Original coordinates are BGS2005 / CCS2005 (EPSG:7801); lat/lng below are WGS84 conversions.
// We keep source metadata because physical post positions can change between seasons.
const officialLifeguardPosts=[
  {beach:'Иракли',post:1,lat:42.7459772,lng:27.8900105,sourceYear:2020,sourceType:'official_scheme',verified:true},
  {beach:'Иракли',post:2,lat:42.7408757,lng:27.8913621,sourceYear:2020,sourceType:'official_scheme',verified:true},

  {beach:'Несебър - изток',post:1,lat:42.6563803,lng:27.7328875,sourceYear:2020,sourceType:'official_scheme',verified:true},

  {beach:'Поморийска коса',post:1,lat:42.5835446,lng:27.6325721,sourceYear:2020,sourceType:'official_scheme',verified:true},
  {beach:'Поморийска коса',post:2,lat:42.5808696,lng:27.6328848,sourceYear:2020,sourceType:'official_scheme',verified:true},

  {beach:'Атанасовска коса',post:1,lat:42.5276076,lng:27.4903875,sourceYear:2020,sourceType:'official_scheme',verified:true},
  {beach:'Атанасовска коса',post:2,lat:42.5196642,lng:27.4871377,sourceYear:2020,sourceType:'official_scheme',verified:true},

  {beach:'Крайморие - юг 2',post:1,lat:42.4404921,lng:27.5022586,sourceYear:2020,sourceType:'official_scheme',verified:true},
  {beach:'Крайморие - юг 2',post:2,lat:42.4389538,lng:27.5052856,sourceYear:2020,sourceType:'official_scheme',verified:true},

  {beach:'Алепу',post:1,lat:42.3650353,lng:27.7102010,sourceYear:2020,sourceType:'official_scheme',verified:true},
  {beach:'Алепу',post:2,lat:42.3560023,lng:27.7165006,sourceYear:2020,sourceType:'official_scheme',verified:true},

  {beach:'Корал',post:1,lat:42.2172663,lng:27.7897216,sourceYear:2020,sourceType:'official_scheme',verified:true},
  {beach:'Корал',post:2,lat:42.2154154,lng:27.7926317,sourceYear:2020,sourceType:'official_scheme',verified:true}
];

// For official 2026 "unguarded" status we only plot a warning when we have a trustworthy mapped anchor.
// Several have partial seasonal lifeguard provision despite their official unguarded status.
const officialUnguardedAnchors=[
  {name:'Иракли',lat:42.7434,lng:27.8907,partialCoverage:true},
  {name:'Несебър - изток',lat:42.65638,lng:27.73289,partialCoverage:true},
  {name:'Поморийска коса',lat:42.5822,lng:27.6327,partialCoverage:true},
  {name:'Атанасовска коса - част 2',lat:42.5236,lng:27.4888,partialCoverage:false},
  {name:'Крайморие - юг 2',lat:42.4397,lng:27.5038,partialCoverage:false},
  {name:'Алепу',lat:42.3605,lng:27.7134,partialCoverage:true},
  {name:'Корал',lat:42.2163,lng:27.7912,partialCoverage:false}
];
