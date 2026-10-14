// A softly bowed chain with evenly spaced, alternating iron links.
export function drawDisasterChain(c,actor,neck,time){
 const side=actor.x<320?-1:1,start=actor.chainAnchor||{x:actor.x,y:5},bend=34+Math.sin(time/1900+(side>0?1.2:0))*3,control={x:(start.x+neck.x)/2+side*bend,y:neck.y*.53};
 const point=t=>({x:(1-t)*(1-t)*start.x+2*(1-t)*t*control.x+t*t*neck.x,y:(1-t)*(1-t)*start.y+2*(1-t)*t*control.y+t*t*neck.y});
 const samples=[{...start,length:0}];let length=0;for(let i=1;i<=64;i++){const p=point(i/64),previous=samples.at(-1);length+=Math.hypot(p.x-previous.x,p.y-previous.y);samples.push({...p,length});}
 c.save();c.lineJoin='miter';c.fillStyle='#34373b';c.fillRect(start.x-6,0,12,5);c.fillStyle='#85877c';c.fillRect(start.x-4,1,8,1);c.fillStyle='#c0b79f';c.fillRect(start.x-4,2,1,1);c.fillRect(start.x+3,2,1,1);
 const count=Math.max(2,Math.ceil(length/9)),spacing=length/count;let cursor=1;
 for(let i=0;i<=count;i++){const distance=i*spacing;while(cursor<samples.length-1&&samples[cursor].length<distance)cursor++;const a=samples[cursor-1],b=samples[cursor],mix=(distance-a.length)/(b.length-a.length||1),x=a.x+(b.x-a.x)*mix,y=a.y+(b.y-a.y)*mix;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);const width=i%2?3:7,height=10;
  c.strokeStyle='#20252a';c.lineWidth=3;c.strokeRect(-width/2,-height/2,width,height);
  c.strokeStyle=i%2?'#62696b':'#7b807b';c.lineWidth=1.3;c.strokeRect(-width/2,-height/2,width,height);
  c.strokeStyle='#b1ad9e';c.lineWidth=1;c.beginPath();c.moveTo(-width/2,-height/2+3);c.lineTo(-width/2,-height/2);c.lineTo(width/2-1,-height/2);c.stroke();c.restore();
 }
 c.restore();
}

export function drawTetherChain(c,start,end){const control={x:(start.x+end.x)/2,y:Math.max(start.y,end.y)+15},at=t=>({x:(1-t)*(1-t)*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)*(1-t)*start.y+2*(1-t)*t*control.y+t*t*end.y}),length=Math.hypot(end.x-start.x,end.y-start.y)+20,count=Math.max(2,Math.ceil(length/6));c.save();for(let n=0;n<count;n++){const t=n/(count-1),p=at(t),q=at(Math.min(1,t+.01));c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));c.beginPath();c.ellipse(0,0,4,n%2?1.1:2.5,0,0,Math.PI*2);c.strokeStyle='#333940';c.lineWidth=2.6;c.stroke();c.strokeStyle='#b3b9bd';c.lineWidth=1.1;c.stroke();c.restore();}c.restore();}

// Guard posts use a mid-height wall ring and heavier, readable iron links.
export function guardChainAnchor(scene,site,slot=0){return {x:site.x+(slot===1?54:-14),y:Math.max(60,site.y-(scene==='courtyard'?64:70))};}
export function drawGuardChain(c,neck,anchor){
 const control={x:(neck.x+anchor.x)/2+24,y:(neck.y+anchor.y)/2+22},at=t=>({x:(1-t)**2*neck.x+2*(1-t)*t*control.x+t*t*anchor.x,y:(1-t)**2*neck.y+2*(1-t)*t*control.y+t*t*anchor.y});
 const count=Math.max(2,Math.ceil((Math.hypot(anchor.x-neck.x,anchor.y-neck.y)+20)/8));c.save();
 c.fillStyle='#222a31';c.fillRect(anchor.x-7,anchor.y-8,14,16);c.fillStyle='#687782';c.fillRect(anchor.x-5,anchor.y-6,10,12);c.fillStyle='#d5e0e3';for(const x of [-3,3])for(const y of [-4,4])c.fillRect(anchor.x+x-1,anchor.y+y-1,2,2);
 for(let n=0;n<count;n++){const t=n/(count-1),p=at(t),q=at(t<1?t+.001:t-.001);c.save();c.translate(Math.round(p.x),Math.round(p.y));c.rotate(Math.atan2(q.y-p.y,q.x-p.x));c.beginPath();c.ellipse(0,0,5,n%2?1.8:3.3,0,0,Math.PI*2);c.strokeStyle='#1c252e';c.lineWidth=4;c.stroke();c.strokeStyle=n%2?'#a1adb5':'#c0cdd3';c.lineWidth=2;c.stroke();c.strokeStyle='#eef5ef';c.lineWidth=.8;c.beginPath();c.moveTo(-3,-2);c.lineTo(1,-3);c.stroke();c.restore();}c.restore();
}

export function drawLeatherLeash(c,start,end){const distance=Math.hypot(end.x-start.x,end.y-start.y),control={x:(start.x+end.x)/2,y:Math.max(start.y,end.y)+Math.min(24,8+distance*.1)};c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(start.x,start.y);c.quadraticCurveTo(control.x,control.y,end.x,end.y);c.strokeStyle='#302019';c.lineWidth=3.5;c.stroke();c.strokeStyle='#9b6845';c.lineWidth=1.8;c.stroke();c.strokeStyle='#c79665';c.lineWidth=.5;c.stroke();for(const p of [start,end]){c.beginPath();c.ellipse(p.x,p.y,2.2,1.3,0,0,Math.PI*2);c.strokeStyle='#aab0b4';c.lineWidth=1;c.stroke();}c.restore();}
