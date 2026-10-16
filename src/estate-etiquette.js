import {ESTATE_SOLAR_TERMS} from './estate-calendar-terms.js';
export const ETIQUETTE_WINDOWS=[[8*60,8*60+30],[12*60,12*60+30],[22*60,22*60+30]];
export const ETIQUETTE_TRADITIONS=[
  {name:'元宵节',month:1,day:15},{name:'龙抬头',month:2,day:2},
  {name:'上巳节',month:3,day:3},{name:'端午节',month:5,day:5},
  {name:'七夕节',month:7,day:7},{name:'中元节',month:7,day:15},
  {name:'中秋节',month:8,day:15},{name:'重阳节',month:9,day:9},
  {name:'下元节',month:10,day:15},{name:'腊八节',month:12,day:8},
  {name:'小年',month:12,day:23},{name:'小年',month:12,day:24}
];
export const ETIQUETTE_PREVIEWS=[...new Set(['除夕','春节',...ETIQUETTE_TRADITIONS.map(x=>x.name),'清明节','寒食节','冬至'])];
export function estateFestivalPreview(name,now=Date.now()){
  if(!ETIQUETTE_PREVIEWS.includes(name))return null;
  const spring=name==='春节'||name==='除夕';
  return {active:true,preview:true,key:'preview:'+name,kind:'holiday',date:etiquetteCalendar(now).date,names:[name],messages:[spring?'感恩曾家':'曾家主子'+name+'快乐'],spring,tethered:true,startAt:now,endsAt:now+86400000};
}
const DAY=86400000,HK=8*3600000,lunarFormat=new Intl.DateTimeFormat('en-u-ca-chinese',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'numeric',day:'numeric'});
const days=new Map();
export function etiquetteCalendar(now){
  const key=Math.floor((now+HK)/DAY);if(days.has(key))return days.get(key);
  const stamp=new Date(key*DAY),parts=Object.fromEntries(lunarFormat.formatToParts(new Date(now)).map(p=>[p.type,p.value]));
  const value={key,startAt:key*DAY-HK,date:stamp.toISOString().slice(0,10),year:stamp.getUTCFullYear(),month:stamp.getUTCMonth()+1,day:stamp.getUTCDate(),lunar:{year:Number(parts.relatedYear),month:Number(parts.month),day:Number(parts.day),leap:!/^[0-9]+$/.test(parts.month)}};
  days.set(key,value);while(days.size>4)days.delete(days.keys().next().value);return value;
}
export function validateEtiquetteDates(dates){
  if(!Array.isArray(dates)||dates.length>100)throw Error('礼仪日期最多100条');const ids=new Set();
  for(const d of dates){if(!d||typeof d.id!=='string'||!d.id||d.id.length>100||ids.has(d.id)||!['birthday','anniversary'].includes(d.kind)||!['solar','lunar'].includes(d.calendar)||typeof d.label!=='string'||!d.label.trim()||d.label.length>60||!Number.isInteger(d.month)||d.month<1||d.month>12||!Number.isInteger(d.day)||d.day<1||d.day>(d.calendar==='lunar'?30:new Date(Date.UTC(2024,d.month,0)).getUTCDate()))throw Error('请检查礼仪名称、日期和历法');ids.add(d.id);}
  return dates;
}
export function estateEtiquette(now=Date.now(),customDates=[]){
  const day=etiquetteCalendar(now),l=day.lunar,names=[];
  const tomorrow=etiquetteCalendar(now+DAY).lunar,eve=!tomorrow.leap&&tomorrow.month===1&&tomorrow.day===1;
  const spring=eve||!l.leap&&l.month===1&&l.day<=7;
  if(eve)names.push('除夕');else if(spring)names.push('春节');
  if(!l.leap)for(const festival of ETIQUETTE_TRADITIONS)if(l.month===festival.month&&l.day===festival.day)names.push(festival.name);
  const terms=ESTATE_SOLAR_TERMS[day.year],md=day.date.slice(5);
  if(terms?.qingming===md)names.push('清明节');
  if(terms?.winter===md)names.push('冬至');
  if(terms?.qingming===new Date((day.key+1)*DAY).toISOString().slice(5,10))names.push('寒食节');
  const custom=customDates.filter(d=>d.calendar==='solar'?d.month===day.month&&d.day===day.day:!l.leap&&d.month===l.month&&d.day===l.day);
  if(names.length||custom.length){const messages=[];if(spring)messages.push('感恩曾家');else if(names.length)messages.push('曾家主子'+names.join('、')+'快乐');
    for(const d of custom)messages.push('曾家主子，'+d.label+(d.kind==='birthday'?'生日快乐':'纪念日快乐'));
    return {active:true,key:day.date+':holiday',kind:'holiday',date:day.date,names:[...names,...custom.map(d=>d.label+(d.kind==='birthday'?'生日':'纪念日'))],messages,spring,tethered:true,startAt:day.startAt,endsAt:day.startAt+DAY};}
  const minute=(now-day.startAt)/60000,index=ETIQUETTE_WINDOWS.findIndex(([a,b])=>minute>=a&&minute<b);
  if(index<0)return null;const [start,end]=ETIQUETTE_WINDOWS[index];
  return {active:true,key:day.date+':daily:'+index,kind:'daily',date:day.date,names:['日常请安'],messages:['曾家主子吉祥'],spring:false,tethered:false,startAt:day.startAt+start*60000,endsAt:day.startAt+end*60000};
}
export function etiquettePosition(actor,members,now,event){
  if(!event||actor.role==='owner')return null;const people=members.filter(a=>a.role!=='owner').sort((a,b)=>a.id.localeCompare(b.id)),index=people.findIndex(a=>a.id===actor.id);if(index<0)return null;
  const columns=Math.ceil(people.length/2),row=Math.floor(index/columns),column=index%columns,step=Math.min(100,250/Math.max(1,columns-1));
  const elapsed=Math.max(0,now-event.startAt),phase=elapsed%6480;
  return {scene:'courtyard',x:130+column*step+row*25,y:282+row*40,direction:1,row,column,pose:phase<1620?'kneel':'prostrate',audiencePhase:'bow',audienceClock:phase<1620?0:phase-1620,audienceText:null,etiquette:true,etiquetteClock:phase<1620?0:phase-1620,target:null,greeting:null,interaction:null};
}
export function etiquetteMessage(event,now){return event?.messages[Math.floor(Math.max(0,now-event.startAt)/6480)%event.messages.length]||'';}
export function celebrationActive(record,event,now){return !!(record&&event?.spring&&record.date===event.date&&now>=record.startedAt&&now<record.endsAt);}
