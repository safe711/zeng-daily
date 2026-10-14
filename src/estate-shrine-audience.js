export const AUDIENCE_WINDOWS=[[8,10],[12,14],[20,22]];
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Hong_Kong',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function shrineAudience(now=Date.now(),manual=null){
 const parts=Object.fromEntries(clock.formatToParts(now).map(p=>[p.type,p.value]));
 const seconds=Number(parts.hour)*3600+Number(parts.minute)*60+Number(parts.second)+(now%1000)/1000,midnight=now-seconds*1000;
 const intervals=AUDIENCE_WINDOWS.map(([start,end])=>({startAt:midnight+start*3600000,endsAt:midnight+end*3600000,source:'scheduled'}));
 if(Number.isFinite(manual?.startAt)&&Number.isFinite(manual?.endsAt)&&manual.endsAt>manual.startAt)intervals.push({...manual,source:'manual'});
 const active=intervals.filter(i=>now>=i.startAt&&now<i.endsAt),nextStartsAt=intervals.filter(i=>i.startAt>now).reduce((n,i)=>Math.min(n,i.startAt),midnight+86400000+8*3600000);
 if(active.length){const startAt=Math.min(...active.map(i=>i.startAt)),endsAt=Math.max(...active.map(i=>i.endsAt)),elapsed=now-startAt;return{active:true,phase:elapsed<6000?'approach':'bow',elapsed,progress:Math.min(1,elapsed/6000),startAt,endsAt,remainingMs:endsAt-now,nextStartsAt,source:active.some(i=>i.source==='manual')?'manual':'scheduled'};}
 const ended=intervals.filter(i=>now>=i.endsAt&&now<i.endsAt+6000).sort((a,b)=>b.endsAt-a.endsAt)[0];
 if(ended)return{active:false,phase:'return',elapsed:now-ended.endsAt,progress:(now-ended.endsAt)/6000,remainingMs:nextStartsAt-now,nextStartsAt};
 return{active:false,phase:'home',elapsed:0,progress:0,remainingMs:nextStartsAt-now,nextStartsAt};
}
export function audienceCountdown(audience){const seconds=Math.max(0,Math.ceil(audience.remainingMs/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;return (audience.active?'现圣结束倒计时 ':'距离下次现圣 ')+(hours?String(hours).padStart(2,'0')+':':'')+String(minutes).padStart(2,'0')+':'+String(rest).padStart(2,'0');}
export function disasterAudiencePosition(actor,now=Date.now(),manual=null){
 const right=actor.id==='ZENG-DZ-002'||actor.number==='02',home={scene:'shrine',x:right?490:165,y:305,direction:right?-1:1},post={scene:'shrine',x:right?416:238,y:305,direction:right?-1:1},audience=shrineAudience(now,manual);
 const progress=audience.phase==='bow'?1:audience.phase==='approach'?audience.progress:audience.phase==='return'?1-audience.progress:0;
 const moving=['approach','return'].includes(audience.phase),back=audience.phase==='return';
 const title=right?'主子奶奶':'主子爷',words=[`${title}，奴才给您磕头`,`${title}，奴才给您挡灾`,`感谢${title}大恩`];
 return{...home,x:home.x+(post.x-home.x)*progress,direction:back?-home.direction:home.direction,pose:moving?'crawl':'prostrate',audiencePhase:audience.phase,audienceClock:Math.max(0,audience.elapsed-6000),audienceText:audience.phase==='bow'?words[Math.floor(Math.max(0,audience.elapsed-6000)/1620)%3]:null,chainAnchor:{x:home.x,y:5}};
}
