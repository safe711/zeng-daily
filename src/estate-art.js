import {loadOriginalImage} from './estate-original-image-cache.js';
import {LOUNGE_CHAIRS} from './estate-lounge.js';
import {ESTATE_CATALOG} from './model.js';
export const ESTATE_SITES={"bedroom":[{"id":"door","name":"卧室房门","x":104,"y":215},{"id":"wardrobe","name":"衣柜","x":185,"y":245},{"id":"desk","name":"书案","x":306,"y":257},{"id":"bed","name":"床榻","x":517,"y":261},{"id":"display","name":"礼物展示柜","x":402,"y":232}],"courtyard":[{"id":"door","name":"府邸大门","x":80,"y":238},{"id":"tree","name":"庭院古树","x":249,"y":244},{"id":"kennel","name":"狗窝","x":447,"y":249},{"id":"fence","name":"木栅栏","x":597,"y":237},{"id":"bowl","name":"狗盆","x":367,"y":259},{"id":"plate","name":"供盘","x":314,"y":258},{"id":"toy","name":"礼物玩具","x":513,"y":260}],"shrine":[{"id":"door","name":"祠堂侧门","x":77,"y":255},{"id":"altar","name":"祭坛","x":344,"y":211},{"id":"prayer","name":"祈愿蒲团","x":333,"y":271},{"id":"plate","name":"供盘","x":402,"y":268},{"id":"candle","name":"烛台","x":167,"y":245}]};

ESTATE_SITES.lounge=[{id:'door',name:'休息室入口',x:42,y:267},...LOUNGE_CHAIRS.map(chair=>({id:chair.id,name:chair.name,x:chair.x,y:chair.y-15}))];
// Load original scene paintings once; retain the lightweight drawing while loading.
const scenePaintings={};
export const hasEstateBackground=scene=>!!scenePaintings[scene];
export const estateBackgroundReady=typeof Image==='undefined'?Promise.resolve([]):Promise.all(['bedroom','courtyard','shrine','lounge'].map(async scene=>{const file=scene==='lounge'?'assets/scene-originals/lounge-clear-noon.png':'assets/estate-'+scene+'-v1.png';try{scenePaintings[scene]=await loadOriginalImage(new URL('../'+file,import.meta.url).href);return scene;}catch{return null;}}));
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const wood=(c,x,y,w,h)=>{rect(c,x,y,w,h,'#57352c');rect(c,x+3,y+3,w-6,h-6,'#885138');for(let n=8;n<h;n+=12)rect(c,x+5,y+n,w-10,2,n%24?'#b17345':'#704131');};
const flame=(c,x,y,t)=>{rect(c,x,y,8,17,'#bc4c24');rect(c,x+2,y+Math.floor(t/180)%3,4,13,'#f8ab41');rect(c,x+3,y+6,2,8,'#ffeab0');};
const windowArch=(c,x,y,w,h)=>{rect(c,x,y+16,w,h-16,'#69412b');rect(c,x+8,y+7,w-16,h-7,'#9b5e35');rect(c,x+16,y,w-32,10,'#9b5e35');rect(c,x+10,y+20,w-20,h-26,'#f2c580');rect(c,x+w/2-3,y+8,6,h-10,'#6b472e');rect(c,x+9,y+53,w-18,5,'#70462f');for(let i=0;i<5;i++)rect(c,x+13+i*16,y+h-48,11,42-(i%3)*8,'#dba36b');};
export function drawEstateBackground(c,scene,t){const image=scenePaintings[scene];if(image){c.save();c.imageSmoothingEnabled=true;c.drawImage(image,0,0,640,360);c.restore();return;}c.fillStyle='#2d2b2a';c.fillRect(0,0,640,360);c.save();c.fillStyle='#d7c6a5';c.font='14px system-ui';c.textAlign='center';c.fillText('正在载入场景…',320,150);c.restore();}
export function drawFurniture(c,p,t){const x=p.x,y=p.y,id=p.itemId;const r=(dx,dy,w,h,color)=>rect(c,x+dx,y+dy,w,h,color);c.save();if(p.turn){c.translate(2*x,0);c.scale(-1,1);}if(id==='bone'){r(-9,-6,18,4,'#ead9a8');r(-13,-9,6,9,'#f3e6c7');r(8,-9,6,9,'#f3e6c7');}else if(id==='fish'){r(-12,-8,25,3,'#dac594');for(let i=0;i<4;i++){r(-8+i*5,-13,2,14,'#eee0b5');}r(12,-11,6,9,'#d4b783');}else if(id==='rice'){r(-13,-9,26,5,'#ddc79a');r(-10,-4,20,5,'#795548');r(-8,-12,16,4,'#f0e1bd');}else if(['prayer-incense','charm','festival'].includes(id)){r(-9,-18,18,17,'#ae5343');r(-5,-14,10,9,'#d9b877');}else if(['plate','bowl'].includes(id)){r(-17,-8,34,6,'#cca575');r(-13,-3,26,5,'#7a503d');r(-10,-7,20,2,'#553d31');}else if(['mat','cushion','prayer-mat'].includes(id)){r(-23,-4,46,8,id==='cushion'?'#967477':'#a18c60');r(-17,-3,34,2,'#d0b983');}else if(id==='ball'){r(-7,-14,14,14,'#d08063');r(-5,-12,4,4,'#edc485');r(1,-8,5,5,'#7d97a5');}else if(id==='gift-shoes'){r(-18,-10,14,8,'#795a40');r(4,-10,14,8,'#967955');}else if(id==='flowers'){r(-23,-10,46,10,'#786047');for(let i=0;i<5;i++){r(-19+i*9,-18,3,8,'#779055');r(-22+i*9,-23,9,7,i%2?'#c97f70':'#edc171');}}else if(['lamp','stone-lamp','lantern','candle','incense'].includes(id)){r(-9,-27,18,20,id==='lantern'?'#a6493e':'#9c8163');r(-4,-40,8,15,'#d29e4b');flame(c,x-4,y-48,t);r(-12,-5,24,5,'#8d6e49');}else if(id==='screen'){wood(c,x-35,y-66,70,65);r(-27,-58,54,45,'#d0ba86');for(let n=0;n<4;n++)r(-22+n*11,-39-n%2*7,16,25+n%2*7,'#6d8074');}else if(['shelf','cabinet'].includes(id)){wood(c,x-26,y-68,52,66);for(let n=0;n<3;n++){r(-20,-61+n*19,40,14,'#48362f');for(let k=0;k<4;k++)r(-17+k*9,-59+n*19,6,11,['#ad8660','#825d58','#65746b'][k%3]);}}else if(id==='bed'){wood(c,x-42,y-30,84,18);r(-36,-38,72,16,'#d3ae6a');r(17,-44,17,9,'#ead39c');r(-37,-12,7,13,'#543a2e');r(30,-12,7,13,'#543a2e');}else if(id==='lion'){r(-22,-7,44,7,'#887f70');r(-17,-30,34,23,'#aea58a');r(-10,-46,25,25,'#bcb299');r(-14,-34,6,7,'#777064');r(4,-34,3,3,'#514e44');}else if(id==='altar'){wood(c,x-35,y-36,70,20);r(-31,-16,8,16,'#633d31');r(23,-16,8,16,'#633d31');}else if(['leash','station-mark','post'].includes(id)){wood(c,x-5,y-42,10,43);r(-9,-39,18,5,'#c09857');}else{wood(c,x-22,y-21,44,17);r(-19,-4,5,5,'#503b2b');r(14,-4,5,5,'#503b2b');}c.restore();}
const dollPalettes=new Map();
function dollShade(hex,amount){const key=hex+':'+amount;if(dollPalettes.has(key))return dollPalettes.get(key);const n=parseInt(hex.slice(1),16),channels=[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,v+amount)));const result='#'+channels.map(v=>v.toString(16).padStart(2,'0')).join('');dollPalettes.set(key,result);return result;}
export function drawPaperDoll(c,actor,t,scale=1){
 const a=actor.avatar||{},pose=actor.pose||'idle',phase=Math.floor(t/90)%8;
 const female=actor.gender==='female',slave=actor.role!=='owner',longHair=a.hair==='long';
 const crouch=['kneel','pray','stationed','feeding','rest','prostrate','bow'].includes(pose),walking=['walk','follow'].includes(pose),bend=['bow','feeding','pray'].includes(pose)?2:0;
 const lookup=id=>ESTATE_CATALOG.find(i=>i.id===id),top=lookup(a.top),bottom=lookup(a.bottom),shoe=lookup(a.shoes),collar=lookup(a.collar);
 const skin=a.skin||'#e7b891',hair=a.hairColor||'#45312b',cloth=top?.style||'#958368',prison=a.top==='slave-base',pants=bottom?.style||(prison?'#d9d4c7':'#514744'),outline='#382820';
 const bow=['prostrate','bow'].includes(pose)?[0,.25,.7,1,1,.7,.25,0][Math.floor(t/180)%8]:0;const bob=walking?[0,0,1,1,0,0,1,1][phase]:Math.floor(t/120)%8===3?1:0,torso=crouch?-33:-42,head=torso-25+bend,stride=walking?[0,1,2,1,0,-1,-2,-1][phase]:0;
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(actor.x),Math.round(actor.y));c.scale((actor.direction||1)*scale,scale);
 let layer='body';const r=(x,y,w,h,color)=>{const face=layer==='head',sx=face?(slave?1.15:1.45):.85,sy=face?(slave?1.15:1.4):.78,py=face?torso*.78-2+(y-head-22)*sy:y*sy;let px=x*sx,yy=py+bob+(face?28:4)*bow,ww=Math.max(1,w*sx),hh=Math.max(1,h*sy);if(face&&bow>.6){const center=torso*.78-18;px=-(py-center)-hh+18*bow;yy=x*sx+center+28*bow;[ww,hh]=[hh,ww];}else if(face)px+=18*bow;rect(c,px,yy,ww,hh,color);},shade=(color,n)=>dollShade(color,n);
 // A stepped ground shadow and independent back hair establish depth.
 r(-15,0,30,2,'#241b2259');r(-11,-1,22,4,'#241b2235');
 layer='head';if(a.hair==='long'){r(-11,head+3,23,31,outline);r(-10,head+2,21,31,hair);r(-8,head+4,3,27,shade(hair,14));r(7,head+5,3,28,shade(hair,-13));}
 layer='body';const boot=(x,y)=>{const color=shoe?.style||'#564335';r(x-1,y,10,5,outline);r(x,y,8,3,color);r(x,y,7,1,shade(color,24));r(x-1,y+4,10,1,'#292423');if(a.shoes==='gold-shoes'){r(x+1,y+1,5,1,'#f0cd81');r(x+6,y,1,3,'#b39149');}};
 const trouser=(x,y,w,h)=>{r(x-1,y-1,w+2,h+2,outline);r(x,y,w,h,pants);r(x,y,2,h,shade(pants,17));r(x+w-2,y,2,h,shade(pants,-20));r(x+2,y+2,1,h-4,shade(pants,-9));if(prison&&!bottom)for(let k=2;k<h;k+=5)r(x,y+k,w,2,'#444744');if(a.bottom==='brocade-pants'){for(let k=3;k<h;k+=5){r(x+2,y+k,2,1,'#b8945b');r(x+3,y+k-1,1,3,'#b8945b');}}};
 if(crouch){trouser(-12,-12,12,8);trouser(1,-12,12,8);r(-8,-6,17,4,shade(pants,-12));boot(-16,-4);boot(8,-4);}else{trouser(-9,-20+stride,7,16);trouser(3,-20-stride,7,16);boot(-10,-4+stride);boot(3,-4-stride);}
 // Neck, tailored torso, collar seam and cloth highlights remain separate slots.
 r(-3,torso-5,7,7,shade(skin,-24));r(-2,torso-5,4,5,skin);
 r(-10,torso,21,23,outline);r(-11,torso+3,23,17,outline);r(-9,torso+1,19,21,cloth);r(-10,torso+4,21,15,cloth);
 r(-9,torso+2,2,17,shade(cloth,24));r(7,torso+3,3,18,shade(cloth,-26));r(-6,torso+3,2,13,shade(cloth,10));r(3,torso+7,1,12,shade(cloth,-13));
 r(-9,torso+20,19,2,shade(cloth,-33));r(-8,torso+19,16,1,shade(cloth,8));
 if(prison){for(let y=torso+5;y<torso+20;y+=5){r(-9,y,19,2,'#424541');r(-9,y,2,2,'#575a50');r(7,y,3,2,'#2e3330');}r(-2,torso+5,7,6,'#8e8e80');r(-1,torso+5,5,5,'#e9e4d4');r(0,torso+7,3,1,'#666b60');r(-6,torso+2,5,1,'#f0ead9');}
 else{r(-4,torso+1,4,2,shade(cloth,33));r(0,torso+2,3,2,shade(cloth,-28));r(0,torso+5,1,13,shade(cloth,-21));for(let y=torso+5;y<torso+17;y+=4)r(1,y,1,1,'#c4aa78');
  if(['crest','gold-suit','silk','owner-base'].includes(a.top)){r(-8,torso+18,17,2,'#ba914c');r(-8,torso+18,15,1,'#e0bc76');r(-8,torso+2,1,15,'#b58c56');if(a.top!=='owner-base'){for(const x of [-5,4])for(let y=torso+6;y<torso+16;y+=5){r(x,y,3,1,'#d0b075');r(x+1,y-1,1,3,'#d0b075');}r(-1,torso+6,3,8,'#e8c680');}}
 }
 // Articulated sleeves, lit fingertips and cuffs follow the existing poses.
 const swing=walking?[0,-1,-2,-1,0,1,2,1][phase]:0;
 const arm=(x,offset)=>{r(x-1,torso+4+offset,7,14,outline);r(x,torso+4+offset,5,12,cloth);r(x,torso+5+offset,1,9,shade(cloth,23));r(x+4,torso+5+offset,1,10,shade(cloth,-26));if(prison)for(let k=3;k<11;k+=4)r(x,torso+4+offset+k,5,2,'#414641');r(x,torso+15+offset,5,2,shade(cloth,-30));r(x,torso+17+offset,5,5,shade(skin,-28));r(x,torso+17+offset,4,4,skin);r(x+1,torso+17+offset,2,1,shade(skin,17));r(x+3,torso+19+offset,1,2,shade(skin,-17));};
 arm(-15,swing);arm(12,-swing);if(bow>.6){r(8,-5,15,3,skin);r(20,-5,4,3,shade(skin,-20));}
 if(pose==='pray'){r(-6,torso+9,12,5,shade(skin,-25));r(-5,torso+9,5,3,skin);r(1,torso+8,4,4,skin);r(0,torso+6,1,8,shade(skin,21));}
 if(pose==='give'){r(15,torso+14,11,4,shade(skin,-21));r(16,torso+14,9,2,skin);}
 // Original male/female anime pixel heads, drawn as independent paper-doll layers.
 layer='head';const ink='#33272f',light=shade(skin,20),warm=shade(skin,-22),blink=Math.floor(t/120)%36===0;
 r(-6,head-2,14,2,ink);r(-9,head,20,4,ink);r(-10,head+4,22,12,ink);r(-8,head+16,19,3,ink);r(-6,head+19,15,2,ink);r(-3,head+21,9,1,ink);
 r(-8,head+2,18,14,skin);r(-7,head+16,17,3,skin);r(-5,head+19,13,2,skin);r(-2,head+21,7,1,warm);
 r(-8,head+4,2,10,light);r(-6,head+5,3,2,shade(skin,12));r(8,head+6,2,9,warm);r(6,head+17,3,2,warm);r(-10,head+10,2,5,warm);r(-10,head+11,1,3,skin);
 // White catchlights and colored iris clusters keep eyes readable at scene size.
 for(const x of [-6,3]){r(x-1,head+8,5,1,shade(hair,-9));r(x,head+10,5,blink?1:6,ink);if(!blink){r(x,head+11,4,4,'#fff0d8');r(x+2,head+10,2,5,female?'#895748':'#4d696a');r(x+2,head+10,1,2,'#fff9e6');r(x+3,head+14,1,1,female?'#d29863':'#9bbb9f');}if(female){r(x-1,head+9,1,2,ink);r(x+4,head+10,1,1,ink);}}
 r(0,head+16,1,1,light);r(1,head+17,1,1,warm);r(-7,head+17,3,1,'#e9aa96');r(7,head+17,2,1,'#dc9e8b');
 r(0,head+19,a.expression==='smile'?4:3,1,'#a16d62');if(a.expression==='smile')r(1,head+20,2,1,'#bb7c6b');
 // Multi-tone swept bangs and jagged rim light; sex changes the silhouette, not just color.
 r(-6,head-4,14,2,shade(hair,-17));r(-9,head-2,20,4,hair);r(-10,head+2,22,3,hair);r(-11,head+4,4,7,shade(hair,-14));r(9,head+4,3,9,shade(hair,-19));
 r(-7,head-2,4,2,shade(hair,24));r(-3,head-2,9,1,shade(hair,42));r(-7,head+1,6,1,shade(hair,31));r(-1,head,7,1,shade(hair,20));r(5,head+1,4,1,shade(hair,9));r(-9,head+3,2,4,shade(hair,12));
 if(female){r(-8,head+4,3,3,hair);r(-5,head+3,3,5,hair);r(-1,head+3,2,3,hair);r(2,head+3,2,4,hair);r(6,head+4,3,3,shade(hair,-9));r(-6,head+4,1,2,shade(hair,15));if(longHair){for(const [x,shadeValue]of[[-12,9],[10,-16]]){r(x,head+8,3,19,shade(hair,shadeValue));r(x+1,head+9,1,14,shade(hair,shadeValue+21));r(x,head+25,2,5,shade(hair,shadeValue-8));r(x+1,head+29,1,2,shade(hair,-25));}r(10,head+18,2,1,shade(hair,15));}}
 else{r(-3,head-6,3,3,hair);r(-2,head-5,1,1,shade(hair,25));r(2,head-5,4,3,hair);r(-8,head+4,3,3,hair);r(-4,head+3,3,5,hair);r(0,head+4,2,2,hair);r(4,head+4,3,3,hair);r(9,head+10,2,4,shade(hair,-22));r(-6,head+3,2,1,shade(hair,28));}
 // Neck accessories keep their nine distinct motifs and metallic highlights.
 layer='body';if(collar){const y=torso-3;r(-7,y,15,5,outline);r(-6,y+1,13,3,collar.style);r(-6,y+1,12,1,shade(collar.style,30));
  if(a.collar==='pink-collar'){r(-4,y,4,6,'#da91ac');r(3,y,4,6,'#ba6d96');r(-3,y+1,2,2,'#f2c3ce');r(4,y+1,2,2,'#ebb3cc');r(0,y+1,3,3,'#a35f87');r(1,y+2,1,1,'#f4d1cf');}
  else if(a.collar==='jade-collar'){for(let x=-6;x<7;x+=3){r(x,y+1,3,3,'#3c786b');r(x,y+1,2,2,'#8bc7a2');r(x,y+1,1,1,'#d3e8bf');}}
  else if(['leather-collar','black-collar'].includes(a.collar)){for(let x=-5;x<7;x+=4){r(x,y+2,2,2,'#b7925d');r(x,y+2,1,1,'#f4d49b');}r(0,y+4,3,3,'#dab977');r(1,y+5,1,1,outline);}
  else if(a.collar==='blue-collar'){for(let x=-5;x<7;x+=4){r(x,y+1,1,3,'#d1d7c1');r(x-1,y+2,3,1,'#d1d7c1');}}
  else if(a.collar==='bone-collar'){for(let x=-5;x<7;x+=5){r(x,y+1,3,2,'#e8dfc2');r(x-1,y+1,1,3,'#e8dfc2');r(x+3,y+1,1,3,'#e8dfc2');}}
  else if(a.collar==='royal-collar'){r(-6,y+3,13,1,'#d8b578');for(let x=-5;x<7;x+=4)r(x,y+1,2,1,'#cda369');r(-1,y+4,4,4,'#a97837');r(0,y+4,2,3,'#efce84');r(0,y+4,1,1,'#fff0b2');}
  else if(a.collar==='bell-collar'){r(-1,y+4,4,4,'#ac7d35');r(0,y+4,2,2,'#f3d187');r(-2,y+7,6,1,'#d7ae60');r(0,y+7,2,1,'#614b31');}
  else{for(let x=-5;x<7;x+=4){r(x,y+2,3,1,'#d7ae73');r(x+1,y+1,1,3,'#d7ae73');}r(0,y+4,3,3,'#deb779');}}
 layer='head';if(a.head==='crown'){const y=head-8;r(-10,y+5,22,4,'#775429');r(-9,y+5,20,2,'#d5a446');r(-8,y+5,17,1,'#ffe4a0');for(const [x,h]of[[-9,4],[-4,6],[2,8],[8,5]]){r(x,y+5-h,3,h,'#b67d30');r(x,y+5-h,2,h-1,'#f0c567');r(x,y+4-h,1,1,'#fff0c2');}r(0,y+5,3,2,'#aa5140');r(1,y+5,1,1,'#ec9d6c');}
 else if(a.head==='jade-pin'){r(3,head-2,12,2,'#977243');r(3,head-2,11,1,'#e2c897');r(9,head-6,4,5,'#376d60');r(9,head-6,3,3,'#8bbc93');r(10,head-6,1,1,'#d8e5bc');r(12,head-1,1,5,'#bc9959');}
 layer='body';if(a.hand==='book-hand'){r(16,torso+10,11,14,outline);r(17,torso+11,9,12,'#bd9d6a');r(18,torso+12,3,10,'#e2c995');r(22,torso+12,3,10,'#d3b883');r(21,torso+11,1,12,'#71553b');for(let y=torso+14;y<torso+21;y+=3){r(18,y,2,1,'#a2875c');r(23,y,2,1,'#9c7c51');}}
 if(pose==='play'){r(20,torso+13,8,8,'#9e5345');r(21,torso+13,5,6,'#d69369');r(22,torso+14,2,2,'#f1c591');r(25,torso+17,2,3,'#658087');}
 if(pose==='pray'){r(-17,-1,34,2,'#b76a5a35');for(let i=0;i<4;i++){const y=-20-(Math.floor(t/190)+i*5)%24;r(-18+i*11,y,1,2,'#d49d7d');r(-17+i*11,y+1,1,1,'#e8c59a');}}
 c.restore();
}
