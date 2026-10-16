import {celebrationActive,etiquetteMessage} from './estate-etiquette.js';
import {drawTetherChain} from './estate-chain.js';
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
export function drawEtiquetteSky(c,event,record,now){
  if(!celebrationActive(record,event,now))return;
  const elapsed=now-record.startedAt;c.save();c.beginPath();c.rect(0,0,640,137);c.clip();c.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){const age=((elapsed+i*610)%2600)/2600;if(age<.22)continue;const p=(age-.22)/.78,x=320+i*77+noise(i)*13,y=25+noise(i+9)*52,r=3+p*(20+noise(i+4)*10),colors=['#f5c26c','#e98982','#c6dcef','#e6cd85'];c.globalAlpha=(1-p)*.9;c.strokeStyle=colors[i];c.lineWidth=.7;
    for(let ray=0;ray<18;ray++){const angle=ray*Math.PI*2/18;c.beginPath();c.moveTo(x+Math.cos(angle)*r*.65,y+Math.sin(angle)*r*.65+p*p*10);c.lineTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r+p*p*10);c.stroke();}}
  c.restore();
}
export function drawEtiquetteFirecrackers(c,event,record,now){
  if(!celebrationActive(record,event,now))return;const elapsed=now-record.startedAt;c.save();
  c.strokeStyle='#b79451';c.lineWidth=1;c.beginPath();c.moveTo(87,156);c.lineTo(87,240);c.stroke();
  for(let i=0;i<15;i++){const x=87+(i%2?5:-5),y=163+i*5,lit=elapsed<13000&&Math.floor(elapsed/100)%15===i;c.fillStyle=lit?'#fff1a2':'#be3934';c.fillRect(x-3,y-3,6,9);c.fillStyle='#e3b562';c.fillRect(x-3,y-3,6,1);c.fillRect(x-3,y+5,6,1);}
  if(elapsed<13000)for(let i=0;i<22;i++){const p=((elapsed+i*71)%900)/900,angle=-Math.PI+noise(i)*Math.PI;c.fillStyle=i%3?'#dfb55e':'#d86a47';c.globalAlpha=1-p;c.fillRect(88+Math.cos(angle)*p*30,247+Math.sin(angle)*p*25+p*p*14,1.5,1.5);}
  c.restore();
}
export function drawEtiquetteTether(c,actor,neck){
  const peg={x:actor.x-35,y:actor.y+2};c.save();c.strokeStyle='#b1a78b';c.lineWidth=2;c.beginPath();c.ellipse(peg.x,peg.y,4,2,0,0,Math.PI*2);c.stroke();c.restore();drawTetherChain(c,peg,neck);
}
export function drawEtiquetteChorus(c,event,now){
  if(!event)return;const message=etiquetteMessage(event,now),lines=message.match(/.{1,19}/gu)||[''],height=lines.length*19+16,y=128;c.save();c.fillStyle='#f5e5be';c.strokeStyle='#72512e';c.lineWidth=1.5;c.beginPath();c.roundRect(108,y,350,height,6);c.fill();c.stroke();c.fillStyle='#f5e5be';for(const x of [178,278]){c.beginPath();c.moveTo(x-5,y+height-1);c.lineTo(x+1,y+height+8);c.lineTo(x+6,y+height-1);c.fill();}c.fillStyle='#694527';c.font='bold 16px system-ui';c.textAlign='center';c.textBaseline='middle';lines.forEach((line,i)=>c.fillText(line,283,y+16+i*19,334));c.restore();
}
