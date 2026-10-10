import {dayKey,validDate,daily,RITUAL_KINDS,RITUAL_NAMES} from './model.js';
const greetings=[
  '狗奴才给主子请安，曾主子万岁万万岁。愿主子今日顺心，狗奴才恭敬候命。',
  '狗奴才恭敬给曾家主子请安，曾主子万岁万万岁。今日谨记主子的吩咐，认真完成已确认的日课。',
  '狗奴才给曾主子叩首请安，曾主子万岁万万岁。愿主子安康顺遂，狗奴才恭敬听候吩咐。',
  '狗奴才跪候给主子请安，曾主子万岁万万岁。新的一日，恭敬问安，认真复命。',
  '狗奴才给曾家主子请安，曾主子万岁万万岁。愿主子今日心情舒畅，狗奴才恭敬奉上晨间问候。',
  '狗奴才恭敬叩首，给曾主子请安，曾主子万岁万万岁。今日依照已确认的安排，认真记录每一项日课。'
];
export function morningGreeting(date=dayKey()) {
  if(!validDate(date))throw Error('请安日期无效');
  const day=Math.floor(new Date(`${date}T12:00:00Z`).getTime()/86400000);
  const cycle=Math.floor(day/greetings.length);
  const offset=((cycle*7)%greetings.length+greetings.length)%greetings.length;
  const index=(((day%greetings.length)+greetings.length)%greetings.length+offset)%greetings.length;
  return greetings[index];
}
export function requireMorningPhoto(photo,date=dayKey()) {
  requireRitualPhoto(photo,'morning',date);
}
export function ritualGreeting(kind,date=dayKey()) {
  if(!RITUAL_KINDS.includes(kind))throw Error('礼仪类型无效');
  if(kind==='morning')return morningGreeting(date);
  const greeting=morningGreeting(date);
  if(kind==='noon')return greeting.replace(/晨间问候/g,'午间问候').replace(/新的一日/g,'午间时分').replace(/认真复命/g,'恭敬问安');
  if(kind==='evening')return greeting.replace(/晨间问候/g,'晚间问候').replace(/今日/g,'今夜').replace(/新的一日/g,'一日将尽').replace(/认真复命/g,'恭敬问安');
  return '狗奴才给曾家主子谢恩。感谢主子允许狗奴才为主子的父母行挡灾磕头之礼，以礼仪表达祝愿，愿二位长辈平安康健。';
}
export function ritualInstruction(kind) {
  if(kind==='morning')return '请恭敬跪好，对曾家主子语音朗读以下文字，并磕头 10 个请安。';
  if(kind==='evening')return '请恭敬跪好，对曾家主子语音朗读以下文字，并磕头请安。';
  if(kind==='gratitude')return '晚间感谢主子允许为主子的父母挡灾磕头。此礼仪用于表达感谢与祝愿。';
  return '对曾家主子语音朗读以下文字，完成午间请安。';
}
export function requireRitualPhoto(photo,kind,date=dayKey()) {
  if(!RITUAL_KINDS.includes(kind) || !photo || photo.date!==date || photo.kind!==kind || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(photo.id) || !(photo.blob instanceof Blob) || photo.blob.type!=='image/jpeg' || photo.blob.size===0 || photo.source!=='camera')throw Error('请先为当前礼仪拍照打卡并保存照片');
}
export function ritualEvidence(entry,kind) {
  return entry?.ritualMeta?.[kind] || (kind==='morning'?{photoId:entry?.morningPhotoId,phrase:entry?.morningPhrase}:{});
}
export function completeRitual(state,kind,photo,date=dayKey(),completedAt=new Date()) {
  requireRitualPhoto(photo,kind,date);
  if(!(completedAt instanceof Date) || Number.isNaN(completedAt.getTime()))throw Error('完成时间无效');
  const phrase=ritualGreeting(kind,date);
  daily(state,kind,`完成${RITUAL_NAMES[kind]}礼仪（长按 3 秒）\n朗读文字：${phrase}${kind==='morning'?'\n磕头请安：10 个（自行完成）':''}\n拍照打卡已保存；NAS 状态请查看照片。`,date);
  state.days[date].ritualMeta ||= {};
  state.days[date].ritualMeta[kind]={phrase,photoId:photo.id,completedAt:completedAt.toISOString(),completedTime:completedAt.toTimeString().slice(0,8)};
  if(kind==='morning'){state.days[date].morningPhotoId=photo.id;state.days[date].morningPhrase=phrase;}
}
export function completeMorning(state,photo,date=dayKey()) {
  completeRitual(state,'morning',photo,date);
}
