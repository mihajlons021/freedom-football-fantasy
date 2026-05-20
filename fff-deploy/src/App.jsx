import{useState,useEffect,useRef,useCallback}from"react";
const TCA="DGNPSiTrX5xnKcpVKBaXUsWBZbFuA2cJcb7fUJmoAJrd";
const ESC="GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu";
const ftf=n=>n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${Math.round(n/1e3)}K`:`${Math.round(n)}`;
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const avg=p=>{const v=Object.values(p.stats);return Math.round(v.reduce((s,x)=>s+x,0)/v.length)};
const pcls=p=>p==="GK"?"gk":["CB","RB","LB"].includes(p)?"def":["CDM","CM","CAM"].includes(p)?"mid":"fwd";
let uid=1;
const mkP=(nm,pos,vM,cid,custom=false)=>({
  id:`p${uid++}`,name:nm,pos,clubId:cid,val:vM*1e6,price:Math.floor(vM*1e6/100),
  stats:(()=>{const r=clamp(Math.floor(vM*.33+62),60,93),v=d=>clamp(r+d+rnd(-3,3),40,99);
    if(pos==="GK")return{PAC:v(-18),SHO:v(-35),PAS:v(-8),DRI:v(-12),DEF:v(-5),PHY:v(2)};
    if(pos==="CB")return{PAC:v(-5),SHO:v(-20),PAS:v(-2),DRI:v(-8),DEF:v(8),PHY:v(6)};
    if(["RB","LB"].includes(pos))return{PAC:v(2),SHO:v(-15),PAS:v(3),DRI:v(0),DEF:v(5),PHY:v(3)};
    if(pos==="CDM")return{PAC:v(-5),SHO:v(-8),PAS:v(5),DRI:v(2),DEF:v(5),PHY:v(5)};
    if(pos==="CM")return{PAC:v(-2),SHO:v(-5),PAS:v(8),DRI:v(4),DEF:v(2),PHY:v(2)};
    if(pos==="CAM")return{PAC:v(2),SHO:v(5),PAS:v(6),DRI:v(8),DEF:v(-10),PHY:v(-2)};
    if(["LW","RW"].includes(pos))return{PAC:v(8),SHO:v(4),PAS:v(2),DRI:v(8),DEF:v(-18),PHY:v(-2)};
    return{PAC:v(4),SHO:v(8),PAS:v(0),DRI:v(4),DEF:v(-20),PHY:v(2)};
  })(),
  cond:rnd(80,98),morale:rnd(68,96),injured:false,injuryWeeks:0,listed:false,listPrice:0,trainings:0,age:rnd(19,34),isCustom:custom
});
const FN={GK:["Santos","Park","Volkov","Chen"],CB:["Diallo","Berg","Petrov","Reyes"],RB:["Rossi","Kim","Costa"],LB:["García","Bruno","Yilmaz"],CDM:["Ibrahim","Yang","Mensah"],CM:["Williams","Bauer","Müller"],CAM:["Lopes","Tanaka","Park"],LW:["Ndiaye","Kamara","Moro"],RW:["Gomez","Torres","Schäfer"],ST:["Adama","Silva","Kone"]};
const POS=["GK","CB","CB","RB","LB","CDM","CM","CAM","LW","RW","ST","CB","CM","ST","RB","LW","CM","CB"];
const fill=(pos,vM,cid)=>{const n=FN[pos]||FN.CM;return mkP(`${n[rnd(0,n.length-1)]} ${String.fromCharCode(65+rnd(0,25))}.`,pos,vM,cid)};

const CDEFS=[
  {id:"mci",name:"Manchester City",lg:"Premier League",abbr:"MCI",c1:"#6CABDD",c2:"#fff",pat:"solid",vM:1600},
  {id:"liv",name:"Liverpool",lg:"Premier League",abbr:"LIV",c1:"#C8102E",c2:"#FFD700",pat:"solid",vM:1400},
  {id:"ars",name:"Arsenal",lg:"Premier League",abbr:"ARS",c1:"#EF0107",c2:"#fff",pat:"solid",vM:1200},
  {id:"che",name:"Chelsea",lg:"Premier League",abbr:"CHE",c1:"#034694",c2:"#fff",pat:"solid",vM:1100},
  {id:"mun",name:"Manchester United",lg:"Premier League",abbr:"MUN",c1:"#DA291C",c2:"#FBE122",pat:"solid",vM:900},
  {id:"tot",name:"Tottenham",lg:"Premier League",abbr:"TOT",c1:"#132257",c2:"#fff",pat:"solid",vM:800},
  {id:"new",name:"Newcastle United",lg:"Premier League",abbr:"NEW",c1:"#241F20",c2:"#fff",pat:"vstrip",vM:800},
  {id:"avl",name:"Aston Villa",lg:"Premier League",abbr:"AVL",c1:"#670E36",c2:"#95BFE5",pat:"solid",vM:700},
  {id:"whu",name:"West Ham United",lg:"Premier League",abbr:"WHU",c1:"#7A263A",c2:"#1BB1E7",pat:"solid",vM:500},
  {id:"bha",name:"Brighton & HA",lg:"Premier League",abbr:"BHA",c1:"#0057B8",c2:"#fff",pat:"vstrip",vM:500},
  {id:"ful",name:"Fulham",lg:"Premier League",abbr:"FUL",c1:"#CC0000",c2:"#fff",pat:"solid",vM:400},
  {id:"wol",name:"Wolverhampton",lg:"Premier League",abbr:"WOL",c1:"#FDB913",c2:"#231F20",pat:"solid",vM:400},
  {id:"eve",name:"Everton",lg:"Premier League",abbr:"EVE",c1:"#003399",c2:"#fff",pat:"solid",vM:400},
  {id:"lei",name:"Leicester City",lg:"Premier League",abbr:"LEI",c1:"#003090",c2:"#FDBE11",pat:"solid",vM:400},
  {id:"nfo",name:"Nottm Forest",lg:"Premier League",abbr:"NFO",c1:"#DD0000",c2:"#fff",pat:"solid",vM:350},
  {id:"cry",name:"Crystal Palace",lg:"Premier League",abbr:"CRY",c1:"#1B458F",c2:"#C4122E",pat:"hstrip",vM:350},
  {id:"bre",name:"Brentford",lg:"Premier League",abbr:"BRE",c1:"#E30613",c2:"#fff",pat:"vstrip",vM:350},
  {id:"bou",name:"Bournemouth",lg:"Premier League",abbr:"BOU",c1:"#E62333",c2:"#000",pat:"solid",vM:300},
  {id:"sou",name:"Southampton",lg:"Premier League",abbr:"SOU",c1:"#D71920",c2:"#fff",pat:"vstrip",vM:300},
  {id:"ips",name:"Ipswich Town",lg:"Premier League",abbr:"IPS",c1:"#0044A0",c2:"#fff",pat:"solid",vM:280},
  {id:"rma",name:"Real Madrid",lg:"La Liga",abbr:"RMA",c1:"#FEBE10",c2:"#fff",pat:"solid",vM:1500},
  {id:"bar",name:"Barcelona",lg:"La Liga",abbr:"BAR",c1:"#A50044",c2:"#004D98",pat:"vstrip",vM:1300},
  {id:"atm",name:"Atlético Madrid",lg:"La Liga",abbr:"ATM",c1:"#CB3524",c2:"#fff",pat:"hstrip",vM:800},
  {id:"sev",name:"Sevilla FC",lg:"La Liga",abbr:"SEV",c1:"#D2111B",c2:"#fff",pat:"solid",vM:400},
  {id:"val",name:"Valencia CF",lg:"La Liga",abbr:"VAL",c1:"#FF5A00",c2:"#fff",pat:"solid",vM:350},
  {id:"bet",name:"Real Betis",lg:"La Liga",abbr:"BET",c1:"#00954C",c2:"#FFD700",pat:"vstrip",vM:350},
  {id:"bay",name:"Bayern München",lg:"Bundesliga",abbr:"BAY",c1:"#DC052D",c2:"#fff",pat:"solid",vM:1200},
  {id:"bvb",name:"Borussia Dortmund",lg:"Bundesliga",abbr:"BVB",c1:"#FDE100",c2:"#000",pat:"solid",vM:700},
  {id:"b04",name:"Bayer Leverkusen",lg:"Bundesliga",abbr:"B04",c1:"#E32221",c2:"#000",pat:"solid",vM:600},
  {id:"her",name:"Hertha Berlin",lg:"Bundesliga",abbr:"HER",c1:"#005CA9",c2:"#fff",pat:"solid",vM:200},
  {id:"int",name:"Inter Milan",lg:"Serie A",abbr:"INT",c1:"#0068A8",c2:"#000",pat:"vstrip",vM:900},
  {id:"juv",name:"Juventus",lg:"Serie A",abbr:"JUV",c1:"#000",c2:"#fff",pat:"vstrip",vM:700},
  {id:"mil",name:"AC Milan",lg:"Serie A",abbr:"MIL",c1:"#FB090B",c2:"#000",pat:"vstrip",vM:750},
  {id:"nap",name:"Napoli",lg:"Serie A",abbr:"NAP",c1:"#12A0C3",c2:"#fff",pat:"solid",vM:650},
  {id:"psg",name:"Paris Saint-Germain",lg:"Ligue 1",abbr:"PSG",c1:"#003087",c2:"#DA291C",pat:"solid",vM:900},
  {id:"mar",name:"Olympique Marseille",lg:"Ligue 1",abbr:"OM",c1:"#009DD6",c2:"#fff",pat:"solid",vM:400},
  {id:"lyo",name:"Olympique Lyon",lg:"Ligue 1",abbr:"OL",c1:"#003A8C",c2:"#E8001B",pat:"solid",vM:350},
  {id:"ben",name:"Benfica",lg:"Primeira Liga",abbr:"SLB",c1:"#CC0000",c2:"#fff",pat:"solid",vM:600},
  {id:"por",name:"FC Porto",lg:"Primeira Liga",abbr:"FCP",c1:"#003DA5",c2:"#fff",pat:"solid",vM:500},
  {id:"spo",name:"Sporting CP",lg:"Primeira Liga",abbr:"SCP",c1:"#006600",c2:"#FFD700",pat:"solid",vM:450},
  {id:"aja",name:"Ajax",lg:"Eredivisie",abbr:"AJX",c1:"#CC0000",c2:"#fff",pat:"vstrip",vM:450},
  {id:"psv",name:"PSV Eindhoven",lg:"Eredivisie",abbr:"PSV",c1:"#CC0000",c2:"#fff",pat:"solid",vM:350},
  {id:"gal",name:"Galatasaray",lg:"Süper Lig",abbr:"GAL",c1:"#C8102E",c2:"#F5A623",pat:"half",vM:350},
  {id:"fen",name:"Fenerbahçe",lg:"Süper Lig",abbr:"FEN",c1:"#002F6C",c2:"#FFED00",pat:"solid",vM:300},
  {id:"bes",name:"Beşiktaş",lg:"Süper Lig",abbr:"BJK",c1:"#000",c2:"#fff",pat:"vstrip",vM:250},
  {id:"csk",name:"CSKA Moscow",lg:"Russian PL",abbr:"CSK",c1:"#C8102E",c2:"#003087",pat:"solid",vM:200},
  {id:"zen",name:"Zenit St. Petersburg",lg:"Russian PL",abbr:"ZEN",c1:"#007FFF",c2:"#fff",pat:"solid",vM:250},
  {id:"spa",name:"Spartak Moscow",lg:"Russian PL",abbr:"SPA",c1:"#C00000",c2:"#fff",pat:"hstrip",vM:180},
  {id:"sha",name:"Shakhtar Donetsk",lg:"Ukrainian PL",abbr:"SHA",c1:"#F08000",c2:"#000",pat:"solid",vM:200},
  {id:"ddk",name:"Dynamo Kyiv",lg:"Ukrainian PL",abbr:"DYK",c1:"#0044A0",c2:"#fff",pat:"solid",vM:150},
  {id:"oly",name:"Olympiakos",lg:"Super League GR",abbr:"OLY",c1:"#CC0000",c2:"#fff",pat:"solid",vM:200},
  {id:"pan",name:"Panathinaikos",lg:"Super League GR",abbr:"PAO",c1:"#006600",c2:"#fff",pat:"solid",vM:150},
  {id:"aek",name:"AEK Athens",lg:"Super League GR",abbr:"AEK",c1:"#F9D000",c2:"#000",pat:"solid",vM:150},
  {id:"pak",name:"PAOK",lg:"Super League GR",abbr:"PAK",c1:"#000",c2:"#fff",pat:"solid",vM:150},
  {id:"cel",name:"Celtic",lg:"Scottish Prem.",abbr:"CEL",c1:"#16A84B",c2:"#fff",pat:"vstrip",vM:250},
  {id:"ran",name:"Rangers",lg:"Scottish Prem.",abbr:"RAN",c1:"#003DA5",c2:"#fff",pat:"solid",vM:230},
  {id:"hea",name:"Hearts",lg:"Scottish Prem.",abbr:"HEA",c1:"#800000",c2:"#fff",pat:"solid",vM:120},
  {id:"and",name:"Anderlecht",lg:"Pro League",abbr:"AND",c1:"#6F2DA8",c2:"#fff",pat:"solid",vM:200},
  {id:"sla",name:"Slavia Prague",lg:"Czech Liga",abbr:"SLA",c1:"#CC0000",c2:"#fff",pat:"half",vM:180},
  {id:"vik",name:"Viktoria Plzeň",lg:"Czech Liga",abbr:"VPL",c1:"#003DA5",c2:"#C8102E",pat:"solid",vM:120},
  {id:"din",name:"Dinamo Zagreb",lg:"HNL Croatia",abbr:"DNZ",c1:"#1A66B3",c2:"#fff",pat:"solid",vM:120},
  {id:"rij",name:"HNK Rijeka",lg:"HNL Croatia",abbr:"RIJ",c1:"#006CBF",c2:"#fff",pat:"solid",vM:80},
  {id:"haj",name:"Hajduk Split",lg:"HNL Croatia",abbr:"HAJ",c1:"#fff",c2:"#000",pat:"solid",vM:100},
  {id:"rst",name:"Crvena Zvezda",lg:"SuperLiga SRB",abbr:"CSZ",c1:"#EF0107",c2:"#fff",pat:"solid",vM:80},
  {id:"par",name:"Partizan",lg:"SuperLiga SRB",abbr:"PAR",c1:"#000",c2:"#fff",pat:"solid",vM:60},
  {id:"voj",name:"Vojvodina",lg:"SuperLiga SRB",abbr:"VOJ",c1:"#EE2E24",c2:"#fff",pat:"solid",vM:30},
];

const PRAW=[
  ["mci","E. Haaland","ST",200],["mci","K. De Bruyne","CAM",150],["mci","P. Foden","LW",130],
  ["mci","Rodri","CDM",130],["mci","R. Dias","CB",90],["mci","Ederson","GK",60],
  ["mci","J. Doku","RW",80],["mci","B. Silva","CM",60],["mci","M. Akanji","CB",50],
  ["mci","K. Walker","RB",35],["mci","M. Nunes","CM",50],["mci","S. Lewis","CB",30],
  ["liv","M. Salah","RW",180],["liv","V. van Dijk","CB",80],["liv","T. Arnold","RB",80],
  ["liv","L. Díaz","LW",80],["liv","D. Núñez","ST",80],["liv","Alisson","GK",55],
  ["liv","D. Szoboszlai","CAM",70],["liv","A. Mac Allister","CM",65],
  ["liv","A. Robertson","LB",55],["liv","C. Gakpo","LW",55],["liv","D. Jota","ST",60],
  ["ars","B. Saka","RW",150],["ars","M. Ødegaard","CAM",130],["ars","D. Rice","CDM",120],
  ["ars","Gabriel","CB",70],["ars","D. Raya","GK",55],["ars","G. Martinelli","LW",75],
  ["ars","B. White","RB",60],["ars","O. Zinchenko","LB",55],["ars","K. Havertz","CAM",75],
  ["ars","T. Partey","CDM",50],["ars","J. Timber","CB",55],
  ["rma","Vinícius Jr.","LW",200],["rma","K. Mbappé","ST",200],["rma","J. Bellingham","CAM",200],
  ["rma","F. Valverde","CM",120],["rma","T. Courtois","GK",60],["rma","L. Modrić","CM",40],
  ["rma","E. Militão","CB",90],["rma","A. Rüdiger","CB",55],["rma","Rodrygo","RW",100],
  ["rma","A. Tchouaméni","CDM",80],["rma","D. Carvajal","RB",45],["rma","E. Camavinga","CM",80],
  ["bar","L. Yamal","RW",160],["bar","Pedri","CM",120],["bar","R. Lewandowski","ST",70],
  ["bar","Raphinha","RW",90],["bar","Gavi","CM",80],["bar","R. Araújo","CB",70],
  ["bar","A. Balde","LB",65],["bar","D. Olmo","CAM",65],["bar","M. ter Stegen","GK",50],
  ["bar","J. Koundé","RB",60],["bar","F. de Jong","CDM",70],
  ["bay","H. Kane","ST",150],["bay","J. Musiala","CAM",150],["bay","J. Kimmich","CDM",70],
  ["bay","L. Sané","RW",75],["bay","A. Davies","LB",65],["bay","M. Upamecano","CB",60],
  ["bay","Kim Min-jae","CB",60],["bay","L. Goretzka","CM",45],["bay","M. Neuer","GK",30],
  ["che","C. Palmer","CAM",120],["che","N. Jackson","ST",80],["che","M. Caicedo","CDM",90],
  ["che","E. Fernández","CM",70],["che","R. James","RB",60],["che","M. Cucurella","LB",55],
  ["che","L. Colwill","CB",55],["che","R. Sánchez","GK",40],["che","R. Lavia","CDM",55],
  ["psg","O. Dembélé","RW",100],["psg","G. Donnarumma","GK",50],["psg","A. Hakimi","RB",70],
  ["psg","Marquinhos","CB",55],["psg","W. Zaïre-Emery","CM",70],["psg","Vitinha","CM",65],
  ["psg","B. Barcola","LW",60],["psg","N. Mendes","LB",65],["psg","G. Ramos","ST",55],
  ["mun","R. Højlund","ST",90],["mun","B. Fernandes","CAM",90],["mun","M. Rashford","LW",70],
  ["mun","A. Onana","GK",45],["mun","K. Mainoo","CM",65],["mun","Casemiro","CDM",40],
  ["mun","D. Dalot","RB",45],["mun","L. Martínez","CB",55],
  ["tot","Son Heung-min","LW",80],["tot","J. Maddison","CAM",70],["tot","D. Kulusevski","RW",70],
  ["tot","G. Vicario","GK",45],["tot","C. Romero","CB",65],["tot","M. van de Ven","CB",70],
  ["tot","P. Porro","RB",55],["tot","D. Udogie","LB",55],
  ["new","A. Isak","ST",90],["new","B. Guimarães","CDM",80],["new","A. Gordon","LW",70],
  ["new","N. Pope","GK",50],["new","K. Trippier","RB",45],["new","S. Botman","CB",50],
  ["avl","O. Watkins","ST",90],["avl","E. Martínez","GK",75],["avl","E. Konsa","CB",55],
  ["avl","J. McGinn","CM",55],["avl","L. Bailey","LW",50],["avl","D. Luiz","CDM",65],
  ["avl","M. Cash","RB",45],["avl","Y. Tielemans","CDM",50],
  ["int","L. Martínez","ST",100],["int","H. Çalhanoğlu","CDM",80],["int","N. Barella","CM",80],
  ["int","A. Bastoni","CB",75],["int","M. Thuram","ST",75],["int","Y. Sommer","GK",35],
  ["int","F. Dimarco","LB",55],["int","D. Dumfries","RB",45],["int","B. Pavard","CB",55],
  ["juv","D. Vlahović","ST",80],["juv","T. Koopmeiners","CM",65],["juv","G. Bremer","CB",60],
  ["juv","M. Locatelli","CDM",45],["juv","F. Gatti","CB",50],["juv","W. Szczęsny","GK",30],
  ["mil","R. Leão","LW",90],["mil","M. Maignan","GK",65],["mil","T. Hernández","LB",65],
  ["mil","F. Tomori","CB",55],["mil","T. Reijnders","CM",60],["mil","C. Pulisic","CAM",55],
  ["nap","V. Osimhen","ST",100],["nap","K. Kvaratskhelia","LW",130],["nap","G. Di Lorenzo","RB",45],
  ["nap","S. Lobotka","CDM",55],["nap","A. Meret","GK",45],["nap","G. Raspadori","CAM",50],
  ["atm","A. Griezmann","ST",75],["atm","J. Oblak","GK",55],["atm","R. De Paul","CM",55],
  ["atm","N. Molina","RB",50],["atm","J. Giménez","CB",55],["atm","Koke","CM",30],
  ["b04","F. Wirtz","CAM",130],["b04","G. Xhaka","CDM",45],["b04","V. Boniface","ST",60],
  ["b04","A. Grimaldo","LB",55],["b04","J. Tah","CB",45],
  ["bvb","S. Guirassy","ST",55],["bvb","G. Kobel","GK",50],["bvb","N. Schlotterbeck","CB",50],
  ["bvb","K. Adeyemi","LW",55],["bvb","I. Maatsen","LB",45],["bvb","M. Sabitzer","CM",40],
  ["ben","D. Neres","RW",55],["ben","O. Kökcü","CM",45],["ben","V. Pavlidis","ST",40],
  ["ben","J. Trubin","GK",45],["ben","N. Silva","CB",35],["ben","A. Di María","LW",20],
  ["por","Evanilson","ST",50],["por","S. Eustaquio","CM",45],["por","D. Costa","GK",45],
  ["por","M. Galeno","LW",40],["por","Pepe","CB",40],
  ["spo","V. Gyökeres","ST",80],["spo","M. Hjulmand","CDM",45],["spo","P. Gonçalves","CAM",50],
  ["spo","N. Santos","LW",40],
  ["aja","B. Brobbey","ST",45],["aja","D. Ramaj","GK",40],["aja","A. Hato","LB",35],
  ["psv","L. de Jong","ST",35],["psv","J. Veerman","CM",45],["psv","W. Benitez","GK",35],
  ["gal","S. Aktürkoğlu","LW",35],["gal","F. Muslera","GK",20],["gal","A. Zaha","LW",25],
  ["fen","E. Džeko","ST",15],["fen","F. Müldür","RB",25],["fen","İ. Yüksel","LW",25],
  ["bes","G. Fernandes","CM",25],["bes","A. Batshuayi","ST",20],["bes","S. Uçan","CM",20],
  ["sev","Y. En-Nesyri","ST",45],["sev","M. Acuña","LB",40],["sev","B. Gil","LW",40],
  ["val","G. Mamardashvili","GK",50],["val","H. Duro","ST",35],["val","C. Mosquera","CB",35],
  ["bet","Isco","CAM",25],["bet","M. Roca","CDM",40],["bet","C. Iglesias","ST",35],
  ["mar","Vitinha","ST",45],["mar","P. López","GK",40],["mar","C. Mbemba","CB",35],
  ["lyo","R. Cherki","CAM",45],["lyo","A. Lacazette","ST",25],["lyo","A. Lopes","GK",35],
  ["whu","L. Paquetá","CAM",60],["whu","J. Bowen","RW",55],["whu","T. Souček","CM",50],
  ["bha","E. Ferguson","ST",55],["bha","J. Pedro","ST",45],["bha","C. Estupiñan","LB",40],
  ["ful","B. Leno","GK",45],["ful","A. Pereira","CM",45],["ful","R. Jiménez","ST",35],
  ["wol","M. Cunha","ST",60],["wol","P. Neto","RW",50],["wol","J. Sá","GK",40],
  ["eve","J. Branthwaite","CB",50],["eve","J. Pickford","GK",50],["eve","A. Onana","CDM",55],
  ["lei","M. Hermansen","GK",45],["lei","S. Mavididi","LW",40],["lei","W. Ndidi","CDM",40],
  ["nfo","M. Gibbs-White","CAM",55],["nfo","C. Wood","ST",40],["nfo","Murillo","CB",45],
  ["cry","E. Eze","CAM",65],["cry","J. Mateta","ST",55],["cry","M. Guéhi","CB",55],
  ["bre","B. Mbeumo","RW",60],["bre","Y. Wissa","ST",50],["bre","M. Flekken","GK",40],
  ["bou","A. Semenyo","RW",45],["bou","I. Zabarnyi","CB",45],["bou","M. Travers","GK",35],
  ["sou","T. Dibling","CAM",35],["sou","A. Armstrong","ST",35],["sou","G. Bazunu","GK",35],
  ["ips","L. Delap","ST",45],["ips","O. Hutchinson","LW",40],["ips","S. Morsy","CDM",30],
  ["cel","M. O'Riley","CM",40],["cel","K. Furuhashi","ST",30],["cel","J. Hart","GK",25],
  ["ran","J. Tavernier","RB",30],["ran","C. Dessers","ST",25],["ran","J. Butland","GK",25],
  ["hea","L. Shankland","ST",20],["hea","C. Gordon","GK",20],
  ["zen","Claudinho","CAM",30],["zen","Malcolm","RW",35],["zen","A. Kerzhakov","GK",20],
  ["csk","F. Chalov","ST",25],["csk","I. Diveev","CB",22],["csk","I. Oblyakov","CM",22],
  ["spa","Q. Promes","RW",20],["spa","A. Maksimenko","GK",25],
  ["sha","A. Mudryk","LW",60],["sha","D. Sikan","ST",28],["sha","M. Matviyenko","CB",30],
  ["ddk","V. Buyalsky","CM",25],["ddk","O. Karavaev","RB",22],
  ["oly","A. El Kaabi","ST",25],["oly","T. Tzolakis","GK",25],["oly","K. Fortounis","CAM",20],
  ["pan","F. Ioannidis","ST",22],["pan","B. Dragowski","GK",20],
  ["aek","E. Ponce","ST",25],["aek","N. Bakasetas","CAM",22],["aek","V. Barkas","GK",20],
  ["pak","K. Swiderski","ST",25],["pak","S. Schwab","CM",20],
  ["and","F. Amuzu","RW",28],["and","C. Stroeykens","CAM",25],
  ["her","F. Reese","LW",25],["her","F. Uremović","CB",20],["her","I. Scherhant","RW",18],
  ["sla","T. Holeš","CB",20],["sla","C. Zafeiris","CM",18],["sla","J. Mandous","GK",18],
  ["vik","L. Kalvach","CM",15],["vik","A. Čermák","CM",15],["vik","M. Jedlička","GK",12],
  ["din","D. Špikić","ST",20],["din","L. Ivanušec","CAM",18],
  ["rij","S. Jakić","CM",12],["rij","D. Petrak","GK",10],
  ["haj","M. Livaja","ST",12],["haj","L. Kalinić","GK",10],
  ["rst","M. Pavkov","ST",3],["rst","N. Bukari","LW",4],["rst","O. Spajić","CB",3],["rst","M. Borjan","GK",2.5],
  ["par","S. Pavlović","CM",4],["par","A. Jović","CM",3],["par","L. Marković","LW",2.5],
  ["voj","D. Kojić","ST",1.5],["voj","I. Đurić","CM",1],["voj","M. Šarić","CB",1],
];

const FARAW=[
  ["Cristiano Ronaldo","ST",30],["Lionel Messi","CAM",40],["Neymar Jr.","LW",25],
  ["Karim Benzema","ST",20],["Sadio Mané","LW",20],["N'Golo Kanté","CDM",20],
  ["Riyad Mahrez","RW",18],["Roberto Firmino","ST",15],["Sergio Ramos","CB",8],
  ["Memphis Depay","ST",30],["P. Dybala","CAM",30],["F. Kessié","CDM",30],
  ["A. Laporte","CB",40],["S. Milinković-Savić","CM",40],["G. Lo Celso","CM",25],
  ["T. Werner","ST",25],["I. Perišić","LW",20],["P. van Aanholt","LB",18],
  ["W. Zaha","LW",20],["I. Gvardiol","CB",60],["C. Nkunku","CAM",50],
  ["C. Eriksen","CAM",30],["I. Gündoğan","CM",35],["T. Kubo","RW",45],
  ["H. Lozano","RW",30],["K. Mitrović","ST",30],["D. Tadić","LW",20],
  ["M. Oyarzabal","LW",35],["A. Baena","CM",30],["B. Yıldız","CAM",35],
  ["A. Guedes","RW",25],["Cucho Hernández","ST",30],["J. Ward-Prowse","CM",30],
  ["O. Giroud","ST",15],["E. Hazard","LW",15],["Y. Cherki","CAM",40],
  ["L. Trossard","LW",40],["S. Gnabry","RW",40],["B. Coman","RW",40],
  ["C. Gallagher","CM",45],["O. Sorloth","ST",35],["M. Verratti","CM",20],
  ["L. Suárez","ST",10],["D. Alli","CAM",15],["F. Lampard","CM",5],
  ["T. Alderweireld","CB",10],["J. Vertonghen","CB",12],["J. Mata","CAM",5],
  ["C. Tevez","ST",5],["Zlatan Ibrahimović","ST",5],["G. Chiellini","CB",5],
  ["R. Iborra","ST",10],["W. Endō","CDM",30],["T. Minamino","CM",25],
  ["D. Kamada","CAM",25],["T. Tomiyasu","RB",30],["A. Miranchuk","CAM",22],
  ["F. Ruiz","CM",40],["N. Williams","RB",30],["O. McAtee","CM",25],
  ["A. O'Riley","CM",35],["Marcelo","LB",5],["A. Cole","LB",5],
  ["P. Sarabia","LW",25],["A. Pirlo","CM",5],["Robinho","LW",5],
  ["J. Navas","RB",10],["K. Boateng","CM",8],["G. Cahill","CB",5],
];

function buildState(){
  uid=1;
  const sorted=[...CDEFS].sort((a,b)=>b.vM-a.vM);
  const flMap={};sorted.forEach((c,i)=>{flMap[c.id]=i<20?"FPL":i<40?"FCH":"FCL";});
  const clubs=CDEFS.map(c=>({...c,price:Math.floor(c.vM*1e6/100),ownedBy:"bot",
    pts:0,wins:0,draws:0,losses:0,gf:0,ga:0,fL:flMap[c.id],
    fp:{pts:0,w:0,d:0,l:0,gf:0,ga:0}}));
  const players=PRAW.map(([cid,nm,pos,vM])=>mkP(nm,pos,vM,cid));
  const cnt={};players.forEach(p=>{cnt[p.clubId]=(cnt[p.clubId]||0)+1;});
  clubs.forEach(c=>{
    const n=Math.max(0,18-(cnt[c.id]||0));
    for(let i=0;i<n;i++)players.push(fill(POS[i%POS.length],c.vM/(15+rnd(0,18)),c.id));
  });
  FARAW.forEach(([nm,pos,vM])=>players.push(mkP(nm,pos,vM,"free")));
  return{tokens:5000000,myClubId:null,week:1,season:1,prizePool:0,clubs,players,
    cup:{active:false,round:0,rounds:[],champion:null},
    friendlyHistory:[],purchaseOrder:0};
}

const STADIA=[
  {n:"Local Ground",cap:5000,cost:0,inc:50000},
  {n:"District Arena",cap:15000,cost:200000,inc:150000},
  {n:"Regional Stadium",cap:30000,cost:500000,inc:350000},
  {n:"City Arena",cap:55000,cost:1000000,inc:650000},
  {n:"Freedom Stadium",cap:75000,cost:1500000,inc:1000000},
  {n:"World Arena",cap:90000,cost:2000000,inc:1500000},
];
const FMTNS=["4-3-3","4-4-2","4-2-3-1","3-5-2","5-3-2","4-5-1"];
const TACS=["Balanced","High Press","Counter-Attack","Tiki-Taka","Park the Bus","Wing Play"];
const MOTIVS=[{l:"Standard",cost:0,b:0},{l:"Team Talk",cost:10000,b:3},{l:"Inspire",cost:50000,b:7},{l:"Battle Cry",cost:100000,b:12}];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#05050e;--p:rgba(255,255,255,.04);--p2:rgba(255,255,255,.07);
--brd:rgba(168,85,247,.28);--bgrn:rgba(74,222,128,.28);--bgld:rgba(251,191,36,.25);
--pu:#a855f7;--pu2:#c084fc;--gn:#4ade80;--gn2:#22c55e;--tx:#eeeeff;--mt:#8878a8;--rd:#f87171;--gd:#fbbf24;}
body{background:var(--bg);color:var(--tx);font-family:'Rajdhani',sans-serif;font-size:14px;}
.app{display:flex;flex-direction:column;min-height:100vh;
background:var(--bg);
background-image:radial-gradient(ellipse 60% 40% at 10% 0%,rgba(168,85,247,.18) 0%,transparent 70%),
radial-gradient(ellipse 40% 35% at 90% 5%,rgba(74,222,128,.1) 0%,transparent 60%);}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:56px;
background:rgba(5,5,14,.97);border-bottom:1px solid var(--brd);position:sticky;top:0;z-index:100;}
.logo{font-family:'Orbitron',sans-serif;font-weight:900;font-size:15px;letter-spacing:2px;
background:linear-gradient(135deg,var(--pu2),var(--gn));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lsub{font-family:'Orbitron',sans-serif;font-size:8px;color:var(--mt);letter-spacing:3px;}
.hr{display:flex;align-items:center;gap:8px;}
.chip{display:flex;align-items:center;gap:6px;border-radius:8px;padding:5px 11px;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;}
.chip.gd{background:rgba(251,191,36,.1);border:1px solid var(--bgld);color:var(--gd);}
.chip.pu{background:rgba(168,85,247,.1);border:1px solid var(--brd);color:var(--pu2);}
.wbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;background:rgba(168,85,247,.12);border:1px solid var(--brd);color:var(--pu2);cursor:pointer;transition:all .2s;}
.wbtn:hover{background:rgba(168,85,247,.22);}
.wbtn.on{color:var(--gn);background:rgba(74,222,128,.08);border-color:var(--bgrn);}
.lay{display:flex;flex:1;}
.sb{width:196px;min-height:calc(100vh - 56px);background:rgba(5,5,14,.9);border-right:1px solid var(--brd);padding:6px 0;flex-shrink:0;display:flex;flex-direction:column;}
.sep{padding:8px 14px 3px;font-family:'Orbitron',sans-serif;font-size:8px;color:var(--mt);letter-spacing:2px;}
.nav{display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:var(--mt);transition:all .15s;border-left:3px solid transparent;}
.nav:hover{color:var(--tx);background:rgba(168,85,247,.07);}
.nav.on{color:var(--pu2);border-left-color:var(--pu);background:rgba(168,85,247,.11);}
.cbbadge{margin-top:auto;padding:12px 14px;border-top:1px solid var(--brd);}
.main{flex:1;padding:18px;overflow-y:auto;max-height:calc(100vh - 56px);}
.panel{background:var(--p);border:1px solid var(--brd);border-radius:12px;padding:15px;}
.panel.gn{border-color:var(--bgrn);}.panel.gd{border-color:var(--bgld);}
.pt{font-family:'Orbitron',sans-serif;font-size:8px;color:var(--mt);letter-spacing:2px;margin-bottom:11px;}
.h2{font-family:'Orbitron',sans-serif;font-size:17px;font-weight:700;}
.sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:9px;margin-bottom:14px;}
.sc{background:var(--p2);border:1px solid var(--brd);border-radius:10px;padding:11px;}
.sl{font-family:'Orbitron',sans-serif;font-size:7px;color:var(--mt);letter-spacing:1px;}
.sv{font-family:'Orbitron',sans-serif;font-size:19px;font-weight:700;margin-top:3px;}
.sv.pu{color:var(--pu2);}.sv.gn{color:var(--gn);}.sv.gd{color:var(--gd);}.sv.rd{color:var(--rd);}
.btn{display:inline-flex;align-items:center;gap:4px;padding:7px 13px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;}
.btn.pu{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;}
.btn.pu:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(168,85,247,.4);}
.btn.gn{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;}
.btn.gn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(34,197,94,.4);}
.btn.rd{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;}
.btn.gd{background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;}
.btn.gh{background:transparent;border:1px solid var(--brd);color:var(--mt);}
.btn.gh:hover{color:var(--tx);border-color:var(--pu);}
.btn:disabled{opacity:.3;cursor:not-allowed;transform:none!important;box-shadow:none!important;}
.btn.sm{padding:4px 9px;font-size:11px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;}
.tbl{width:100%;border-collapse:collapse;}
.tbl th{font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;color:var(--mt);letter-spacing:1px;text-align:left;padding:8px 10px;border-bottom:1px solid var(--brd);}
.tbl td{padding:7px 10px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.035);}
.tbl tr:hover td{background:rgba(168,85,247,.04);}
.bdg{display:inline-block;padding:2px 5px;border-radius:4px;font-size:8px;font-weight:700;font-family:'Orbitron',sans-serif;}
.bdg.gk{background:rgba(251,191,36,.15);color:var(--gd);}
.bdg.def{background:rgba(74,222,128,.12);color:var(--gn);}
.bdg.mid{background:rgba(168,85,247,.12);color:var(--pu2);}
.bdg.fwd{background:rgba(248,113,113,.12);color:var(--rd);}
.tag{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;}
.tag.gn{background:rgba(74,222,128,.12);color:var(--gn);border:1px solid rgba(74,222,128,.3);}
.tag.rd{background:rgba(248,113,113,.12);color:var(--rd);border:1px solid rgba(248,113,113,.3);}
.tag.pu{background:rgba(168,85,247,.12);color:var(--pu2);border:1px solid rgba(168,85,247,.3);}
.tag.gd{background:rgba(251,191,36,.12);color:var(--gd);border:1px solid rgba(251,191,36,.3);}
.inp{background:rgba(255,255,255,.06);border:1px solid var(--brd);border-radius:8px;padding:6px 10px;color:var(--tx);font-family:'Rajdhani',sans-serif;font-size:13px;outline:none;}
.inp:focus{border-color:var(--pu);}
.sel{background:rgba(5,5,14,.92);border:1px solid var(--brd);border-radius:8px;padding:6px 10px;color:var(--tx);font-family:'Rajdhani',sans-serif;font-size:13px;outline:none;cursor:pointer;}
.pill{padding:6px 12px;border-radius:20px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;border:1px solid var(--brd);color:var(--mt);transition:all .15s;}
.pill.on{background:rgba(168,85,247,.17);border-color:var(--pu);color:var(--pu2);}
.tabs{display:flex;gap:3px;margin-bottom:12px;flex-wrap:wrap;}
.tab{padding:6px 12px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;cursor:pointer;color:var(--mt);border:1px solid transparent;transition:all .15s;}
.tab.on{background:rgba(168,85,247,.12);color:var(--pu2);border-color:var(--brd);}
.tab:hover:not(.on){color:var(--tx);}
.bw{height:4px;border-radius:3px;background:rgba(255,255,255,.08);}
.bf{height:100%;border-radius:3px;transition:width .3s;}
.toast{position:fixed;bottom:14px;right:14px;padding:10px 15px;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;z-index:9999;animation:tIn .22s ease;}
.toast.s{background:rgba(22,163,74,.92);border:1px solid var(--gn);color:#fff;}
.toast.e{background:rgba(185,28,28,.92);border:1px solid var(--rd);color:#fff;}
.toast.i{background:rgba(99,102,241,.92);border:1px solid var(--pu);color:#fff;}
@keyframes tIn{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
.ccard{background:var(--p);border:1px solid var(--brd);border-radius:12px;padding:13px;cursor:pointer;transition:all .2s;}
.ccard:hover{border-color:var(--pu);transform:translateY(-2px);}
.pitch{background:linear-gradient(180deg,#0a3e1a,#0e5022,#0a3e1a);border:1px solid var(--bgrn);border-radius:10px;overflow:hidden;aspect-ratio:3/2;}
.ld{width:7px;height:7px;border-radius:50%;background:var(--rd);box-shadow:0 0 6px var(--rd);animation:pu .8s ease-in-out infinite alternate;display:inline-block;}
@keyframes pu{to{opacity:.2;transform:scale(.7)}}
.score{font-family:'Orbitron',sans-serif;font-size:44px;font-weight:900;line-height:1;}
.mev{padding:4px 0;border-bottom:1px solid rgba(255,255,255,.035);font-size:12px;}
.mev.goal_home{color:var(--gn);font-weight:700;}.mev.goal_away{color:var(--rd);font-weight:700;}
.mev.fulltime{color:var(--gd);font-weight:700;}
.lgme td{background:rgba(168,85,247,.07);color:var(--pu2);}
.fz td{background:rgba(74,222,128,.04);}.rz td{background:rgba(248,113,113,.04);}
.ftr{text-align:center;padding:10px;border-top:1px solid var(--brd);background:rgba(5,5,14,.97);font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(168,85,247,.3);border-radius:2px;}
`;

const JerseySVG=({c,sz=42})=>{
  const{id,c1,c2,pat}=c;
  return(
    <svg viewBox="0 0 60 66" width={sz} height={Math.round(sz*1.1)} style={{display:"block",flexShrink:0}}>
      <defs><clipPath id={`jc${id}`}><path d="M13,13 L1,27 L13,31 L13,58 L47,58 L47,31 L59,27 L47,13 L38,9 Q30,17 22,9 Z"/></clipPath></defs>
      <path d="M13,13 L1,27 L13,31 L13,58 L47,58 L47,31 L59,27 L47,13 L38,9 Q30,17 22,9 Z" fill={c1}/>
      {pat==="vstrip"&&[0,1,2,3].map(i=><rect key={i} x={5+i*14} y={0} width={7} height={70} fill={c2} opacity={.75} clipPath={`url(#jc${id})`}/>)}
      {pat==="hstrip"&&[0,1,2,3,4].map(i=><rect key={i} x={0} y={i*13} width={70} height={6} fill={c2} opacity={.75} clipPath={`url(#jc${id})`}/>)}
      {pat==="half"&&<rect x={30} y={0} width={40} height={70} fill={c2} opacity={.85} clipPath={`url(#jc${id})`}/>}
      {pat==="sash"&&<polygon points="0,22 60,36 60,50 0,36" fill={c2} opacity={.75} clipPath={`url(#jc${id})`}/>}
      {pat==="diag"&&<polygon points="0,0 35,0 0,66" fill={c2} opacity={.75} clipPath={`url(#jc${id})`}/>}
      <path d="M24,9 Q30,17 36,9" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.5}/>
      <path d="M13,13 L1,27 L13,31 L13,58 L47,58 L47,31 L59,27 L47,13 L38,9 Q30,17 22,9 Z" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={1}/>
    </svg>
  );
};

const PitchSVG=({ms})=>(
  <svg viewBox="0 0 320 210" style={{width:"100%",height:"100%"}}>
    <rect x="8" y="8" width="304" height="194" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
    <line x1="160" y1="8" x2="160" y2="202" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
    <circle cx="160" cy="105" r="28" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
    <rect x="8" y="70" width="38" height="70" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
    <rect x="274" y="70" width="38" height="70" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
    {[[28,105],[78,55],[78,85],[78,125],[78,155],[118,70],[118,105],[118,140],[148,60],[148,150],[148,105]]
      .map((p,i)=><circle key={`h${i}`} cx={p[0]} cy={p[1]} r="6" fill="#4ade80" opacity=".85"/>)}
    {[[292,105],[242,55],[242,85],[242,125],[242,155],[202,70],[202,105],[202,140],[172,60],[172,150],[172,105]]
      .map((p,i)=><circle key={`a${i}`} cx={p[0]} cy={p[1]} r="6" fill="#f87171" opacity=".7"/>)}
    {ms?.log[0]?.type==="goal_home"&&<rect x="296" y="85" width="16" height="40" fill="rgba(74,222,128,.5)" rx="2"/>}
    {ms?.log[0]?.type==="goal_away"&&<rect x="8" y="85" width="16" height="40" fill="rgba(248,113,113,.5)" rx="2"/>}
  </svg>
);

const tR=(pls,boost=0)=>{
  const fit=pls.filter(p=>!p.injured);if(!fit.length)return 45;
  return clamp(fit.reduce((s,p)=>s+avg(p)*(p.cond/100)*(p.morale/100),0)/fit.length+boost+5,40,99);
};
const simSc=(hR,aR)=>{let h=0,a=0;for(let i=0;i<7;i++){const hp=hR/(hR+aR);if(Math.random()<.28){if(Math.random()<hp)h++;else a++;}}return{h,a};};
const makeEvs=(hR,aR)=>{
  const hp=hR/(hR+aR),evs=[{m:0,t:"kickoff",txt:"⚡ Kickoff!"}];
  [...Array(13)].map(()=>rnd(1,89)).sort((a,b)=>a-b).forEach(m=>{
    const r=Math.random();
    if(r<.22){const h=Math.random()<hp;evs.push({m,t:h?"goal_home":"goal_away",txt:h?`⚽ GOAL! (${m}')`:`⚽ They score! (${m}')`});}
    else if(r<.35)evs.push({m,t:"card",txt:`🟡 Yellow card (${m}')`});
    else if(r<.5)evs.push({m,t:"chance",txt:`💨 Shot wide (${m}')`});
    else evs.push({m,t:"info",txt:`⚔️ Midfield battle (${m}')`});
  });
  evs.push({m:90,t:"fulltime",txt:"⏱️ Full Time!"});return evs;
};

const NAVS=[
  {id:"dash",ico:"🏠",l:"Dashboard"},
  {id:"clubs",ico:"🏟️",l:"Buy Club"},
  {id:"squad",ico:"👥",l:"Squad"},
  {id:"training",ico:"🏋️",l:"Training"},
  {id:"strategy",ico:"♟️",l:"Strategy"},
  {id:"stadium",ico:"🏗️",l:"Stadium"},
  {id:"match",ico:"⚽",l:"Match"},
  {id:"league",ico:"📊",l:"Freedom Leagues"},
  {id:"cup",ico:"🏆",l:"Freedom Cup"},
  {id:"friendly",ico:"🤝",l:"Friendlies"},
  {id:"market",ico:"💱",l:"Transfer Market"},
  {id:"create",ico:"⚡",l:"Create Player"},
];

export default function FFF(){
  const[G,setG]=useState(buildState);
  const[view,setView]=useState("dash");
  const[wallet,setWallet]=useState({on:false,addr:null});
  const[toast,setToast]=useState(null);
  const[match,setMatch]=useState(null);
  const[strat,setStrat]=useState({fm:"4-3-3",tac:"Balanced",mot:"Standard"});
  const[stad,setStad]=useState(0);
  const[buyLg,setBuyLg]=useState("Premier League");
  const[lgTab,setLgTab]=useState("FPL");
  const[mktTab,setMktTab]=useState("free");
  const[mktF,setMktF]=useState({pos:"All",q:"",maxPr:""});
  const[sqLP,setSqLP]=useState({});
  const[mkLP,setMkLP]=useState({});
  const[cf,setCf]=useState({name:"",pos:"ST",age:"24",vM:"30"});
  const[selOpp,setSelOpp]=useState("");
  const[frOpp,setFrOpp]=useState("");
  const[frBet,setFrBet]=useState("10000");
  const[frRes,setFrRes]=useState(null);
  const tmRef=useRef(null);const toRef=useRef(null);

  useEffect(()=>{const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  const myClub=G.clubs.find(c=>c.id===G.myClubId)||null;
  const myPls=G.players.filter(p=>p.clubId===G.myClubId);
  const listedPls=G.players.filter(p=>p.listed&&p.clubId!==G.myClubId&&p.clubId!=="free");
  const freePls=G.players.filter(p=>p.clubId==="free");

  const notify=(msg,type="i")=>{setToast({msg,type});clearTimeout(toRef.current);toRef.current=setTimeout(()=>setToast(null),3500);};
  const spend=(amt,lbl,mut)=>{
    if(G.tokens<amt){notify("Insufficient FREEDOM tokens!","e");return false;}
    const fee=Math.floor(amt*.1);
    setG(g=>{const n={...g,tokens:g.tokens-amt,prizePool:g.prizePool+fee};return mut?mut(n):n;});
    notify(`-${ftf(amt)} FT · ${lbl}`,"s");return true;
  };

  const buyClub=(club)=>{
    if(G.myClubId){notify("You already own a club!","e");return;}
    if(!spend(club.price,`Bought ${club.name}`))return;
    const po=G.purchaseOrder+1;
    const fl=po<=20?"FPL":po<=40?"FCH":"FCL";
    setG(g=>({...g,myClubId:club.id,purchaseOrder:po,
      clubs:g.clubs.map(c=>c.id===club.id?{...c,ownedBy:"player",fL:fl}:c)}));
    setView("squad");
  };

  const buyPlayer=(p)=>{
    if(!G.myClubId){notify("Buy a club first!","e");return;}
    if(myPls.length>=22){notify("Squad full! (max 22)","e");return;}
    const cost=p.listed?p.listPrice:p.price;
    if(!spend(cost,`Signed ${p.name}`))return;
    setG(g=>({...g,players:g.players.map(pl=>pl.id===p.id?{...pl,clubId:G.myClubId,listed:false,morale:Math.min(100,pl.morale+10)}:pl)}));
  };

  const listForSale=(pid,price)=>{
    setG(g=>({...g,players:g.players.map(p=>{
      if(p.id!==pid)return p;
      return{...p,listed:true,listPrice:price,morale:clamp(p.morale+(Math.random()>.5?8:-12),20,100)};
    })}));notify("Player listed on Transfer Market","i");
  };
  const delist=(pid)=>{setG(g=>({...g,players:g.players.map(p=>p.id===pid?{...p,listed:false,listPrice:0}:p)}));notify("Delisted","i");};

  const trainPlayer=(pid)=>{
    const p=G.players.find(x=>x.id===pid);
    if(!p||p.injured){notify("Cannot train injured player!","e");return;}
    if(p.trainings>=5){notify("Max 5 sessions/week!","e");return;}
    const inj=Math.random()<(p.trainings>=4?.10:.02);
    if(!spend(1000,`Training: ${p.name}`))return;
    setG(g=>({...g,players:g.players.map(pl=>{
      if(pl.id!==pid)return pl;
      const stats={...pl.stats};
      if(!inj){const k=Object.keys(stats)[rnd(0,5)];stats[k]=Math.min(99,stats[k]+1);}
      return{...pl,stats,cond:Math.max(30,pl.cond-rnd(3,8)),trainings:pl.trainings+1,injured:inj,injuryWeeks:inj?rnd(1,4):pl.injuryWeeks};
    })}));
    if(inj)notify(`${p.name} injured during training! 🤕`,"e");
  };

  const healPlayer=(pid)=>{
    const p=G.players.find(x=>x.id===pid);if(!p?.injured)return;
    const cost=p.injuryWeeks*50000;
    if(!spend(cost,`Therapy: ${p.name}`))return;
    setG(g=>({...g,players:g.players.map(pl=>pl.id===pid?{...pl,injured:false,injuryWeeks:0,cond:62}:pl)}));
  };

  const playMatch=(oppId)=>{
    if(!G.myClubId||match?.playing)return;
    if(myPls.filter(p=>!p.injured).length<11){notify("Need 11 fit players!","e");return;}
    const mot=MOTIVS.find(m=>m.l===strat.mot)||MOTIVS[0];
    if(mot.cost>0&&G.tokens<mot.cost){notify("Insufficient tokens for motivation!","e");return;}
    if(mot.cost>0)setG(g=>({...g,tokens:g.tokens-mot.cost,prizePool:g.prizePool+Math.floor(mot.cost*.1)}));
    const myR=tR(myPls,mot.b);
    const oppR=tR(G.players.filter(p=>p.clubId===oppId));
    const evs=makeEvs(myR,oppR);
    setMatch({playing:true,oppId,m:0,mySc:0,oppSc:0,log:[],evs,ei:0});
    let ei=0;
    clearInterval(tmRef.current);
    tmRef.current=setInterval(()=>{
      ei++;
      setMatch(ms=>{
        if(!ms||ei>=ms.evs.length){
          clearInterval(tmRef.current);
          setTimeout(()=>{
            setMatch(ms2=>{
              if(!ms2)return ms2;
              const won=ms2.mySc>ms2.oppSc,draw=ms2.mySc===ms2.oppSc;
              const inc=won?STADIA[stad].inc:draw?Math.floor(STADIA[stad].inc/2):0;
              if(inc>0)setG(g=>({...g,tokens:g.tokens+inc}));
              notify(won?`Victory! +${ftf(inc)} FT`:draw?"Draw!":"Defeat.",won?"s":"i");
              setG(g=>({...g,
                clubs:g.clubs.map(c=>{
                  if(c.id===G.myClubId)return{...c,pts:c.pts+(won?3:draw?1:0),wins:c.wins+(won?1:0),draws:c.draws+(draw?1:0),losses:c.losses+((!won&&!draw)?1:0),gf:c.gf+ms2.mySc,ga:c.ga+ms2.oppSc,fp:{...c.fp,pts:c.fp.pts+(won?3:draw?1:0),w:c.fp.w+(won?1:0),d:c.fp.d+(draw?1:0),l:c.fp.l+((!won&&!draw)?1:0),gf:c.fp.gf+ms2.mySc,ga:c.fp.ga+ms2.oppSc}};
                  if(c.id===oppId)return{...c,pts:c.pts+((!won&&!draw)?3:draw?1:0),gf:c.gf+ms2.oppSc,ga:c.ga+ms2.mySc};
                  return c;
                }),
                players:g.players.map(p=>p.clubId===G.myClubId?{...p,cond:Math.max(32,p.cond-rnd(5,13)),trainings:0}:p),
              }));
              return{...ms2,playing:false,m:90};
            });
          },300);
          return ms?{...ms,playing:false,m:90}:ms;
        }
        const ev=ms.evs[ei];
        return{...ms,m:ev.m,mySc:ms.mySc+(ev.t==="goal_home"?1:0),oppSc:ms.oppSc+(ev.t==="goal_away"?1:0),log:[ev,...ms.log].slice(0,20)};
      });
    },145);
  };

  const playFriendly=()=>{
    if(!G.myClubId){notify("Buy a club first!","e");return;}
    const bet=parseInt(frBet)||0;
    if(bet<1000){notify("Minimum bet: 1,000 FT","e");return;}
    if(!frOpp){notify("Select an opponent!","e");return;}
    if(G.tokens<bet){notify("Insufficient tokens!","e");return;}
    const myR=tR(myPls);
    const oppPls=G.players.filter(p=>p.clubId===frOpp);
    const oppR=tR(oppPls);
    const{h,a}=simSc(myR,oppR);
    const won=h>a,draw=h===a;
    const fee=Math.floor(bet*.1);
    const net=won?Math.floor(bet*.9):draw?0:-bet;
    setG(g=>({...g,tokens:g.tokens+net,prizePool:g.prizePool+fee,
      friendlyHistory:[{opp:frOpp,h,a,net,date:`Wk ${g.week}`},...g.friendlyHistory].slice(0,20)}));
    setFrRes({h,a,won,draw,net});
    notify(won?`Friendly won! ${net>0?`+${ftf(net)} FT`:""}`:draw?"Friendly draw!":"Friendly lost!",won?"s":"i");
  };

  const endSeason=()=>{
    const st=(tier)=>[...G.clubs].filter(c=>c.fL===tier).sort((a,b)=>b.fp.pts-a.fp.pts||(b.fp.gf-b.fp.ga)-(a.fp.gf-a.fp.ga));
    const fpl=st("FPL"),fch=st("FCH"),fcl=st("FCL");
    const relFPL=fpl.slice(-4).map(c=>c.id);
    const proFCH=fch.slice(0,4).map(c=>c.id);
    const relFCH=fch.slice(-4).map(c=>c.id);
    const proFCL=fcl.slice(0,4).map(c=>c.id);
    const winner=fpl[0];
    if(winner)notify(`🏆 ${winner.name} wins Freedom Premier League Season ${G.season}!`,"s");
    setG(g=>({...g,season:g.season+1,week:1,prizePool:0,
      clubs:g.clubs.map(c=>({...c,pts:0,wins:0,draws:0,losses:0,gf:0,ga:0,fp:{pts:0,w:0,d:0,l:0,gf:0,ga:0},
        fL:relFPL.includes(c.id)?"FCH":proFCH.includes(c.id)?"FPL":relFCH.includes(c.id)?"FCL":proFCL.includes(c.id)?"FCH":c.fL
      }))}));
  };

  const startCup=()=>{
    const all=[...G.clubs].sort(()=>Math.random()-.5).slice(0,64);
    const r1=[];
    for(let i=0;i<all.length-1;i+=2)r1.push({h:all[i].id,a:all[i+1].id,hS1:null,aS1:null,hS2:null,aS2:null,winner:null});
    const rnames=["Round of 64","Round of 32","Round of 16","Quarter Finals","Semi Finals","Final"];
    setG(g=>({...g,cup:{active:true,round:0,champion:null,rounds:rnames.map((name,i)=>({name,matches:i===0?r1:[]}))}}));
    notify("Freedom Cup started! 64 clubs in bracket.","s");
  };

  const simCupRound=()=>{
    setG(g=>{
      const cup=JSON.parse(JSON.stringify(g.cup));
      const ri=cup.round;
      if(ri>=cup.rounds.length)return g;
      cup.rounds[ri].matches=cup.rounds[ri].matches.map(m=>{
        if(m.winner)return m;
        if(m.h===g.myClubId||m.a===g.myClubId)return m;
        const hC=g.clubs.find(c=>c.id===m.h),aC=g.clubs.find(c=>c.id===m.a);
        const hR=hC?.vM||50,aR=aC?.vM||50;
        const{h:h1,a:a1}=simSc(hR,aR);
        const{h:h2,a:a2}=simSc(aR,hR);
        const hAgg=h1+a2,aAgg=a1+h2;
        const w=hAgg>aAgg?m.h:aAgg>hAgg?m.a:(Math.random()>.5?m.h:m.a);
        return{...m,hS1:h1,aS1:a1,hS2:h2,aS2:a2,winner:w};
      });
      const allDone=cup.rounds[ri].matches.every(m=>m.winner);
      if(allDone){
        if(ri===cup.rounds.length-1){
          const champion=cup.rounds[ri].matches[0]?.winner;
          cup.champion=champion;
          const cName=g.clubs.find(c=>c.id===champion)?.name||"Unknown";
          setTimeout(()=>notify(`🏆 ${cName} wins the Freedom Cup!`,"s"),100);
        }else{
          const winners=cup.rounds[ri].matches.map(m=>m.winner).filter(Boolean);
          const nm=[];
          for(let i=0;i<winners.length-1;i+=2)nm.push({h:winners[i],a:winners[i+1],hS1:null,aS1:null,hS2:null,aS2:null,winner:null});
          cup.rounds[ri+1].matches=nm;
          cup.round=ri+1;
        }
      }
      return{...g,cup};
    });
  };

  // ── VIEWS ─────────────────────────────────────────────────────────────────
  const Dash=()=>{
    const myPos=myClub?[...G.clubs].filter(c=>c.fL===myClub.fL).sort((a,b)=>b.fp.pts-a.fp.pts).findIndex(c=>c.id===G.myClubId)+1:null;
    const humanClubs=G.clubs.filter(c=>c.ownedBy==="player");
    const cupReady=humanClubs.length>=20&&!G.cup.active;
    return(
      <div>
        <div style={{marginBottom:16}}><div className="h2">{myClub?`⚽ ${myClub.name}`:"🏆 Project Freedom Football Fantasy"}</div>
          <div style={{color:"var(--mt)",marginTop:3,fontSize:13}}>{myClub?`${myClub.fL==="FPL"?"Freedom Premier":myClub.fL==="FCH"?"Freedom Championship":"Freedom Challenger"} · Season ${G.season} · Week ${G.week}`:"You're not just a fan. You're in command."}</div>
        </div>
        <div className="sg">
          <div className="sc"><div className="sl">FREEDOM TOKENS</div><div className="sv gd">{ftf(G.tokens)}</div></div>
          <div className="sc"><div className="sl">PRIZE POOL</div><div className="sv pu">{ftf(G.prizePool)} FT</div></div>
          {myClub&&<div className="sc"><div className="sl">LEAGUE POSITION</div><div className="sv gn">#{myPos}</div></div>}
          {myClub&&<div className="sc"><div className="sl">SQUAD</div><div className="sv">{myPls.length}/22</div></div>}
          <div className="sc"><div className="sl">CLUBS OWNED</div><div className="sv">{humanClubs.length}</div></div>
          <div className="sc"><div className="sl">SEASON</div><div className="sv">{G.season}</div></div>
        </div>
        <div className="g2" style={{marginBottom:12}}>
          <div className="panel">
            <div className="pt">MY CLUB</div>
            {myClub?(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <JerseySVG c={myClub} sz={52}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>{myClub.name}</div>
                    <div style={{color:"var(--mt)",fontSize:12}}>{myClub.fL==="FPL"?"🏆 Freedom Premier":myClub.fL==="FCH"?"🥈 Freedom Championship":"🥉 Freedom Challenger"}</div>
                    <div style={{fontFamily:"Orbitron",fontSize:12,color:"var(--pu2)",marginTop:2}}>{myClub.wins}W {myClub.draws}D {myClub.losses}L · {myClub.fp.pts}pts</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <button className="btn gn sm" onClick={()=>setView("match")}>⚽ Match</button>
                  <button className="btn pu sm" onClick={()=>setView("squad")}>👥 Squad</button>
                  <button className="btn gh sm" onClick={()=>setView("friendly")}>🤝 Friendly</button>
                  <button className="btn gh sm" onClick={endSeason} style={{borderColor:"var(--bgld)",color:"var(--gd)"}}>End Season</button>
                </div>
              </div>
            ):(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:38,marginBottom:8}}>🏟️</div>
                <div style={{color:"var(--mt)",marginBottom:12}}>No club owned yet</div>
                <button className="btn pu" onClick={()=>setView("clubs")}>Buy a Club</button>
              </div>
            )}
          </div>
          <div className="panel">
            <div className="pt">FREEDOM CUP</div>
            {G.cup.active?(
              <div>
                <div style={{fontFamily:"Orbitron",fontSize:13,color:"var(--gd)",marginBottom:8}}>
                  {G.cup.champion?`🏆 Champion: ${G.clubs.find(c=>c.id===G.cup.champion)?.name||"?"}`:`Round: ${G.cup.rounds[G.cup.round]?.name||"?"}`}
                </div>
                <div style={{color:"var(--mt)",fontSize:12,marginBottom:10}}>
                  {G.cup.rounds[G.cup.round]?.matches.filter(m=>m.winner).length||0}/{G.cup.rounds[G.cup.round]?.matches.length||0} matches played
                </div>
                <button className="btn gd sm" onClick={()=>setView("cup")}>View Cup →</button>
              </div>
            ):cupReady?(
              <div style={{textAlign:"center",padding:"10px 0"}}>
                <div style={{color:"var(--gn)",marginBottom:10}}>✅ 20+ clubs owned — Cup ready!</div>
                <button className="btn gd" onClick={startCup}>🏆 Start Freedom Cup</button>
              </div>
            ):(
              <div style={{color:"var(--mt)",fontSize:12}}>
                <div style={{marginBottom:8}}>Freedom Cup unlocks when 20+ clubs are owned by players.</div>
                <div style={{fontFamily:"Orbitron",fontSize:11,color:"var(--pu2)"}}>{humanClubs.length}/20 clubs owned</div>
                <div className="bw" style={{marginTop:8}}><div className="bf" style={{width:`${Math.min(100,(humanClubs.length/20)*100)}%`,background:"var(--pu)"}}/></div>
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="pt">TOKEN CONTRACT</div>
          <div className="g2">
            <div><div style={{fontSize:10,color:"var(--mt)",marginBottom:3}}>Token CA</div>
              <div style={{fontFamily:"monospace",fontSize:10,color:"var(--pu2)",wordBreak:"break-all"}}>{TCA}</div></div>
            <div><div style={{fontSize:10,color:"var(--mt)",marginBottom:3}}>Escrow Wallet</div>
              <div style={{fontFamily:"monospace",fontSize:10,color:"var(--gn)",wordBreak:"break-all"}}>{ESC}</div></div>
          </div>
        </div>
      </div>
    );
  };

  const Clubs=()=>{
    const lgs=[...new Set(G.clubs.map(c=>c.lg))].sort();
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Buy a Club</div>
        <div style={{color:"var(--mt)",marginBottom:14,fontSize:13}}>First 20 buyers → Freedom Premier · Next 20 → Championship · Next 20 → Challenger</div>
        <div className="tabs">{lgs.map(lg=><div key={lg} className={`tab ${lg===buyLg?"on":""}`} onClick={()=>setBuyLg(lg)}>{lg}</div>)}</div>
        <div className="g3">
          {G.clubs.filter(c=>c.lg===buyLg).map(club=>{
            const mine=club.id===G.myClubId;
            const owned=club.ownedBy==="player"&&!mine;
            return(
              <div key={club.id} className="ccard">
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <JerseySVG c={club} sz={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{club.name}</div>
                    <div style={{fontSize:10,color:"var(--mt)",marginTop:1}}>{club.fL==="FPL"?"🏆 Freedom Premier":club.fL==="FCH"?"🥈 Championship":"🥉 Challenger"}</div>
                    <div style={{fontFamily:"Orbitron",fontSize:11,color:"var(--gd)",marginTop:2}}>{ftf(club.price)} FT</div>
                  </div>
                  {mine&&<span className="tag gn" style={{fontSize:8}}>MINE</span>}
                  {owned&&<span className="tag rd" style={{fontSize:8}}>TAKEN</span>}
                </div>
                {!owned&&!mine&&<button className="btn pu sm" style={{width:"100%"}} disabled={!!G.myClubId||G.tokens<club.price} onClick={()=>buyClub(club)}>{G.tokens<club.price?"Insuf. FT":"Buy Club"}</button>}
                {mine&&<button className="btn gn sm" style={{width:"100%"}} onClick={()=>setView("squad")}>Manage →</button>}
                {owned&&<div style={{textAlign:"center",fontSize:11,color:"var(--mt)",padding:"4px 0"}}>Owned by player</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Squad=()=>{
    if(!myClub)return<div style={{textAlign:"center",padding:"40px 0"}}><button className="btn pu" onClick={()=>setView("clubs")}>Buy a Club First</button></div>;
    const sorted=[...myPls].sort((a,b)=>{const o={GK:0,CB:1,RB:2,LB:3,CDM:4,CM:5,CAM:6,LW:7,RW:8,ST:9};return(o[a.pos]||5)-(o[b.pos]||5);});
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <JerseySVG c={myClub} sz={50}/>
            <div><div className="h2">{myClub.name}</div><div style={{color:"var(--mt)",fontSize:13}}>{myPls.length} players · {myPls.filter(p=>!p.injured).length} fit</div></div>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button className="btn gh sm" onClick={()=>setView("market")}>Transfer Market</button>
            <button className="btn pu sm" onClick={()=>setView("create")}>+ Create</button>
          </div>
        </div>
        <div className="panel" style={{overflowX:"auto"}}>
          <table className="tbl">
            <thead><tr><th>POS</th><th>PLAYER</th><th>AGE</th><th>OVR</th><th style={{minWidth:90}}>COND</th><th style={{minWidth:90}}>MORALE</th><th>STATUS</th><th style={{minWidth:190}}>ACTIONS</th></tr></thead>
            <tbody>{sorted.map(p=>{
              const ovr=avg(p);
              return(
                <tr key={p.id}>
                  <td><span className={`bdg ${pcls(p.pos)}`}>{p.pos}</span></td>
                  <td style={{fontWeight:600}}>{p.name}{p.isCustom&&<span className="tag pu" style={{marginLeft:4,fontSize:8}}>C</span>}</td>
                  <td style={{color:"var(--mt)"}}>{p.age}</td>
                  <td><span style={{fontFamily:"Orbitron",fontWeight:700,color:ovr>=82?"var(--gn)":ovr>=72?"var(--pu2)":"var(--mt)"}}>{ovr}</span></td>
                  <td><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{flex:1}}><div className="bw"><div className="bf" style={{width:`${p.cond}%`,background:p.cond>60?"var(--gn2)":"var(--rd)"}}/></div></div><span style={{fontSize:10,color:"var(--mt)"}}>{p.cond}%</span></div></td>
                  <td><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{flex:1}}><div className="bw"><div className="bf" style={{width:`${p.morale}%`,background:"var(--pu)"}}/></div></div><span style={{fontSize:10,color:"var(--mt)"}}>{p.morale}%</span></div></td>
                  <td>{p.injured?<span className="tag rd">🤕 {p.injuryWeeks}w</span>:p.listed?<span className="tag gd">Listed</span>:<span className="tag gn">Fit</span>}</td>
                  <td><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {p.injured?<button className="btn rd sm" onClick={()=>healPlayer(p.id)}>Heal {ftf(p.injuryWeeks*50000)}</button>
                      :<button className="btn pu sm" disabled={p.trainings>=5} onClick={()=>trainPlayer(p.id)}>Train({p.trainings}/5)</button>}
                    {!p.listed?<div style={{display:"flex",gap:2}}>
                      <input className="inp" style={{width:72,padding:"3px 7px",fontSize:11}} type="number" placeholder="FT price" value={sqLP[p.id]||""} onChange={e=>setSqLP(x=>({...x,[p.id]:e.target.value}))}/>
                      <button className="btn gh sm" onClick={()=>{const pr=parseInt(sqLP[p.id]);if(!pr){notify("Enter price!","e");return;}listForSale(p.id,pr);}}>List</button>
                    </div>:<button className="btn gh sm" onClick={()=>delist(p.id)}>Delist</button>}
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const Training=()=>{
    if(!myClub)return<div style={{textAlign:"center",padding:"40px 0"}}><button className="btn pu" onClick={()=>setView("clubs")}>Buy a Club First</button></div>;
    const fit=myPls.filter(p=>!p.injured);
    const grpCosts={fitness:5000,skills:10000,tactics:8000};
    const doGroup=(type)=>{
      const cost=grpCosts[type]*fit.length;
      if(!spend(cost,`Group ${type} training`))return;
      setG(g=>({...g,players:g.players.map(p=>{
        if(p.clubId!==G.myClubId||p.injured)return p;
        if(type==="fitness")return{...p,cond:Math.min(100,p.cond+8)};
        if(type==="tactics")return{...p,morale:Math.min(100,p.morale+10)};
        const s={...p.stats};const k=Object.keys(s)[rnd(0,5)];s[k]=Math.min(99,s[k]+1);return{...p,stats:s};
      })}));
    };
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Training Center</div>
        <div style={{color:"var(--mt)",marginBottom:14,fontSize:13}}>1,000 FT/session · Max 5/week</div>
        <div className="g2" style={{marginBottom:14}}>
          <div className="panel">
            <div className="pt">GROUP TRAINING</div>
            <div style={{display:"flex",gap:7,marginBottom:12}}>
              {Object.entries(grpCosts).map(([t,c])=>(
                <button key={t} className="btn gh sm" style={{flex:1}} onClick={()=>doGroup(t)}>{t.toUpperCase()}<br/><span style={{fontSize:10,color:"var(--gd)"}}>{ftf(c*fit.length)}</span></button>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="pt">SQUAD CONDITION</div>
            {myPls.slice(0,10).map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                <span style={{minWidth:75,fontSize:11,fontWeight:600,color:p.injured?"var(--rd)":"var(--tx)"}}>{p.name.split(" ").pop()}</span>
                <div style={{flex:1}}><div className="bw"><div className="bf" style={{width:`${p.cond}%`,background:p.cond>60?"var(--gn2)":"var(--rd)"}}/></div></div>
                <span style={{fontSize:10,color:"var(--mt)",minWidth:24}}>{p.cond}%</span>
                {p.injured&&<span className="tag rd" style={{fontSize:8}}>INJ</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="pt">INDIVIDUAL TRAINING</div>
          <table className="tbl">
            <thead><tr><th>PLAYER</th><th>POS</th><th>OVR</th><th>SESSIONS</th><th>ACTION</th></tr></thead>
            <tbody>{myPls.map(p=>(
              <tr key={p.id}>
                <td style={{fontWeight:600}}>{p.name}</td>
                <td><span className={`bdg ${pcls(p.pos)}`}>{p.pos}</span></td>
                <td style={{fontFamily:"Orbitron",fontWeight:700}}>{avg(p)}</td>
                <td><div style={{display:"flex",gap:2}}>{[...Array(5)].map((_,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:i<p.trainings?"var(--pu)":"rgba(255,255,255,.08)"}}/>)}</div></td>
                <td><button className="btn pu sm" disabled={p.injured||p.trainings>=5||G.tokens<1000} onClick={()=>trainPlayer(p.id)}>{p.injured?"🤕":p.trainings>=5?"Max":"Train"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const Strategy=()=>{
    if(!myClub)return<div style={{textAlign:"center",padding:"40px 0"}}><button className="btn pu" onClick={()=>setView("clubs")}>Buy a Club First</button></div>;
    return(
      <div>
        <div className="h2" style={{marginBottom:14}}>Strategy & Tactics</div>
        <div className="g2" style={{marginBottom:12}}>
          <div className="panel"><div className="pt">FORMATION</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{FMTNS.map(f=><div key={f} className={`pill ${strat.fm===f?"on":""}`} onClick={()=>setStrat(s=>({...s,fm:f}))}>{f}</div>)}</div>
          </div>
          <div className="panel"><div className="pt">TACTICS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{TACS.map(t=><div key={t} className={`pill ${strat.tac===t?"on":""}`} onClick={()=>setStrat(s=>({...s,tac:t}))}>{t}</div>)}</div>
          </div>
        </div>
        <div className="panel" style={{marginBottom:12}}>
          <div className="pt">PRE-MATCH MOTIVATION</div>
          <div className="g4">{MOTIVS.map(m=>(
            <div key={m.l} onClick={()=>setStrat(s=>({...s,mot:m.l}))} style={{padding:"12px",borderRadius:"10px",cursor:"pointer",border:`1px solid ${strat.mot===m.l?"var(--pu)":"var(--brd)"}`,background:strat.mot===m.l?"rgba(168,85,247,.12)":"var(--p)",transition:"all .15s"}}>
              <div style={{fontFamily:"Orbitron",fontSize:10,fontWeight:700,color:strat.mot===m.l?"var(--pu2)":"var(--tx)",marginBottom:6}}>{m.l}</div>
              <div style={{color:"var(--gn)",fontSize:12,marginBottom:2}}>+{m.b} boost</div>
              <div style={{color:m.cost?"var(--gd)":"var(--mt)",fontSize:10,fontFamily:"Orbitron"}}>{m.cost?`${ftf(m.cost)} FT`:"Free"}</div>
            </div>
          ))}</div>
        </div>
        <div className="panel">
          <div className="pt">SUBSTITUTION SCENARIOS (MAX 3 SUBS)</div>
          {["Always","If Winning","If Losing","If Drawing"].map((sc,i)=>(
            <div key={sc} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span className="tag pu" style={{minWidth:85,textAlign:"center",fontSize:10}}>{sc}</span>
              <select className="sel" style={{flex:1}}><option>Player OUT</option>{myPls.map(p=><option key={p.id}>{p.name} ({p.pos})</option>)}</select>
              <span style={{color:"var(--mt)"}}>→</span>
              <select className="sel" style={{flex:1}}><option>Player IN</option>{myPls.map(p=><option key={p.id}>{p.name} ({p.pos})</option>)}</select>
              <span className={`tag ${i<3?"gn":"rd"}`} style={{fontSize:8}}>SUB {i+1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StadiumV=()=>{
    const curr=STADIA[stad],next=stad<STADIA.length-1?STADIA[stad+1]:null;
    return(
      <div>
        <div className="h2" style={{marginBottom:14}}>Stadium Manager</div>
        <div className="g2" style={{marginBottom:14}}>
          <div className="panel gn">
            <div className="pt">CURRENT STADIUM</div>
            <div style={{fontFamily:"Orbitron",fontSize:17,fontWeight:700,marginBottom:10}}>{curr.n}</div>
            <div className="g2" style={{marginBottom:10}}>
              <div><div className="sl">CAPACITY</div><div className="sv gn">{curr.cap.toLocaleString()}</div></div>
              <div><div className="sl">WIN INCOME</div><div className="sv gd">{ftf(curr.inc)} FT</div></div>
            </div>
            <div style={{fontSize:11,color:"var(--mt)"}}>Tier {stad+1}/{STADIA.length}</div>
          </div>
          {next?<div className="panel gd">
            <div className="pt">NEXT UPGRADE</div>
            <div style={{fontFamily:"Orbitron",fontSize:17,fontWeight:700,marginBottom:10}}>{next.n}</div>
            <div className="g2" style={{marginBottom:12}}>
              <div><div className="sl">CAPACITY</div><div className="sv gn">{next.cap.toLocaleString()}</div></div>
              <div><div className="sl">WIN INCOME</div><div className="sv gd">{ftf(next.inc)} FT</div></div>
            </div>
            <div style={{fontFamily:"Orbitron",fontSize:13,color:"var(--gd)",marginBottom:10}}>Cost: {ftf(next.cost)} FT</div>
            <button className="btn gd" disabled={G.tokens<next.cost} onClick={()=>{if(spend(next.cost,`Stadium → ${next.n}`))setStad(s=>s+1);}}>Upgrade</button>
          </div>:<div className="panel gd" style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
            <div style={{fontSize:36,marginBottom:8}}>🏆</div>
            <div style={{fontFamily:"Orbitron",fontSize:12,color:"var(--gd)"}}>MAX TIER</div>
          </div>}
        </div>
        <div className="panel">
          <div className="pt">UPGRADE PATH</div>
          <div style={{display:"flex",overflowX:"auto",gap:8,paddingBottom:8}}>
            {STADIA.map((s,i)=>(
              <div key={i} style={{flex:"0 0 140px",padding:"12px",borderRadius:"10px",
                background:i===stad?"rgba(168,85,247,.14)":i<stad?"rgba(74,222,128,.06)":"var(--p)",
                border:`1px solid ${i===stad?"var(--pu)":i<stad?"var(--bgrn)":"var(--brd)"}`}}>
                <div style={{fontFamily:"Orbitron",fontSize:8,color:i<=stad?"var(--gn)":"var(--mt)",marginBottom:3,letterSpacing:1}}>T{i+1}{i===stad?" ← NOW":i<stad?" ✓":""}</div>
                <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>{s.n}</div>
                <div style={{fontSize:11,color:"var(--mt)"}}>{s.cap.toLocaleString()} cap</div>
                <div style={{fontSize:11,color:"var(--gd)"}}>{ftf(s.inc)} FT/win</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Match=()=>{
    if(!myClub)return<div style={{textAlign:"center",padding:"40px 0"}}><button className="btn pu" onClick={()=>setView("clubs")}>Buy a Club First</button></div>;
    const opps=G.clubs.filter(c=>c.id!==G.myClubId);
    const oppClub=match?G.clubs.find(c=>c.id===match.oppId):null;
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Match Center</div>
        <div style={{color:"var(--mt)",marginBottom:14,fontSize:13}}>Formation: {strat.fm} · Tactics: {strat.tac}</div>
        {(!match||!match.playing)&&(
          <div className="panel" style={{marginBottom:14}}>
            <div className="pt">PRE-MATCH SETUP</div>
            <div style={{display:"flex",gap:9,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:2,minWidth:180}}>
                <div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:5}}>OPPONENT</div>
                <select className="sel" style={{width:"100%"}} value={selOpp} onChange={e=>setSelOpp(e.target.value)}>
                  <option value="">— Choose opponent —</option>
                  {opps.map(c=><option key={c.id} value={c.id}>{c.name} ({c.fL})</option>)}
                </select>
              </div>
              <div style={{flex:1,minWidth:130}}>
                <div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:5}}>MOTIVATION</div>
                <select className="sel" value={strat.mot} onChange={e=>setStrat(s=>({...s,mot:e.target.value}))}>
                  {MOTIVS.map(m=><option key={m.l} value={m.l}>{m.l}{m.cost?` (${ftf(m.cost)} FT)`:""}</option>)}
                </select>
              </div>
              <button className="btn gn" disabled={!selOpp} onClick={()=>playMatch(selOpp)}>⚽ Kick Off!</button>
            </div>
          </div>
        )}
        {match&&(
          <div>
            <div className="g2" style={{marginBottom:12}}>
              <div className="panel gn" style={{textAlign:"center"}}>
                {match.playing&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:8}}><div className="ld"/><span style={{fontFamily:"Orbitron",fontSize:10,color:"var(--rd)",letterSpacing:1}}>LIVE {match.m}'</span></div>}
                {!match.playing&&match.m>=90&&<div style={{fontFamily:"Orbitron",fontSize:10,color:"var(--gd)",marginBottom:8,letterSpacing:1}}>FULL TIME</div>}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
                  <div>
                    <div style={{marginBottom:4}}><JerseySVG c={myClub} sz={36}/></div>
                    <div style={{fontFamily:"Orbitron",fontSize:9,color:"var(--mt)"}}>{myClub.abbr}</div>
                    <div className="score" style={{color:match.mySc>match.oppSc?"var(--gn)":match.mySc<match.oppSc?"var(--rd)":"var(--tx)"}}>{match.mySc}</div>
                  </div>
                  <div style={{fontFamily:"Orbitron",fontSize:20,color:"var(--mt)"}}>—</div>
                  <div>
                    {oppClub&&<div style={{marginBottom:4}}><JerseySVG c={oppClub} sz={36}/></div>}
                    <div style={{fontFamily:"Orbitron",fontSize:9,color:"var(--mt)"}}>{oppClub?.abbr||"OPP"}</div>
                    <div className="score" style={{color:match.oppSc>match.mySc?"var(--rd)":match.oppSc<match.mySc?"var(--gn)":"var(--tx)"}}>{match.oppSc}</div>
                  </div>
                </div>
                {match.playing&&<div style={{marginTop:10,padding:"0 8px"}}>
                  <div className="bw" style={{height:3}}><div className="bf" style={{width:`${(match.m/90)*100}%`,background:"linear-gradient(90deg,var(--pu2),var(--gn))"}}/></div>
                  <div style={{fontSize:9,color:"var(--mt)",marginTop:2,fontFamily:"Orbitron"}}>{match.m}' / 90'</div>
                </div>}
                {!match.playing&&match.m>=90&&<button className="btn pu sm" style={{marginTop:10}} onClick={()=>{setMatch(null);setSelOpp("");}}>New Match</button>}
              </div>
              <div className="pitch"><PitchSVG ms={match}/></div>
            </div>
            <div className="panel">
              <div className="pt">MATCH EVENTS</div>
              <div style={{maxHeight:170,overflowY:"auto"}}>
                {match.log.map((ev,i)=><div key={i} className={`mev ${ev.t}`}><span style={{fontFamily:"Orbitron",fontSize:8,color:"var(--mt)",marginRight:6}}>{ev.m}'</span>{ev.txt}</div>)}
                {!match.log.length&&<div style={{color:"var(--mt)",fontSize:13}}>Starting…</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const League=()=>{
    const tierData=G.clubs.filter(c=>c.fL===lgTab).sort((a,b)=>b.fp.pts-a.fp.pts||(b.fp.gf-b.fp.ga)-(a.fp.gf-a.fp.ga));
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Freedom Leagues</div>
        <div style={{color:"var(--mt)",marginBottom:14,fontSize:13}}>Season {G.season} · Top 4 promote · Bottom 4 relegate · Season winner takes prize pool</div>
        <div className="tabs">
          {["FPL","FCH","FCL"].map(t=><div key={t} className={`tab ${lgTab===t?"on":""}`} onClick={()=>setLgTab(t)}>
            {t==="FPL"?"🏆 Freedom Premier":t==="FCH"?"🥈 Championship":"🥉 Challenger"}
          </div>)}
        </div>
        <div style={{background:"rgba(74,222,128,.04)",border:"1px solid var(--bgrn)",borderRadius:8,padding:"6px 10px",marginBottom:10,fontSize:11,color:"var(--gn)"}}>
          🏆 Top 4 qualify for {lgTab==="FCL"?"Championship":lgTab==="FCH"?"Freedom Premier":"UEFA equivalent"} · Bottom 4 relegate to {lgTab==="FPL"?"Championship":lgTab==="FCH"?"Challenger":"—"}
        </div>
        <div className="panel" style={{overflowX:"auto"}}>
          <table className="tbl">
            <thead><tr><th>#</th><th>CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th><th>STATUS</th></tr></thead>
            <tbody>{tierData.map((c,i)=>(
              <tr key={c.id} className={`${c.id===G.myClubId?"lgme":""}${i<4?" fz":""}${i>=tierData.length-4?" rz":""}`}>
                <td style={{fontFamily:"Orbitron",fontWeight:700,color:i===0?"var(--gd)":"var(--tx)"}}>{i+1}</td>
                <td><div style={{display:"flex",alignItems:"center",gap:8}}>
                  <JerseySVG c={c} sz={24}/>
                  <span style={{fontWeight:600}}>{c.name}</span>
                  {c.id===G.myClubId&&<span className="tag gn" style={{fontSize:8}}>YOU</span>}
                </div></td>
                <td style={{color:"var(--mt)"}}>{c.fp.w+c.fp.d+c.fp.l}</td>
                <td>{c.fp.w}</td><td>{c.fp.d}</td><td>{c.fp.l}</td>
                <td>{c.fp.gf}</td><td>{c.fp.ga}</td>
                <td style={{color:(c.fp.gf-c.fp.ga)>0?"var(--gn)":(c.fp.gf-c.fp.ga)<0?"var(--rd)":"var(--mt)"}}>{c.fp.gf-c.fp.ga>0?"+":""}{c.fp.gf-c.fp.ga}</td>
                <td style={{fontFamily:"Orbitron",fontWeight:700,color:"var(--pu2)"}}>{c.fp.pts}</td>
                <td><span className={`tag ${c.ownedBy==="player"?"gn":"pu"}`} style={{fontSize:8}}>{c.ownedBy==="player"?"Human":"Bot"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="g2" style={{marginTop:12}}>
          <div style={{fontSize:11,display:"flex",gap:5,alignItems:"center",color:"var(--gn)"}}><div style={{width:12,height:12,background:"rgba(74,222,128,.2)",border:"1px solid var(--gn)",borderRadius:2}}/> Promotion zone (top 4)</div>
          <div style={{fontSize:11,display:"flex",gap:5,alignItems:"center",color:"var(--rd)"}}><div style={{width:12,height:12,background:"rgba(248,113,113,.2)",border:"1px solid var(--rd)",borderRadius:2}}/> Relegation zone (bottom 4)</div>
        </div>
      </div>
    );
  };

  const Cup=()=>{
    const humanClubs=G.clubs.filter(c=>c.ownedBy==="player");
    if(!G.cup.active)return(
      <div>
        <div className="h2" style={{marginBottom:14}}>Freedom Cup</div>
        <div className="panel" style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:48,marginBottom:12}}>🏆</div>
          <div style={{fontFamily:"Orbitron",fontSize:16,marginBottom:8}}>Freedom Cup</div>
          <div style={{color:"var(--mt)",marginBottom:20}}>Unlocks when 20+ clubs are owned by players<br/>64-club knockout tournament · Two-legged ties · Home & away</div>
          <div className="bw" style={{marginBottom:16,maxWidth:300,margin:"0 auto 16px"}}><div className="bf" style={{width:`${Math.min(100,(humanClubs.length/20)*100)}%`,background:"var(--pu)"}}/></div>
          <div style={{fontFamily:"Orbitron",fontSize:12,color:"var(--pu2)",marginBottom:20}}>{humanClubs.length}/20 clubs owned</div>
          {humanClubs.length>=20?<button className="btn gd" onClick={startCup}>🏆 Launch Freedom Cup</button>:<button className="btn gh" disabled>Waiting for more managers…</button>}
        </div>
      </div>
    );
    const curr=G.cup.rounds[G.cup.round]||G.cup.rounds[G.cup.rounds.length-1];
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div className="h2">Freedom Cup</div>
            <div style={{color:"var(--mt)",fontSize:13}}>{curr?.name} · Season {G.season}</div>
          </div>
          {!G.cup.champion&&<button className="btn gd sm" onClick={simCupRound}>Sim All Bot Matches →</button>}
        </div>
        {G.cup.champion&&(
          <div className="panel gd" style={{textAlign:"center",marginBottom:14,padding:"20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>🏆</div>
            <div style={{fontFamily:"Orbitron",fontSize:18,fontWeight:700,color:"var(--gd)"}}>FREEDOM CUP CHAMPION</div>
            <div style={{fontFamily:"Orbitron",fontSize:22,fontWeight:900,color:"var(--tx)",marginTop:6}}>
              {G.clubs.find(c=>c.id===G.cup.champion)?.name||"Unknown"}
            </div>
          </div>
        )}
        <div className="tabs">{G.cup.rounds.filter(r=>r.matches.length>0).map((r,i)=>(
          <div key={i} className={`tab ${i===G.cup.round?"on":""}`} onClick={()=>setMatch(null)}>{r.name}</div>
        ))}</div>
        <div className="panel" style={{overflowX:"auto"}}>
          {curr?.matches.slice(0,32).map((m,i)=>{
            const hC=G.clubs.find(c=>c.id===m.h);const aC=G.clubs.find(c=>c.id===m.a);
            const me=m.h===G.myClubId||m.a===G.myClubId;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:7,justifyContent:"flex-end"}}>
                  {hC&&<JerseySVG c={hC} sz={24}/>}
                  <span style={{fontSize:12,fontWeight:m.winner===m.h?700:400,color:m.winner===m.h?"var(--gn)":m.winner===m.a?"var(--mt)":"var(--tx)"}}>{hC?.name||"?"}</span>
                </div>
                <div style={{textAlign:"center",minWidth:90}}>
                  {m.winner?<div>
                    <div style={{fontFamily:"Orbitron",fontSize:11,fontWeight:700}}>{m.hS1}-{m.aS1} / {m.hS2}-{m.aS2}</div>
                    <div style={{fontSize:9,color:"var(--mt)"}}>Agg: {(m.hS1||0)+(m.aS2||0)}-{(m.aS1||0)+(m.hS2||0)}</div>
                  </div>:<div>
                    {me?<button className="btn pu sm" onClick={()=>{setSelOpp(m.h===G.myClubId?m.a:m.h);setView("match");}}>Play Match!</button>
                      :<span style={{fontFamily:"Orbitron",fontSize:9,color:"var(--mt)"}}>UPCOMING</span>}
                  </div>}
                </div>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:12,fontWeight:m.winner===m.a?700:400,color:m.winner===m.a?"var(--gn)":m.winner===m.h?"var(--mt)":"var(--tx)"}}>{aC?.name||"?"}</span>
                  {aC&&<JerseySVG c={aC} sz={24}/>}
                </div>
                {m.winner&&<span className={`tag ${m.winner===G.myClubId?"gn":"pu"}`} style={{fontSize:8,minWidth:40,textAlign:"center"}}>{m.winner===G.myClubId?"YOU WIN":m.winner===G.myClubId||"BOT"}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Friendly=()=>{
    const opps=G.clubs.filter(c=>c.id!==G.myClubId&&c.ownedBy==="player");
    const hist=G.friendlyHistory||[];
    if(!myClub)return<div style={{textAlign:"center",padding:"40px 0"}}><button className="btn pu" onClick={()=>setView("clubs")}>Buy a Club First</button></div>;
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Friendly Matches</div>
        <div style={{color:"var(--mt)",marginBottom:14,fontSize:13}}>Challenge other managers · Bet FREEDOM tokens · 10% fee to prize pool</div>
        <div className="g2" style={{marginBottom:14}}>
          <div className="panel">
            <div className="pt">CHALLENGE A MANAGER</div>
            {opps.length>0?(
              <div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:5}}>OPPONENT</div>
                  <select className="sel" style={{width:"100%"}} value={frOpp} onChange={e=>setFrOpp(e.target.value)}>
                    <option value="">— Select opponent —</option>
                    {opps.map(c=>{
                      const rating=Math.round(tR(G.players.filter(p=>p.clubId===c.id)));
                      return<option key={c.id} value={c.id}>{c.name} (Rating: {rating})</option>;
                    })}
                  </select>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:5}}>BET AMOUNT (FT)</div>
                  <input className="inp" style={{width:"100%"}} type="number" min="1000" value={frBet} onChange={e=>setFrBet(e.target.value)} placeholder="Min 1,000 FT"/>
                  <div style={{fontSize:10,color:"var(--mt)",marginTop:4}}>Win: +{ftf(Math.floor((parseInt(frBet)||0)*.9))} FT · Loss: -{ftf(parseInt(frBet)||0)} FT · Draw: 0</div>
                </div>
                <button className="btn gn" disabled={!frOpp||G.tokens<(parseInt(frBet)||0)} onClick={()=>{setFrRes(null);playFriendly();}}>🤝 Play Friendly</button>
              </div>
            ):(
              <div style={{color:"var(--mt)",textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:28,marginBottom:8}}>👥</div>
                No other managers yet. More clubs need to be purchased.
              </div>
            )}
          </div>
          {frRes&&(
            <div className={`panel ${frRes.won?"gn":"gd"}`} style={{textAlign:"center"}}>
              <div style={{fontSize:38,marginBottom:8}}>{frRes.won?"🎉":frRes.draw?"🤝":"😤"}</div>
              <div style={{fontFamily:"Orbitron",fontSize:16,fontWeight:700,marginBottom:8,color:frRes.won?"var(--gn)":frRes.draw?"var(--gd)":"var(--rd)"}}>
                {frRes.won?"VICTORY":frRes.draw?"DRAW":"DEFEAT"}
              </div>
              <div style={{fontFamily:"Orbitron",fontSize:22,fontWeight:900,marginBottom:6,color:frRes.won?"var(--gn)":"var(--tx)"}}>{frRes.h} — {frRes.a}</div>
              {frRes.net!==0&&<div style={{fontFamily:"Orbitron",fontSize:14,color:frRes.net>0?"var(--gd)":"var(--rd)"}}>{frRes.net>0?"+":""}{ftf(frRes.net)} FT</div>}
            </div>
          )}
        </div>
        {hist.length>0&&(
          <div className="panel">
            <div className="pt">FRIENDLY HISTORY</div>
            <table className="tbl">
              <thead><tr><th>DATE</th><th>OPPONENT</th><th>RESULT</th><th>TOKENS</th></tr></thead>
              <tbody>{hist.map((h,i)=>{
                const opp=G.clubs.find(c=>c.id===h.opp);
                const won=h.h>h.a,draw=h.h===h.a;
                return(
                  <tr key={i}>
                    <td style={{color:"var(--mt)"}}>{h.date}</td>
                    <td>{opp?.name||"Unknown"}</td>
                    <td><span className={`tag ${won?"gn":draw?"gd":"rd"}`}>{h.h}-{h.a} {won?"W":draw?"D":"L"}</span></td>
                    <td style={{fontFamily:"Orbitron",fontSize:11,color:h.net>0?"var(--gn)":h.net<0?"var(--rd)":"var(--mt)"}}>{h.net>0?"+":""}{ftf(h.net)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const Market=()=>{
    let disp=[];
    if(mktTab==="listed")disp=listedPls;
    else if(mktTab==="free")disp=freePls;
    else if(mktTab==="all")disp=G.players.filter(p=>p.clubId!==G.myClubId);
    else disp=myPls;
    const positions=["All","GK","CB","RB","LB","CDM","CM","CAM","LW","RW","ST"];
    if(mktF.pos!=="All")disp=disp.filter(p=>p.pos===mktF.pos);
    if(mktF.q)disp=disp.filter(p=>p.name.toLowerCase().includes(mktF.q.toLowerCase()));
    if(mktF.maxPr)disp=disp.filter(p=>(p.listed?p.listPrice:p.price)<=parseInt(mktF.maxPr));
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Transfer Market</div>
        <div style={{color:"var(--mt)",marginBottom:12,fontSize:13}}>{freePls.length} world stars available · 10% fee to prize pool</div>
        <div className="tabs">
          {[["free","🌍 World Stars"],["listed","Listed"],["all","All Players"],["mine","My Players"]].map(([k,l])=>(
            <div key={k} className={`tab ${mktTab===k?"on":""}`} onClick={()=>setMktTab(k)}>{l}</div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <select className="sel" value={mktF.pos} onChange={e=>setMktF(f=>({...f,pos:e.target.value}))}>{positions.map(p=><option key={p}>{p}</option>)}</select>
          <input className="inp" placeholder="Search player…" value={mktF.q} onChange={e=>setMktF(f=>({...f,q:e.target.value}))} style={{flex:1,minWidth:130}}/>
          <input className="inp" placeholder="Max FT price" type="number" value={mktF.maxPr} onChange={e=>setMktF(f=>({...f,maxPr:e.target.value}))} style={{width:120}}/>
        </div>
        <div className="panel" style={{overflowX:"auto"}}>
          <table className="tbl">
            <thead><tr><th>POS</th><th>PLAYER</th><th>CLUB</th><th>AGE</th><th>OVR</th><th>VAL</th><th>FT PRICE</th><th>STATUS</th><th style={{minWidth:160}}>ACTION</th></tr></thead>
            <tbody>{disp.slice(0,60).map(p=>{
              const club=G.clubs.find(c=>c.id===p.clubId);
              const cost=p.listed?p.listPrice:p.price;
              const isMine=p.clubId===G.myClubId;
              const ovr=avg(p);
              return(
                <tr key={p.id}>
                  <td><span className={`bdg ${pcls(p.pos)}`}>{p.pos}</span></td>
                  <td style={{fontWeight:600}}>{p.name}{p.isCustom&&<span className="tag pu" style={{marginLeft:3,fontSize:8}}>C</span>}</td>
                  <td style={{color:"var(--mt)",fontSize:11}}>{club?.abbr||"FREE"}</td>
                  <td style={{color:"var(--mt)"}}>{p.age}</td>
                  <td><span style={{fontFamily:"Orbitron",fontWeight:700,color:ovr>=82?"var(--gn)":ovr>=72?"var(--pu2)":"var(--mt)"}}>{ovr}</span></td>
                  <td style={{color:"var(--mt)",fontSize:11}}>${(p.val/1e6).toFixed(0)}M</td>
                  <td style={{fontFamily:"Orbitron",fontSize:11,color:"var(--gd)"}}>{ftf(cost)}</td>
                  <td>{p.listed?<span className="tag gd">Listed</span>:p.injured?<span className="tag rd">INJ</span>:p.clubId==="free"?<span className="tag pu">Free</span>:<span className="tag gn">Avail</span>}</td>
                  <td>{isMine?(
                    <div style={{display:"flex",gap:3}}>
                      {!p.listed?<><input className="inp" style={{width:65,padding:"3px 6px",fontSize:10}} type="number" placeholder="FT" value={mkLP[p.id]||""} onChange={e=>setMkLP(x=>({...x,[p.id]:e.target.value}))}/>
                        <button className="btn gh sm" onClick={()=>{const pr=parseInt(mkLP[p.id]);if(!pr){notify("Enter price!","e");return;}listForSale(p.id,pr);}}>List</button></>
                        :<button className="btn gh sm" onClick={()=>delist(p.id)}>Delist</button>}
                    </div>
                  ):G.myClubId?(
                    <button className="btn gn sm" disabled={G.tokens<cost} onClick={()=>buyPlayer(p)}>Buy {ftf(cost)}</button>
                  ):<span style={{color:"var(--mt)",fontSize:10}}>Buy club first</span>}
                  </td>
                </tr>
              );
            })}
            {!disp.length&&<tr><td colSpan={9} style={{textAlign:"center",color:"var(--mt)",padding:20}}>No players found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const Create=()=>{
    const preview=cf.name?{stats:(()=>{const r=clamp(Math.floor((parseFloat(cf.vM)||30)*.33+62),60,93),v=d=>clamp(r+d+rnd(-3,3),40,99);const pos=cf.pos;if(pos==="GK")return{PAC:v(-18),SHO:v(-35),PAS:v(-8),DRI:v(-12),DEF:v(-5),PHY:v(2)};if(pos==="CB")return{PAC:v(-5),SHO:v(-20),PAS:v(-2),DRI:v(-8),DEF:v(8),PHY:v(6)};if(["RB","LB"].includes(pos))return{PAC:v(2),SHO:v(-15),PAS:v(3),DRI:v(0),DEF:v(5),PHY:v(3)};if(["LW","RW"].includes(pos))return{PAC:v(8),SHO:v(4),PAS:v(2),DRI:v(8),DEF:v(-18),PHY:v(-2)};return{PAC:v(4),SHO:v(8),PAS:v(0),DRI:v(4),DEF:v(-20),PHY:v(2)};})()}:null;
    const doCreate=()=>{
      if(!cf.name.trim()){notify("Enter player name!","e");return;}
      if(!G.myClubId){notify("Buy a club first!","e");return;}
      if(myPls.length>=22){notify("Squad full!","e");return;}
      if(!spend(50000,`Created: ${cf.name}`))return;
      const np=mkP(cf.name,cf.pos,parseFloat(cf.vM)||30,G.myClubId,true);
      np.age=parseInt(cf.age)||24;
      setG(g=>({...g,players:[...g.players,np]}));
      setCf({name:"",pos:"ST",age:"24",vM:"30"});
    };
    const prvAvg=preview?Math.round(Object.values(preview.stats).reduce((s,x)=>s+x,0)/6):0;
    return(
      <div>
        <div className="h2" style={{marginBottom:3}}>Create Custom Player</div>
        <div style={{color:"var(--mt)",marginBottom:14,fontSize:13}}>Design a custom player — 50,000 FT</div>
        <div className="g2">
          <div className="panel">
            <div className="pt">PLAYER DETAILS</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div><div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:4}}>FULL NAME</div>
                <input className="inp" style={{width:"100%"}} value={cf.name} onChange={e=>setCf(f=>({...f,name:e.target.value}))} placeholder="Player name"/></div>
              <div><div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:4}}>POSITION</div>
                <select className="sel" style={{width:"100%"}} value={cf.pos} onChange={e=>setCf(f=>({...f,pos:e.target.value}))}>
                  {["GK","CB","RB","LB","CDM","CM","CAM","LW","RW","ST"].map(p=><option key={p}>{p}</option>)}
                </select></div>
              <div><div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:4}}>AGE</div>
                <input className="inp" style={{width:"100%"}} type="number" value={cf.age} onChange={e=>setCf(f=>({...f,age:e.target.value}))} min="16" max="45"/></div>
              <div><div style={{fontSize:9,color:"var(--mt)",fontFamily:"Orbitron",letterSpacing:1,marginBottom:4}}>MARKET VALUE ($M)</div>
                <input className="inp" style={{width:"100%"}} type="number" value={cf.vM} onChange={e=>setCf(f=>({...f,vM:e.target.value}))} min="1" max="500"/></div>
              <button className="btn pu" onClick={doCreate} disabled={!G.myClubId||G.tokens<50000}>Create — 50,000 FT</button>
            </div>
          </div>
          <div className="panel">
            <div className="pt">PREVIEW</div>
            {preview?(
              <div>
                <div style={{fontFamily:"Orbitron",fontSize:20,fontWeight:900,marginBottom:4}}>{cf.name||"Preview"}</div>
                <div style={{display:"flex",gap:7,marginBottom:12,alignItems:"center"}}>
                  <span className={`bdg ${pcls(cf.pos)}`}>{cf.pos}</span>
                  <span style={{color:"var(--mt)"}}>Age {cf.age}</span>
                </div>
                <div style={{fontFamily:"Orbitron",fontSize:32,fontWeight:900,color:prvAvg>=82?"var(--gn)":prvAvg>=72?"var(--pu2)":"var(--mt)",marginBottom:12}}>{prvAvg}</div>
                {Object.entries(preview.stats).map(([k,v])=>(
                  <div key={k} style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
                      <span style={{color:"var(--mt)",fontFamily:"Orbitron",fontSize:8}}>{k}</span>
                      <span style={{fontWeight:700}}>{v}</span>
                    </div>
                    <div className="bw"><div className="bf" style={{width:`${v}%`,background:"var(--pu)"}}/></div>
                  </div>
                ))}
              </div>
            ):(
              <div style={{color:"var(--mt)",textAlign:"center",padding:"30px 0"}}>Enter name to preview</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const views={dash:<Dash/>,clubs:<Clubs/>,squad:<Squad/>,training:<Training/>,strategy:<Strategy/>,stadium:<StadiumV/>,match:<Match/>,league:<League/>,cup:<Cup/>,friendly:<Friendly/>,market:<Market/>,create:<Create/>};

  return(
    <div className="app">
      <div className="hdr">
        <div>
          <div className="logo">PROJECT FREEDOM FOOTBALL FANTASY</div>
          <div className="lsub">YOU'RE NOT JUST A FAN. YOU'RE IN COMMAND.</div>
        </div>
        <div className="hr">
          <div className="chip gd">🏆 {ftf(G.tokens)} FT</div>
          <div className="chip pu">🏅 {ftf(G.prizePool)} FT</div>
          <div className={`wbtn ${wallet.on?"on":""}`} onClick={async()=>{
            const sol=window.solana;
            if(!sol?.isPhantom){notify("Phantom not found — connect on deployed site!","e");return;}
            try{const r=await sol.connect();setWallet({on:true,addr:r.publicKey.toString()});notify("Wallet connected!","s");}catch(e){notify("Cancelled","i");}
          }}>{wallet.on?`✓ ${wallet.addr?.slice(0,6)}…`:"🔗 Connect Phantom"}</div>
        </div>
      </div>
      <div className="lay">
        <div className="sb">
          <div className="sep">MAIN</div>
          {NAVS.slice(0,2).map(n=><div key={n.id} className={`nav ${view===n.id?"on":""}`} onClick={()=>setView(n.id)}>{n.ico} {n.l}</div>)}
          <div className="sep">MANAGEMENT</div>
          {NAVS.slice(2,6).map(n=><div key={n.id} className={`nav ${view===n.id?"on":""}`} onClick={()=>setView(n.id)}>{n.ico} {n.l}</div>)}
          <div className="sep">COMPETE</div>
          {NAVS.slice(6).map(n=><div key={n.id} className={`nav ${view===n.id?"on":""}`} onClick={()=>setView(n.id)}>{n.ico} {n.l}</div>)}
          {myClub&&(
            <div className="cbbadge">
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <JerseySVG c={myClub} sz={32}/>
                <div>
                  <div style={{fontFamily:"Orbitron",fontWeight:700,fontSize:11}}>{myClub.abbr}</div>
                  <div style={{fontSize:10,color:"var(--mt)"}}>{myClub.fp.pts}pts</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="main">{views[view]||<Dash/>}</div>
      </div>
      <div className="ftr">
        <span style={{color:"var(--mt)"}}>POWERED BY </span>
        <span style={{background:"linear-gradient(90deg,var(--pu2),var(--gn))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>DEGENSAFE.FUN</span>
        <span style={{color:"var(--mt)"}}> · FREEDOM TOKEN · SOLANA</span>
      </div>
      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
