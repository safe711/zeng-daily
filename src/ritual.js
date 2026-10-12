import {dayKey,validDate,daily,RITUAL_KINDS,RITUAL_NAMES} from './model.js';
const gratitudeVow='感谢主子允许狗奴才的爸妈为曾主子的父母及姥姥行挡灾之礼。狗奴才谨立终身尽责之愿：愿狗奴爸妈在世之日始终尽责守礼，为曾家祈福挡灾，直至生命终了。';
const greetings={
  morning:[
    '晨光初起，狗奴才跪候给曾家主子请安，曾主子万岁万万岁。愿主子今日精神舒畅、诸事顺遂，狗奴才恭敬候命，以认真侍奉开启一日。',
    '狗奴才叩首给曾家主子奉上晨间请安，曾主子万岁万万岁。新的一日，愿主子安康如意，狗奴才谨记吩咐，整肃心意，听候差遣。',
    '清晨问安，狗奴才恭敬拜见曾家主子，曾主子万岁万万岁。愿主子醒来心境明朗，今日所行皆顺，狗奴才叩首候命，不怠日课。',
    '狗奴才晨间跪好，给曾家主子叩首请安，曾主子万岁万万岁。愿主子一日平安喜乐，狗奴才恭候今日安排，尽心做好每件侍奉之事。',
    '晨光迎新，狗奴才给曾家主子请安，曾主子万岁万万岁。恭祝主子今日心情舒畅、所愿顺遂，狗奴才收心守礼，恭敬奉侍。',
    '狗奴才恭敬奉上清晨问候，给曾家主子叩首请安，曾主子万岁万万岁。今日从请安开始，谨记曾家恩泽，认真候命，尽心侍奉。'
  ],
  noon:[
    '午间时分，狗奴才恭敬给曾家主子问安。愿主子用膳舒心、片刻休憩安稳，狗奴才在此候命，午后仍恭敬听候吩咐。',
    '狗奴才奉上午间请安，恭祝曾家主子午安。半日已过，愿主子诸事顺心，狗奴才收心省身，谨记吩咐，继续尽心侍奉。',
    '日到正午，狗奴才向曾家主子恭敬问安。愿主子午间安适，忙时不累、闲时自在，狗奴才守好日课，候主子差遣。',
    '曾家主子午安，狗奴才恭敬前来请安。愿主子午膳可口、心境舒展，狗奴才不敢怠慢，午后依然收心候命。',
    '狗奴才在午间给曾家主子请安。愿主子半日辛劳得以舒缓，余下时光顺遂安宁，狗奴才谨守吩咐，认真做好侍奉之事。',
    '午间问候奉到曾家主子跟前，狗奴才恭敬请安。愿主子用膳安稳、午后从容，狗奴才在此整肃心意，随时听候差遣。'
  ],
  evening:[
    '夜色已至，狗奴才跪好给曾家主子叩首请安，恭敬复命。一日将尽，谨记主子恩泽，愿主子今夜安眠，狗奴才省察今日侍奉，明日再尽心候命。',
    '狗奴才恭敬奉上晚间请安，给曾家主子叩首复命。愿主子卸下今日疲惫，今夜静好安宁，狗奴才收心守礼，不忘一日吩咐。',
    '灯火渐静，狗奴才给曾家主子晚间叩首请安。今日侍奉记在心中，愿主子夜里舒心、睡梦安稳，狗奴才谨候复命，不怠明日日课。',
    '狗奴才晚间跪候，给曾家主子叩首请安并复命。愿主子一日事毕、心绪安然，狗奴才回顾今日所行，以恭敬之心侍奉始终。',
    '夜深问安，狗奴才恭敬叩首拜见曾家主子。愿主子今夜安稳休息，狗奴才谨记今日吩咐，反省疏漏，明日继续认真奉侍。',
    '狗奴才给曾家主子奉上晚间叩首请安，恭敬复命。谢主子一日照拂，愿主子今夜清静安宁，狗奴才收心整肃，以尽责侍奉结束今日。'
  ],
  gratitude:[
    `狗奴才跪好叩首，恭敬向曾家主子谢恩。${gratitudeVow}恭祝三位长辈平安康健，曾家岁岁安宁。`,
    `狗奴才叩首拜谢曾家主子恩准。${gratitudeVow}谨将此愿记在心中，恭祝三位长辈福寿绵长、曾家平安顺遂。`,
    `晚间谢恩，狗奴才恭敬叩首，感谢曾家主子恩泽。${gratitudeVow}愿三位长辈日有安康、岁有福寿，狗奴才不忘此愿。`,
    `狗奴才向曾家主子叩首谢恩，谨记主子允许行礼的恩准。${gratitudeVow}愿三位长辈安稳长寿，曾家和顺安宁。`,
    `狗奴才跪候曾家主子跟前，叩首奉上谢恩之心。${gratitudeVow}谨守此愿，不忘恩准，恭祝三位长辈康健如意。`,
    `狗奴才晚间叩首，恭敬拜谢曾家主子。${gratitudeVow}愿三位长辈平安长寿，曾家岁岁顺心，狗奴才尽心守礼。`
  ]
};
export function morningGreeting(date=dayKey()) {
  return ritualGreeting('morning',date);
}
export function requireMorningPhoto(photo,date=dayKey()) {
  requireRitualPhoto(photo,'morning',date);
}
export function ritualGreeting(kind,date=dayKey()) {
  if(!RITUAL_KINDS.includes(kind))throw Error('礼仪类型无效');
  if(!validDate(date))throw Error('请安日期无效');
  const bank=greetings[kind];
  const day=Math.floor(new Date(`${date}T12:00:00Z`).getTime()/86400000);
  const cycle=Math.floor(day/bank.length);
  const offset=((cycle*7)%bank.length+bank.length)%bank.length;
  const index=(((day%bank.length)+bank.length)%bank.length+offset)%bank.length;
  return bank[index];
}
export function ritualInstruction(kind) {
  if(kind==='morning')return '请恭敬跪好，对曾家主子语音朗读以下文字，并磕头 10 个请安。';
  if(kind==='evening')return '请恭敬跪好，对曾家主子语音朗读以下文字，并磕头请安。';
  if(kind==='gratitude')return '请恭敬跪好，对曾家主子朗读以下谢恩文字，感谢恩准狗奴爸妈为曾主子的父母及姥姥行挡灾之礼，并磕头谢恩。';
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
  daily(state,kind,`完成${RITUAL_NAMES[kind]}礼仪（长按 3 秒）\n朗读文字：${phrase}${kind==='morning'?'\n磕头请安：10 个（自行完成）':''}\n拍照打卡已保存；服务器 状态请查看照片。`,date);
  state.days[date].ritualMeta ||= {};
  state.days[date].ritualMeta[kind]={phrase,photoId:photo.id,completedAt:completedAt.toISOString(),completedTime:completedAt.toTimeString().slice(0,8)};
  if(kind==='morning'){state.days[date].morningPhotoId=photo.id;state.days[date].morningPhrase=phrase;}
}
export function completeMorning(state,photo,date=dayKey()) {
  completeRitual(state,'morning',photo,date);
}
