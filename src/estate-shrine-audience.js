export const AUDIENCE_WINDOWS=[[8,10],[12,14],[20,22]];
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Hong_Kong',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function shrineAudience(now=Date.now()){
 const parts=Object.fromEntries(clock.formatToParts(now).map(p=>[p.type,p.value]));
 const seconds=Number(parts.hour)*3600+Number(parts.minute)*60+Number(parts.second)+(now%1000)/1000;
 for(const [start,end]of AUDIENCE_WINDOWS){if(seconds>=start*3600&&seconds<end*3600)return{active:true,phase:seconds<start*3600+6?'approach':'bow',elapsed:(seconds-start*3600)*1000,progress:Math.min(1,(seconds-start*3600)/6)};if(seconds>=end*3600&&seconds<end*3600+6)return{active:false,phase:'return',elapsed:(seconds-end*3600)*1000,progress:(seconds-end*3600)/6};}
 return{active:false,phase:'home',elapsed:0,progress:0};
}
export function disasterAudiencePosition(actor,now=Date.now()){
 const right=actor.id==='ZENG-DZ-002'||actor.number==='02',home={scene:'shrine',x:right?490:165,y:305,direction:right?-1:1},post={scene:'shrine',x:right?416:238,y:305,direction:right?-1:1},audience=shrineAudience(now);
 const progress=audience.phase==='bow'?1:audience.phase==='approach'?audience.progress:audience.phase==='return'?1-audience.progress:0;
 const moving=['approach','return'].includes(audience.phase),back=audience.phase==='return';
 const title=right?'主子奶奶':'主子爷',words=[`${title}，奴才给您磕头`,`${title}，奴才给您挡灾`,`感谢${title}大恩`];
 return{...home,x:home.x+(post.x-home.x)*progress,direction:back?-home.direction:home.direction,pose:moving?'crawl':'prostrate',audiencePhase:audience.phase,audienceClock:Math.max(0,audience.elapsed-6000),audienceText:audience.phase==='bow'?words[Math.floor(Math.max(0,audience.elapsed-6000)/1620)%3]:null,chainAnchor:{x:home.x,y:5}};
}
