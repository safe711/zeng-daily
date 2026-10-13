import {isOwner,mountOwner,ownerAvatarHtml,createRoleController} from './owner.js';
import {mountFamilyHeaders} from './familyheaders.js';
import {scoreCalendarHtml,mountScoreCalendar,calendarKeepsView} from './calendar.js';
import {accountBrandLine} from './branding.js';
import {collectionHtml,mountCollection} from './collection.js';
import {replaceEvidencePhoto} from './photoedit.js';
import {showStartup} from './startup.js';
import {installDialogDismissal,disclaimerHtml} from './dialogs.js';
import {openPhotoCamera,installPhotoCameras} from './camera.js';
import {showWelcome,closeWelcome,servantProfileHtml,disasterServantsHtml,mountServantProfile} from './servant.js';
import {captureDaysMatterShare,hasPendingDaysMatter,mountDaysMatter,dayRecordsHtml} from './daysmatter.js';
import {createAccountClient} from './accounts.js';
import {mountIdentity,identityKeepsView} from './identity.js';
import {dayKey,initialState,parseBackup,points,daily,completeTask,taskInDateRange,taskReminders,RITUAL_KINDS,RITUAL_NAMES} from './model.js';
import {readState,writeState} from './storage.js';
import {createHoldController} from './hold.js';
import {ritualGreeting,ritualInstruction,completeRitual,ritualEvidence} from './ritual.js';
import {savePhoto,deletePhoto,getPhoto,listPhotos,clearMedia,latestRitualPhoto,syncPhoto,resetPhotoUploads,getReport,listReports} from './photos.js';
import {archiveReport,syncPendingReports,resetReportQueue} from './reports.js';
import {ritualReport,reportText,buildShareCard,sharePrepared} from './share.js';
import {mountSubscription} from './subscriptionview.js';
import {subscriptionStatus} from './subscription.js';
import {isStaticHosting,mediaStatus} from './hosting.js';
import {createPushClient} from './pushclient.js';
import {mountShoes} from './shoeview.js';
import {getShoeReport,deleteTaskMedia,getSubscriptionMedia,saveSubscriptionMedia} from './photos.js';
import {syncPendingShoeMedia,shoeRecordKey} from './shoes.js';
import {createNotifier} from './notifications.js';
import {createLanBackup} from './lanbackup.js';
import {createUpdater} from './updater.js';
import {APP_VERSION,releaseLogHtml} from './version.js';
import {certificateGuideHtml} from './certificate.js';
import {createTask,tasksHtml,deleteTask,taskType,taskHistoryHtml} from './tasks.js';
import {mountTask} from './taskview.js';
import {buildTaskCard,syncTaskMedia} from './taskmedia.js';
import {shareTaskFile} from './taskfiles.js';
import {buildShoeCard} from './shoecard.js';
import {getShoePhoto} from './photos.js';
import {familyPageHtml} from './family.js';
const startupReady=showStartup();
installDialogDismissal();
captureDaysMatterShare();
const staticHosting=isStaticHosting();
const pushClient=createPushClient({staticHosting});
const content = document.querySelector('#content');
const seal=document.querySelector('.seal');
seal.textContent='';seal.setAttribute('role','img');seal.setAttribute('aria-label','ZENG LEGACY 龙纹标识');
const message = document.querySelector('#message');
const notify=createNotifier(message);
const checkForUpdate=createUpdater({notify});
let state;
let storageFailed = false;
try { state = readState(); } catch { state = initialState(); storageFailed = true; }
const lanBackup=createLanBackup({photos:async()=>(await listPhotos()).filter(usedRitualPhoto),records:()=>state.shoeRecords,tasks:()=>state.tasks,notify,getAccountToken:()=>accountClient?.token});
const accountClient=createAccountClient({getState:()=>state,onState:next=>{state=next;storageFailed=false;},onAuthenticated:()=>setHidden(false),onConnection:paintConnection,onWelcome:profile=>{startupReady.then(()=>{if(!hidden&&accountClient.loggedIn&&accountClient.profile?.id===profile.id){notify('');showWelcome(profile,state.servantProfile);if(isOwner(profile))ownerPortrait(document.body);}});},onChanged:()=>{const logged=accountClient.loggedIn;if(logged&&!accountWasLoggedIn){archiveEditing=false;page=isOwner(accountClient.profile)?'家规':hasPendingDaysMatter()?'档案':'今日';roleController.reset();setTimeout(()=>roleController.refresh(),0);hidden=isAccountLocked();ritualKind=null;taskDetailId=null;shoeTaskId=null;shoeRecordId=null;reportOpen=false;}accountWasLoggedIn=logged;render();},notify});
let page = '今日';
let unmountOwner=()=>{};
const roleController=createRoleController({client:accountClient,getState:()=>state,isVisible:()=>!hidden&&!document.hidden,notify,onBadge:reviews=>{const nav=document.querySelector('nav [data-page="积分"]');if(nav){nav.classList.toggle('has-new-review',reviews.some(r=>r.unread));}for(const cell of content.querySelectorAll('[data-calendar-date]')){cell.querySelector('.review-red-dot')?.remove();if(reviews.some(r=>r.unread&&r.date===cell.dataset.calendarDate))cell.insertAdjacentHTML('beforeend','<i class="review-red-dot"></i>');}}});
async function ownerPortrait(host){const owner=accountClient.profile?.id;try{let a=await getSubscriptionMedia('master-profile-photo');if(!a?.blob){const blob=await lanBackup.readProfilePhoto();a={id:'master-profile-photo',role:'profile-photo',blob};await saveSubscriptionMedia(a);}if(accountClient.profile?.id!==owner||!host.isConnected)return;for(const holder of host.querySelectorAll('[data-owner-photo]')){const img=document.createElement('img'),url=URL.createObjectURL(a.blob);photoUrls.push(url);img.src=url;img.alt='曾仪主子';holder.prepend(img);holder.querySelector('.avatar-silhouette')?.remove();}}catch{}}
setInterval(()=>roleController.refresh(),30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)roleController.refresh();});
let archiveEditing=false;
let accountWasLoggedIn=false;
let hidden = isAccountLocked();
let lockScreen=null;
let unmountServant=()=>{};
let ritualKind = null;
let cancelHold = ()=>{};
let unmountSubscription=()=>{};
let unmountShoes=()=>{};
let unmountTask=()=>{};
let unmountIdentity=()=>{};
let unmountDaysMatter=()=>{};
let unmountCollection=()=>{};
let unmountCalendar=()=>{};
let unmountFamilyHeaders=()=>{};
let taskDetailId=null;
let shoeTaskId=null;
let shoeRecordId=null;
let currentPhoto=null;
let taskShares=new Map();
function usedRitualPhoto(photo){return RITUAL_KINDS.some(kind=>ritualEvidence(state.days[photo.date],kind).photoId===photo.id);}
function discardUnusedPhoto(){if(currentPhoto&&!usedRitualPhoto(currentPhoto)){currentPhoto=null;photoKey='';}}
let photoKey='';
let photoLoading=false;
let closeRitualCamera=null;
let cameraRequest=0;
let cameraStarting=false;

let photoUrls=[];
let nasToken='';
let syncingPhotos=new Set();
try{if(!staticHosting)nasToken=sessionStorage.getItem('daily-nas-token')||'';}catch{}
const ritualNames=RITUAL_NAMES;
let reportOpen=false;
let preparedShare=null;
let preparedKey='';
let reportGeneration=0;
let preparingKey='';
let preparingShare=null;
const escape = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const input = (name,label,value='',type='text') => `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" maxlength="10000" required></label>`;
const area = (name,label,value='') => `<label>${label}<textarea name="${name}" maxlength="10000" required>${escape(value)}</textarea></label>`;
const list = items => items.length ? items.map(item=>`<article><small>${escape(item.date)}</small><p>${escape(item.text)}</p></article>`).join('') : '<p class="muted">尚无记录。</p>';
function taskFields(task={}) {
  return `<label>任务发布主子<input name="publisher" maxlength="100" value="${escape(task.publisher||'')}"></label><label>任务执行奴才<input name="executor" maxlength="100" value="${escape(task.executor||'')}"></label><label>起始日期（可留空）<input name="startDate" type="date" value="${escape(task.startDate || '')}"></label><label>结束日期（可留空，含当日）<input name="endDate" type="date" value="${escape(task.endDate || '')}"></label><label>工作命令（自行填写）<textarea name="command" maxlength="10000">${escape(task.command || '')}</textarea></label><label class="check"><input name="dailyReminder" type="checkbox" ${task.dailyReminder?'checked':''}>每日强提醒（仅应用内）</label><p class="muted">在起止日期内，每日打开应用都会醒目提示未完成的已开展任务；完成、归档或暂停后停止。不会自动生成每日任务，也没有关闭后的定时推送。</p>`;
}
function reminderPanel() {
  const tasks=taskReminders(state);
  if (!tasks.length) return '';
  return `<section class="task-reminders" role="region" aria-label="每日强提醒"><h3>每日强提醒 · ${tasks.length} 项待完成</h3>${tasks.map(task=>`<div><strong>${escape(task.title)}</strong><p>${escape(task.command || task.note)}</p><small>${task.confirmed?'用户已确认要求':'未确认为要求'}</small></div>`).join('')}<p class="muted">仅应用内提示 · 完成后停止</p><button data-page="任务">查看任务</button></section>`;
}
async function paintPushStatus(){
  await pushClient.refresh();const element=content.querySelector('#push-status');if(!element)return;
  const configured=!!pushClient.configuration?.pushConfigured;const supported=pushClient.supported();
  const installation=content.querySelector('#offline')?.closest('section');if(installation)installation.querySelector('p:last-child').textContent=configured?'主屏幕名称“ZENG LEGACY”；在下方开启自建后台提醒，仍需手机接收实测。':'主屏幕名称“ZENG LEGACY”；后台提醒须另接 服务器/Windows 持续运行的发送服务。';
  if(pushClient.configuration?.private){
    content.querySelector('section p').textContent='文字与新签名仍保存在浏览器；原契约从需登录的私有服务读取，匿名推送时间表保存在自建服务。无统计追踪。';
    const connection=content.querySelector('form[data-form="nas-connect"]');if(connection){connection.nextElementSibling?.remove();connection.replaceWith(Object.assign(document.createElement('p'),{textContent:'私有版使用登录会话传送图片，无需再次填写 服务器 账号或上传密钥。'}));}
  }
  element.textContent=staticHosting?'GitHub 静态版没有后台发送服务':!configured?'服务器/Windows 后台发送尚未配置':!supported?'后台服务已配置；请用可信 HTTPS，并在 iPhone 主屏幕开启':pushClient.registered?'此设备已登记 · 需关闭应用实测接收':'自建发送服务已配置 · 此设备尚未开启';
  content.querySelector('[data-action="enable-push"]').disabled=!configured||!supported;
  content.querySelector('[data-action="test-push"]').disabled=!configured||!pushClient.registered;
  content.querySelector('[data-action="stop-push"]').disabled=!configured||!pushClient.registered;
}
function commit(change,rerender=true) {
  if (storageFailed) throw Error('本地数据读取失败，请先导出原始数据或恢复备份，避免覆盖。');
  const draft = structuredClone(state);
  change(draft);
  writeState(draft);
  state = draft;
  if(rerender)render();
  notify('已保存到本机');
  if(ritualReport(state).allComplete)prepareReport().catch(error=>notify(`汇总图片待生成：${error.message}`));
}
function isAccountLocked(){try{return localStorage.getItem('daily-account-locked')===accountClient.profile?.id;}catch{return false;}}
function setHidden(value){hidden=value;if(value)roleController.reset();else setTimeout(()=>roleController.refresh(),0);try{if(value&&accountClient.profile?.id)localStorage.setItem('daily-account-locked',accountClient.profile.id);else localStorage.removeItem('daily-account-locked');}catch{}if(value){closeWelcome();stopCamera();}}
function paintConnection(){const online=accountClient.connected;for(const node of document.querySelectorAll('[data-server-connection]')){node.textContent=online?'在线':'离线';node.className=online?'network-online':'network-offline';}}
function removeLock(){document.body.classList.remove('is-account-locked');if(lockScreen?.open)lockScreen.close();lockScreen?.remove();lockScreen=null;content.inert=false;content.style.visibility='';document.querySelector('header').style.visibility='';document.querySelector('nav').style.visibility='';}
function paintLock(){document.body.classList.add('is-account-locked');closeWelcome();for(const dialog of document.querySelectorAll('dialog[open]:not(.content-lock)'))dialog.close();content.inert=true;content.style.visibility='hidden';document.querySelector('header').style.visibility='hidden';document.querySelector('nav').style.visibility='hidden';if(lockScreen){if(!lockScreen.open)lockScreen.showModal();return;}lockScreen=document.createElement('dialog');lockScreen.className='content-lock';lockScreen.setAttribute('role','dialog');lockScreen.setAttribute('aria-modal','true');lockScreen.setAttribute('aria-label','内容解锁');document.body.append(lockScreen);lockScreen.addEventListener('click',e=>e.stopPropagation());lockScreen.addEventListener('cancel',e=>e.preventDefault());accountClient.unlockView(lockScreen,()=>{setHidden(false);removeLock();render();});lockScreen.showModal();}
function bindFoldout(fold,key){if(fold.classList.contains('family-panel')){const summary=fold.querySelector(':scope > summary');summary?.addEventListener('click',()=>{if(!fold.open)return;const bounds=summary.getBoundingClientRect(),top=parseFloat(getComputedStyle(document.documentElement,'::before').height)||0;if(bounds.top<=top+1&&bounds.bottom>top)requestAnimationFrame(()=>{if(fold.isConnected&&!fold.open)fold.scrollIntoView({block:'start',behavior:'instant'});});});}const storeKey='daily-fold:'+accountClient.profile.id+':'+key;try{fold.open=localStorage.getItem(storeKey)==='open';}catch{}fold.addEventListener('toggle',()=>{try{localStorage.setItem(storeKey,fold.open?'open':'closed');}catch{}if(!fold.open)for(const video of fold.querySelectorAll('video'))video.pause();});}
function ritualHistoryHtml(current){return Object.entries(current.days).sort(([a],[b])=>b.localeCompare(a)).map(([date,entry])=>{const text=RITUAL_KINDS.map(kind=>ritualNames[kind]+'：'+(entry[kind]??'未记录')+(entry[kind]!==undefined?'\n完成时间：'+(ritualEvidence(entry,kind).completedTime||'时间未记录（旧数据）'):'')).join('\n\n')+(entry.legacyEvening!==undefined?'\n\n晚间复命（旧记录）：'+entry.legacyEvening:'');return '<details class="archive-fold ritual-history-row" data-history-date="'+escape(date)+'"><summary>'+escape(date)+'</summary><div class="fold-body ritual-history-body"><p>'+escape(text)+'</p></div></details>';}).join('')||'<p class="muted">尚无记录。</p>';}
function archiveFoldouts(){function group(title,key,nodes){if(!nodes.length)return;const fold=document.createElement('details');fold.className='archive-fold';fold.dataset.fold=key;const summary=document.createElement('summary');summary.textContent=title;fold.append(summary);nodes[0].before(fold);const inside=document.createElement('div');inside.className='fold-body';fold.append(inside);for(const node of nodes)inside.append(node);bindFoldout(fold,key);}
group('曾家主子','masters',[...content.querySelectorAll('.fixed-profile:not(.disaster-servant-profile):not(.servant-profile)')]);group('曾家奴才','servants',[...content.querySelectorAll('.servant-profile,.disaster-servant-profile')]);const photos=content.querySelector('#photo-album')?.closest('section');if(photos){photos.querySelector('h3')?.remove();group('礼仪照片 · 日课请安','ritual-photos',[photos]);}for(const fold of content.querySelectorAll('[data-history-date]'))bindFoldout(fold,'ritual-history:'+fold.dataset.historyDate);}
function render() {
  if(!hidden&&accountClient.loggedIn&&isOwner(accountClient.profile)&&document.querySelector('dialog[open]:not(.welcome-card):not(.content-lock)'))return;
  if(!hidden&&accountClient.loggedIn&&page==='积分'&&calendarKeepsView(accountClient.profile?.id))return;
  document.body.classList.toggle('is-account-login',!accountClient.loggedIn);
  const footerNote=document.querySelector('.site-footer-note');
  if(footerNote)footerNote.textContent=accountBrandLine(!hidden&&accountClient.loggedIn?accountClient.profile:null);
  if(hidden&&accountClient.loggedIn){paintLock();return;}
  removeLock();
  unmountOwner();unmountOwner=()=>{};
  unmountServant();unmountServant=()=>{};
  content.style.visibility='';
  unmountSubscription();unmountSubscription=()=>{};
  unmountShoes();unmountShoes=()=>{};
  unmountTask();unmountTask=()=>{};
  unmountIdentity();unmountIdentity=()=>{};
  unmountDaysMatter();unmountDaysMatter=()=>{};
  unmountCollection();unmountCollection=()=>{};
  unmountCalendar();unmountCalendar=()=>{};
  unmountFamilyHeaders();unmountFamilyHeaders=()=>{};
  cancelHold();
  stopCamera();
  for(const url of photoUrls)URL.revokeObjectURL(url);
  photoUrls=[];
  if(!accountClient.loggedIn){document.querySelector('nav').innerHTML='';document.querySelector('header small').textContent='曾氏传承 · 身份验证';accountClient.loginView(content);content.insertAdjacentHTML('beforeend','<p class="muted login-version">当前版本 '+APP_VERSION+'</p><button class="login-release-button" data-action="release-log">更新日志</button>'+releaseLogHtml()+certificateGuideHtml());return;}
  document.querySelector('header small').textContent=accountClient.profile.identity+'（'+accountClient.profile.name+'）';
  document.querySelector('nav').innerHTML = (isOwner(accountClient.profile)?['家规','奴才管理','任务管理','档案','订阅','隐私']:['家规','今日','任务','积分','档案','订阅','隐私']).map(name=>`<button data-page="${name}" class="${name==='积分'&&roleController.reviews.some(r=>r.unread)?'has-new-review':''}" aria-current="${page===name?'page':'false'}">${name==='今日'?'行礼':name==='家规'?'曾氏':name}</button>`).join('');
  document.querySelector('h1').textContent = 'ZENG LEGACY';

  const today = state.days[dayKey()] || {};
  const paused = state.settings.paused;
  const status=accountClient.connected?'<span data-server-connection class="network-online">在线</span>':'<span data-server-connection class="network-offline">离线</span>';
  const heading = `<div class="eyebrow account-presence">${escape(accountClient.profile.name)} · ${status}<time datetime="${dayKey()}">${dayKey()}</time>${paused?' · 已暂停':''}</div><h2>${page==='今日'?'每日礼仪':page==='订阅'?'订阅挡灾':page}</h2>`;
  if(isOwner(accountClient.profile)&&['奴才管理','任务管理','档案','订阅'].includes(page)){content.innerHTML=heading+'<div data-owner-host></div>';unmountOwner=mountOwner(content.querySelector('[data-owner-host]'),{client:accountClient,page,notify,getOwnerPhoto:()=>lanBackup.readProfilePhoto()});return;}
  if(isOwner(accountClient.profile)&&!['家规','隐私'].includes(page)){page='家规';render();return;}
  let body = '';
  if(page==='家规')body=familyPageHtml();
  if(page==='今日') {
    const completed=RITUAL_KINDS.filter(kind=>today[kind]!==undefined).length;
    const earned=state.ledger.filter(entry=>entry.date===dayKey()).reduce((total,entry)=>total+entry.points,0);
    body = `<section class="daily-overview"><small>今日忠诚积分</small><div class="score">${earned}</div><small>累计 ${points(state)} 分</small><progress value="${completed}" max="4" aria-label="每日礼仪完成进度"></progress><p>每日礼仪完成 ${completed} / 4</p></section><h3>每日礼仪</h3>`;
    for(const kind of RITUAL_KINDS) body += `<button class="ritual-card ${today[kind]!==undefined?'is-complete':''}" data-action="open-ritual" data-kind="${kind}"><span class="ritual-dot" aria-hidden="true">${today[kind]!==undefined?'✓':'○'}</span><span class="ritual-card-title"><strong>${ritualNames[kind]}</strong><small>${today[kind]!==undefined?`完成于 ${escape(ritualEvidence(today,kind).completedTime||'时间未记录')}`:escape(state.settings[kind]||'提醒时间未设置')}</small></span><span class="ritual-card-status">${today[kind]!==undefined?'已完成':paused?'已暂停':'待完成'}</span><span aria-hidden="true">›</span></button>`;
    body += '<p class="muted home-note">礼仪每日记录；洗鞋等手动事项请到“任务”管理。</p><section class="daily-share"><h3>今日礼仪汇总</h3><p>请安文本、打卡缩略图与每段完成时间，整理为一张分享卡。</p><button data-action="open-report">预览礼仪汇总</button><button data-action="share-day" disabled>分享至微信</button><p class="muted">四项礼仪完成后解锁分享。在系统分享菜单选择微信，再确认接收人。</p></section>';
  }
  if(page==='任务') body=tasksHtml(state,{archiveEditing}).replace('<div class="task-list">',reminderPanel()+'<div class="task-list">');
  if(page==='积分') body=collectionHtml(state)+scoreCalendarHtml(state);
  if(page==='档案') body = `<section class="fixed-profile" aria-labelledby="fixed-profile-title"><small class="eyebrow">曾家 · 固定档案</small><h3 id="fixed-profile-title">主子：曾仪</h3><div id="profile-portrait"><p class="muted">正在读取主子照片…</p></div><dl><div><dt>生日</dt><dd>2003年</dd></div><div><dt>学历</dt><dd>研究生</dd></div><div><dt>学校</dt><dd>对外经济贸易大学</dd></div><div><dt>专属狗奴</dt><dd>于涵、小姜</dd></div></dl><h4>简介</h4><p>目前负责管理曾家狗奴才，发布命令，收取贡金，办理灾祸出售等业务。</p></section><section><h3>礼仪照片 · 日课请安</h3><p>本机照片与 服务器 上传状态分别记录。文字备份不含照片，请单独下载照片或同步 服务器。</p><button data-action="sync-photos">补传待同步照片</button><div id="photo-album">正在读取照片…</div></section><h3>历日礼仪</h3>${ritualHistoryHtml(state)}`;
  if(page==='隐私') body = `<form data-form="settings">${input('morning','请安提示时间',state.settings.morning,'time')}${input('evening','复命提示时间',state.settings.evening,'time')}<label class="check"><input name="hideOnLeave" type="checkbox" ${state.settings.hideOnLeave?'checked':''}>离开应用后自动隐去内容</label><label class="check"><input name="paused" type="checkbox" ${paused?'checked':''}>暂停日课与积分操作</label><button>保存设置</button></form><section><h3>安装与更新</h3><p id="offline">正在检查离线准备状态…</p><button data-action="update">检查更新</button><button data-action="release-log">更新日志</button><p>主屏幕显示名称为“ZENG LEGACY”。此版本没有推送服务器，也没有后台定时通知。</p></section>`;
  const mediaSaved=manual=>staticHosting?(manual?lanBackup.retry():lanBackup.run()):syncTaskMedia(state.tasks,{key:nasToken}).then(()=>retryMedia()).catch(error=>notify('图片保留待补传：'+error.message));
  if(taskDetailId&&page==='任务'){unmountTask=mountTask(content,taskDetailId,{getState:()=>state,commit:change=>commit(change,false),notify,onBack:()=>{taskDetailId=null;history.replaceState(null,'',location.pathname+location.search);render();},onMediaSaved:mediaSaved});return;}
  if(shoeTaskId&&page==='任务'){
    unmountShoes=mountShoes(content,shoeTaskId,{getState:()=>state,commit:change=>commit(change,false),notify,getToken:()=>nasToken,staticHosting,onMediaSaved:mediaSaved,initialRecordId:shoeRecordId,onSelect:id=>{shoeRecordId=id;history.replaceState(null,'',`${location.pathname}${location.search}#shoes/${encodeURIComponent(shoeTaskId)}/${id}`);},onBack:()=>{shoeTaskId=null;shoeRecordId=null;history.replaceState(null,'',location.pathname+location.search);render();}});return;
  }
  if(reportOpen && page==='今日'){renderReport();return;}
  if(ritualKind && page==='今日') {renderRitual();return;}
  if(page==='今日'&&!ritualKind&&!reportOpen)body=dayRecordsHtml(state,true,accountClient.profile)+body;
  if(page==='档案')body=dayRecordsHtml(state,false,accountClient.profile)+body.replace('</section><section><h3>礼仪照片', '</section><section class="fixed-profile parents-profile" aria-labelledby="parents-profile-title"><small class="eyebrow">曾家 · 固定档案</small><h3 id="parents-profile-title">主子：曾仪父母</h3><div class="parents-photo-blank" role="img" aria-label="曾仪父母照片位置，暂时留白"></div><dl><div><dt>生日</dt><dd>未知</dd></div><div><dt>专属奴隶</dt><dd><span class="parents-servant">挡灾奴01　于耕宝</span><span class="parents-servant">挡灾奴02　杜其香</span></dd></div></dl><h4>简介</h4><p>享用曾家挡灾奴01、02号。每个月将自身灾祸出售给挡灾奴，收取钱财并换取自己平安。将自身灾祸赐予挡灾奴。</p></section>'+servantProfileHtml(state,accountClient.profile)+disasterServantsHtml()+'<section><h3>礼仪照片');
  content.innerHTML = (page==='家规'?'':heading) + body;
  if(page==='积分'){roleController.refresh();unmountCollection=mountCollection(content,{getState:()=>state,commit:change=>commit(change,false),notify,account:accountClient.profile.id,editable:false,loadMedia:id=>getSubscriptionMedia(id)});unmountCalendar=mountScoreCalendar(content,{getState:()=>state,getAccount:()=>accountClient.profile,notify,onClose:render,onMediaSaved:()=>accountClient.sync(),getReviews:()=>roleController.reviews,onReviewSeen:date=>roleController.seen(date),dayExtra:date=>{const reviews=roleController.reviews.filter(r=>r.date===date);return reviews.length?'<section class="slave-review-details"><h4>主子评价</h4>'+reviews.map(r=>'<p>'+escape(r.by)+' · '+({satisfied:'满意',neutral:'一般',angry:'不满意'})[r.rating]+'<small>'+escape(r.context==='day'?'当日表现':'任务表现')+'</small></p>').join('')+'</section>':'';}});}
  if(page==='档案')archiveFoldouts();
  if(page==='家规'&&isOwner(accountClient.profile))content.querySelector('.family-contract')?.remove();
  if(page==='家规')for(const fold of content.querySelectorAll('[data-fold]'))bindFoldout(fold,fold.dataset.fold);
  if(['今日','档案'].includes(page))unmountDaysMatter=mountDaysMatter(content,{getState:()=>state,commit,notify,getAccount:()=>accountClient.profile});
  if(page==='任务')prepareTaskShares();
  if(page==='家规')unmountFamilyHeaders=mountFamilyHeaders(content);
  if(page==='家规'&&!isOwner(accountClient.profile))unmountIdentity=mountIdentity(content,{loadMedia:id=>accountClient.loadPrivateMedia(id),getAccount:()=>accountClient.profile,getState:()=>state,commit:change=>commit(change,false),upload:(...args)=>lanBackup.uploadIdentity(...args),notify});
  if(page==='档案'){
    unmountServant=mountServantProfile(content,{getState:()=>state,getAccount:()=>accountClient.profile,loadMedia:id=>accountClient.loadPrivateMedia(id),commit,notify});
    renderProfilePortrait();
    content.insertAdjacentHTML('beforeend',taskHistoryHtml(state));
    bindFoldout(content.querySelector('.task-history-group'),'task-history');

  }
  if(page==='隐私'){content.insertAdjacentHTML('afterbegin',accountClient.settingsHtml());accountClient.bindSettings(content);if(isOwner(accountClient.profile))ownerPortrait(content);unmountServant=mountServantProfile(content,{getState:()=>state,getAccount:()=>accountClient.profile});}
  if(staticHosting&&page==='隐私')content.insertAdjacentHTML('beforeend',lanBackup.settingsHtml());
  if(page==='订阅')unmountSubscription=mountSubscription(content,state,{commit,notify,getPrivateConfig:()=>staticHosting?{contractAvailable:lanBackup.enabled}:pushClient.configuration,loadPrivateContract:staticHosting?()=>lanBackup.readContract():null});
  if(page==='今日'&&!ritualKind&&!reportOpen){
    const subscription=subscriptionStatus(state.subscription,dayKey());
    if(['due-soon','expired','pending-signature'].includes(subscription.code))content.insertAdjacentHTML('beforeend',`<section class="subscription-reminder"><h3>订阅 · ${escape(subscription.label)}</h3><p>${subscription.renewalDate?`续费日期 ${escape(subscription.renewalDate)} · `:''}仅本人自记，未核实到账。无自动扣款。</p><button data-page="订阅">查看订阅与签字</button></section>`);
  }
  if(page==='今日' && RITUAL_KINDS.every(kind=>today[kind]!==undefined))prepareReport().catch(error=>notify(error.message));
  if(page==='隐私') {
    content.querySelector('#offline').insertAdjacentHTML('beforebegin',`<p class="muted">当前版本 ${APP_VERSION}</p>`);
    content.insertAdjacentHTML('beforeend',releaseLogHtml()+certificateGuideHtml());
    const form=content.querySelector('form[data-form="settings"]');
    for(const kind of ['morning','evening'])form.querySelector(`[name="${kind}"]`).closest('label').remove();
    form.insertAdjacentHTML('afterbegin',RITUAL_KINDS.map(kind=>`<label>${ritualNames[kind]}提醒时间（可留空）<input name="${kind}" type="time" value="${escape(state.settings[kind])}"></label>`).join(''));
    const timeGroup=document.createElement('details');timeGroup.className='archive-fold privacy-time';timeGroup.innerHTML='<summary>礼仪提醒时间</summary><div class="privacy-time-fields"></div>';form.prepend(timeGroup);for(const field of [...form.querySelectorAll('input[type="time"]')])timeGroup.querySelector('.privacy-time-fields').append(field.closest('label'));bindFoldout(timeGroup,'privacy-times');form.classList.add('privacy-preferences');
    if(!staticHosting)content.insertAdjacentHTML('beforeend','<section><h3>绿联 服务器 相册</h3><p id="nas-status">正在检查连接配置…</p><p>照片保存在独立目录“日课请安”。服务器 未接通时，拍照仍可打卡，照片标为待同步。</p><form data-form="nas-connect"><label>本机上传服务连接密钥<input name="token" type="password" autocomplete="off" required></label><button>连接上传服务</button></form><p class="muted">这是本机服务密钥，不是 服务器 账户密码；仅保留在此浏览器会话中。</p><button data-action="sync-photos">补传待同步照片</button></section>');
    offlineStatus();nasStatus();
    content.insertAdjacentHTML('beforeend','<section><h3>关闭后的提醒</h3><p id="push-status">正在检查自建发送服务…</p><button data-action="enable-push" disabled>开启后台提醒</button><button data-action="test-push" disabled>发送测试提醒</button><button data-action="stop-push" disabled>停止此设备提醒</button><p class="muted">锁屏仅显示“日课”。系统权限、网络和专注模式可能影响送达，不保证精确准时。仅使用 服务器/Windows 自建发送服务。</p></section>');
    paintPushStatus();
  }
  if(page==='隐私')content.insertAdjacentHTML('beforeend','<section class="privacy-disclaimer"><button type="button" data-action="disclaimer">免责声明</button></section>'+disclaimerHtml());
  if(page==='档案')renderPhotoAlbum();
  if(staticHosting)for(const control of content.querySelectorAll('[data-action="sync-photos"],[data-action="sync-media"],[data-action="sync-photo"]'))control.remove();
  if(page==='今日'&&!ritualKind&&!reportOpen){
    content.querySelector('.daily-share')?.insertAdjacentHTML('beforeend','<p id="archive-status" role="status"></p>');
    paintArchiveStatus();
  }
}
function renderRitual() {
  const kind=ritualKind;
  const date=dayKey();
  const saved=state.days[date]?.[kind];
  const done=saved!==undefined;
  const evidence=ritualEvidence(state.days[date],kind);
  const key=`${date}:${kind}:${evidence.photoId||'draft'}`;
  if(photoKey!==key) {
    photoKey=key;currentPhoto=null;photoLoading=true;
    const pending=evidence.photoId?getPhoto(evidence.photoId):Promise.resolve(null);
    pending.then(photo=>{if(photoKey===key){currentPhoto=photo;photoLoading=false;if(ritualKind===kind&&page==='今日'&&!hidden)render();}}).catch(()=>{if(photoKey===key){photoLoading=false;notify('本机照片暂时无法读取，请重试拍照。');if(ritualKind===kind&&page==='今日'&&!hidden)render();}});
  }
  content.innerHTML=`<button class="back-button" data-action="close-ritual">‹ 返回日课</button><div class="eyebrow">${date} · ${state.settings[kind]}</div><section class="ritual-detail"><span class="ritual-emblem" aria-hidden="true">${done?'✓':'日'}</span><small>PERSONAL RITUAL</small><h2>${ritualNames[kind]}</h2><p>${done?'今日礼仪已完成。':'安静片刻，准备好后长按下方按钮。'}</p><small>${done?'已记录到本机 · 今日不重复计分':'完成后记录到本机 · 忠诚积分 +2'}</small></section>${done?`<article><h3>今日记录</h3><p>${escape(saved)}</p></article>`:'<label class="ritual-note">补充文字（可留空）<textarea id="ritual-note" maxlength="9900" placeholder="写下今天想记录的话…"></textarea></label>'}<div class="ritual-action"><button id="ritual-hold" class="hold-button" ${done||state.settings.paused?'disabled':''} aria-describedby="hold-help"><span class="hold-fill" aria-hidden="true"></span><span class="hold-label">${done?'今日已完成':state.settings.paused?'日课已暂停':'长按 3 秒 · 完成礼仪'}</span></button><p id="hold-help">${done?'明天可再次完成。':'松手或移出按钮即取消 · 键盘可持续按住空格或回车'}</p></div><p class="muted">本次礼仪仅保存在你的设备。</p>`;
  const button=document.querySelector('#ritual-hold');
  content.querySelector('.eyebrow').textContent=`${date} · ${state.settings[kind]||'提醒时间未设置'}`;
  {
    content.querySelector('.ritual-detail>p').textContent=done?'今日礼仪已完成。':'先完成请安，再拍照打卡，最后长按确认。';
    content.lastElementChild.textContent=staticHosting?'请安记录先保存在手机，回家后连同照片自动同步账号历史。':'请安记录留在本机，照片可同步至你的 服务器。';
    content.querySelector('.ritual-detail').insertAdjacentHTML('beforeend',`<div class="ritual-instruction"><p>${escape(ritualInstruction(kind))}</p><blockquote>${escape(done?(evidence.phrase||saved):ritualGreeting(kind,date))}</blockquote>${done?`<p>完成时间：${escape(evidence.completedTime||'时间未记录（旧数据）')}</p>`:''}<small>请自行朗读与完成；应用不录音，也不自动判断动作。</small></div>`);
    const photoPanel=document.createElement('section');photoPanel.className='photo-checkin';
    photoPanel.innerHTML=`<h3>拍照打卡</h3><p id="photo-status" role="status">${photoStatus(currentPhoto)}</p><div id="photo-preview"></div>${!done?`<button data-action="start-camera" ${state.settings.paused?'disabled':''}>${currentPhoto?'重新拍照':'打开相机'}</button>`:''}${currentPhoto?`<button data-action="download-photo" data-id="${escape(currentPhoto.id)}">下载照片</button>`:''}<p class="muted">${done?'旧记录无照片时不会自动补造。':'完成礼仪后保存；重新拍照会丢弃当前预览照片。'}</p>`;

    const note=content.querySelector('.ritual-note');
    if(note)note.replaceWith(photoPanel);else content.querySelector('.ritual-action').before(photoPanel);
    if(currentPhoto){const image=document.createElement('img');image.alt='本次请安打卡照片';const url=URL.createObjectURL(currentPhoto.blob);photoUrls.push(url);image.src=url;photoPanel.querySelector('#photo-preview').append(image);image.classList.add('editable-photo');image.tabIndex=0;image.setAttribute('role','button');image.title='点击查看或重新拍照';image.onclick=()=>startCamera(true).catch(error=>notify(error.message));image.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();image.click();}};}
    if(!done && !currentPhoto){button.disabled=true;button.querySelector('.hold-label').textContent=state.settings.paused?'日课已暂停':photoLoading?'正在读取照片…':'先拍照打卡，再完成礼仪';}
  }
  if(button.disabled)return;
  let pointerId=null;
  let heldKey=null;
  const label=button.querySelector('.hold-label');
  const controller=createHoldController({now:()=>performance.now(),requestFrame:callback=>requestAnimationFrame(callback),cancelFrame:frame=>cancelAnimationFrame(frame),onProgress:progress=>{
    button.style.setProperty('--hold-progress',`${progress*100}%`);
    label.textContent=progress>0?`正在完成 · ${Math.ceil((1-progress)*3)} 秒`:'长按 3 秒 · 完成礼仪';
  },onComplete:async()=>{
    pointerId=null;heldKey=null;
    try {
      if(document.hidden || hidden || dayKey()!==date)throw Error('日期或页面已变化，请重新打开礼仪');
      const photo=currentPhoto,next=structuredClone(state);completeRitual(next,kind,photo,date);button.disabled=true;await savePhoto(photo);try{if(document.hidden||hidden||dayKey()!==date||ritualKind!==kind||currentPhoto?.id!==photo.id)throw Error('页面已变化，未使用照片已取消');commit(draft=>completeRitual(draft,kind,photo,date));}catch(error){if(!usedRitualPhoto(photo))await deletePhoto(photo.id);throw error;}if(staticHosting)lanBackup.run();else if(nasToken)syncSavedPhoto(photo).catch(()=>{});
      notify(`${ritualNames[kind]}已完成 · +2`);
    }catch(error){controller.cancel();button.disabled=false;notify(error.message);}
  }});
  const cancel=()=>{pointerId=null;heldKey=null;controller.cancel();};
  cancelHold=cancel;
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0 || pointerId!==null || heldKey!==null)return;
    event.preventDefault();pointerId=event.pointerId;button.setPointerCapture(pointerId);controller.start();
  });
  button.addEventListener('pointermove',event=>{
    if(event.pointerId!==pointerId)return;
    const rect=button.getBoundingClientRect();
    if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)cancel();
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,event=>{if(event.pointerId===pointerId)cancel();});
  button.addEventListener('keydown',event=>{
    if(![' ','Enter'].includes(event.key))return;
    event.preventDefault();if(event.repeat || pointerId!==null || heldKey!==null)return;heldKey=event.key;controller.start();
  });
  button.addEventListener('keyup',event=>{if(event.key===heldKey){event.preventDefault();cancel();}});
  button.addEventListener('blur',cancel);
  button.addEventListener('contextmenu',event=>event.preventDefault());
}
function stopCamera(){cameraRequest++;cameraStarting=false;const close=closeRitualCamera;closeRitualCamera=null;close?.();}
function photoStatus(photo) {
  if(!photo)return photoLoading?'正在读取本机照片…':'尚未拍照 · 完成按钮未解锁';
  if(!usedRitualPhoto(photo))return '照片仅供预览 · 完成礼仪后才保存';
  if(staticHosting)return mediaStatus(photo,true);
  return photo.status==='uploaded'?'照片已保存到 服务器 · 日课请安':'照片已保存在本机 · 服务器 待同步';
}
async function startCamera(review=false){if(state.settings.paused)throw Error('日课已暂停');if(cameraStarting)return;const kind=ritualKind,date=dayKey(),account=accountClient.profile.id,request=++cameraRequest;if(!kind||page!=='今日')return;const original=currentPhoto;cameraStarting=true;const launch=content.querySelector('[data-action="start-camera"]');if(launch)launch.hidden=true;const download=content.querySelector('[data-action="download-photo"]');if(download)download.hidden=true;content.querySelector('#photo-preview')?.replaceChildren();closeRitualCamera=openPhotoCamera({title:'请安拍照',returnToRitual:true,initialPhoto:review?original?.blob:null,onError:notify,onClose:({captured})=>{closeRitualCamera=null;cameraStarting=false;if(!captured&&request===cameraRequest&&page==='今日'&&kind===ritualKind&&!hidden)render();},onCapture:async(file,{changed=true}={})=>{if(request!==cameraRequest||page!=='今日'||ritualKind!==kind||date!==dayKey()||hidden||accountClient.profile.id!==account)return;if(!changed){render();return;}const photo={id:crypto.randomUUID(),date,kind,source:'camera',createdAt:new Date().toISOString(),blob:file,status:'pending',remotePath:'',error:''};if(original&&usedRitualPhoto(original)){resetPhotoUploads();await savePhoto(photo);try{if(request!==cameraRequest||hidden||accountClient.profile.id!==account)throw Error('页面已变化，请重新打开照片');commit(draft=>replaceEvidencePhoto(draft,{type:'ritual',date,kind,oldId:original.id},photo.id),false);}catch(error){await deletePhoto(photo.id);throw error;}await deletePhoto(original.id);currentPhoto=photo;photoKey=date+':'+kind+':'+photo.id;photoLoading=false;render();retryMedia();notify('照片已替换，原完成时间和积分保留');}else{currentPhoto=photo;photoKey=date+':'+kind+':draft';photoLoading=false;render();notify('照片已确认，完成礼仪后保存');}}});}
function reviewRitualPhoto(original){if(hidden||state.settings.paused)return;const kind=RITUAL_KINDS.find(k=>ritualEvidence(state.days[original.date],k).photoId===original.id);if(!kind)return;stopCamera();const request=cameraRequest,account=accountClient.profile.id;closeRitualCamera=openPhotoCamera({title:original.date+' · '+ritualNames[kind],initialPhoto:original.blob,onError:notify,onClose:()=>{closeRitualCamera=null;},onCapture:async(file,{changed})=>{if(!changed||request!==cameraRequest||hidden||accountClient.profile.id!==account)return;const photo={...original,kind,id:crypto.randomUUID(),blob:file,source:'camera',createdAt:new Date().toISOString(),status:'pending',remotePath:'',error:'',fingerprint:''};resetPhotoUploads();await savePhoto(photo);try{if(request!==cameraRequest||hidden||accountClient.profile.id!==account)throw Error('页面已变化，请重新打开照片');commit(draft=>replaceEvidencePhoto(draft,{type:'ritual',date:original.date,kind,oldId:original.id},photo.id),false);}catch(e){await deletePhoto(photo.id);throw e;}await deletePhoto(original.id);await renderPhotoAlbum();retryMedia();notify('照片已替换，原礼仪时间和积分保留');}});}
async function syncSavedPhoto(photo) {
  if(staticHosting)throw Error('网页版仅保存本机图片，不提供 服务器 上传服务');
  if(syncingPhotos.has(photo.id))return false;
  syncingPhotos.add(photo.id);
  try{
    const updated=await syncPhoto(photo,nasToken);
    if(!updated)return false;
    if(currentPhoto?.id===updated.id)currentPhoto=updated;
    const label=document.querySelector('#photo-status');if(label)label.textContent=photoStatus(currentPhoto);
    notify('照片已上传至 服务器 的“日课请安”目录');
    if(page==='档案'&&!hidden)renderPhotoAlbum();
    return true;
  }finally{syncingPhotos.delete(photo.id);}
}
async function syncPendingPhotos() {
  if(staticHosting)throw Error('网页版不提供 服务器 上传服务');
  if(!nasToken)throw Error('请先在隐私页填写本机上传服务连接密钥');
  const photos=(await listPhotos()).filter(photo=>usedRitualPhoto(photo)&&photo.status!=='uploaded');
  if(!photos.length){notify('没有待同步照片');return;}
  let uploaded=0;
  for(const photo of photos){try{if(await syncSavedPhoto(photo))uploaded++;}catch(error){notify(uploaded>0?`已同步 ${uploaded} 张，其余保留在本机：${error.message}`:`照片暂未同步，已保留本机：${error.message}`);return;}}
  notify(uploaded>0?`已同步 ${uploaded} 张照片至服务器`:'没有新增照片需要备份');
}
async function paintArchiveStatus(date=dayKey()){
  const element=content.querySelector('#archive-status');if(!element)return;
  try{const report=await getReport(date);if(!element.isConnected)return;element.textContent=report?`${mediaStatus(report,staticHosting)} · ${date.slice(0,7)}/${date}.png${report.error?` · ${report.error}`:''}`:staticHosting?'完成四项礼仪后自动保存汇总到本机。':'完成四项礼仪后自动归档到 服务器。';}catch{if(element.isConnected)element.textContent='本机汇总图片读取失败，请检查存储空间。';}
}
async function renderReportArchive(){
  const element=content.querySelector('#report-archive');if(!element)return;
  try{
    const reports=(await listReports()).sort((first,second)=>second.date.localeCompare(first.date));
    if(!element.isConnected||hidden)return;
    element.innerHTML=reports.length?reports.map(report=>`<article><strong>${escape(report.date)}</strong><p>${mediaStatus(report,staticHosting)}${report.error?` · ${escape(report.error)}`:''}</p><small>${escape(report.date.slice(0,7))}/${escape(report.date)}.png</small><button data-action="download-report" data-date="${escape(report.date)}">下载本机汇总截图</button></article>`).join(''):'尚无完整礼仪汇总截图。';
  }catch{if(element.isConnected)element.textContent='本机汇总图片读取失败。';}
}
let retryingMedia=false;
async function retryMedia(){
  if(staticHosting||retryingMedia||!nasToken)return;
  retryingMedia=true;
  try{
    const reports=await syncPendingReports(nasToken);
    const shoes=await syncPendingShoeMedia(nasToken,{records:()=>state.shoeRecords});
    const photos=(await listPhotos()).filter(photo=>photo.status!=='uploaded');let uploaded=0;let failed=0;
    for(const photo of photos){try{if(await syncSavedPhoto(photo))uploaded++;}catch{failed++;}}
    if((reports.uploaded||0)+(shoes.photos||0)+(shoes.reports||0)+uploaded>0)notify(`汇总截图已同步 ${reports.uploaded}，待同步 ${reports.failed}；礼仪照片 ${uploaded}，待同步 ${failed}；洗鞋照片 ${shoes.photos}，截图 ${shoes.reports}，待同步 ${shoes.failed}`);
    await paintArchiveStatus();await renderReportArchive();await renderShoeArchive();
  }catch(error){notify(`本机图片保留待同步：${error.message}`);}finally{retryingMedia=false;}
}
async function nasStatus() {
  const element=document.querySelector('#nas-status');if(!element)return;
  if(staticHosting){element.textContent='网页版不提供 服务器 上传；图片仅保存在本机。';return;}
  try{
    const response=await fetch('./api/nas/status',{signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error();
    const result=await response.json();
    element.textContent=`礼仪照片：${result.configured?'已配置':'未配置'}；汇总截图：${result.reportsConfigured?'已配置':'未配置'}；洗鞋照片及截图：${result.shoesConfigured?'已配置':'未配置'}。连通性以实际上传结果为准。`;
  }catch{element.textContent='上传服务不可达；照片仍可保存在本机，联网后再同步。';}
}
async function renderPhotoAlbum() {
  const element=document.querySelector('#photo-album');if(!element)return;
  try{
    const photos=(await listPhotos()).filter(usedRitualPhoto).sort((first,second)=>second.createdAt.localeCompare(first.createdAt));
    if(!element.isConnected||hidden)return;
    const previousUrls=new Set([...element.querySelectorAll('img')].map(image=>image.src));
    for(const url of previousUrls)if(url.startsWith('blob:'))URL.revokeObjectURL(url);
    photoUrls=photoUrls.filter(url=>!previousUrls.has(url));
    element.replaceChildren();
    if(!photos.length){element.textContent='尚无拍照打卡记录。';return;}
    for(const photo of photos){
      const item=document.createElement('article');
      item.innerHTML=`<small>${escape(photo.date)} · ${escape(ritualNames[photo.kind]||'旧照片')} · ${ritualEvidence(state.days[photo.date],photo.kind).photoId===photo.id?'已完成礼仪的照片':'拍摄记录'}</small><p>${escape(photoStatus(photo))}</p><button data-action="download-photo" data-id="${escape(photo.id)}">下载照片</button>${!staticHosting&&photo.status!=='uploaded'?`<button data-action="sync-photo" data-id="${escape(photo.id)}">上传至 服务器</button>`:''}`;
      const image=document.createElement('img');image.alt=`${photo.date} 请安打卡照片`;image.loading='lazy';const url=URL.createObjectURL(photo.blob);photoUrls.push(url);image.src=url;image.classList.add('editable-photo');image.tabIndex=0;image.setAttribute('role','button');image.title='点击查看或重新拍照';image.onclick=()=>reviewRitualPhoto(photo);image.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();image.click();}};item.prepend(image);element.append(item);
    }
  }catch{if(element.isConnected)element.textContent='照片读取失败，请检查本机存储。';}
}
async function prepareTaskShares(){
 taskShares=new Map();const shares=taskShares;for(const task of structuredClone(state.tasks)){const button=content.querySelector('[data-action="share-task"][data-id="'+CSS.escape(task.id)+'"]');if(!button)continue;try{let blob,date;if(taskType(task)==='shoe'){const record=structuredClone(state.shoeRecords.filter(r=>r.taskId===task.id).at(-1)||{id:crypto.randomUUID(),taskTitle:task.title,date:dayKey(),createdAt:task.startedAt||'',savedAt:'',shoes:[],note:''}),prepared=await buildShoeCard(record,getShoePhoto,{allowIncomplete:true,task});blob=prepared.file;date=record.date;}else{const prepared=await buildTaskCard(task,{snapshot:true});blob=prepared.blob;date=prepared.date;}if(shares!==taskShares||!button.isConnected)return;shares.set(task.id,{blob,date,title:task.title});button.disabled=false;}catch(error){if(button.isConnected){button.textContent='截图未就绪';button.title=error.message;}}}
}
async function renderProfilePortrait(){
 const holder=content.querySelector('#profile-portrait');if(!holder)return;let displayed=false;
 const show=blob=>{if(content.querySelector('#profile-portrait')!==holder)return;const image=document.createElement('img');image.alt='曾仪的档案照片';image.className='profile-portrait';const url=URL.createObjectURL(blob);photoUrls.push(url);image.src=url;holder.replaceChildren(image);displayed=true;};
 try{const cached=await getSubscriptionMedia('master-profile-photo');if(cached?.blob)show(cached.blob);if(!staticHosting||!lanBackup.enabled||!navigator.onLine){if(!displayed)holder.innerHTML='<p class="muted">连接家庭 Wi-Fi 后自动加载主子照片，加载后可离线查看。</p>';return;}const blob=await lanBackup.readProfilePhoto();await saveSubscriptionMedia({id:'master-profile-photo',role:'profile-photo',blob});show(blob);}catch{if(!displayed&&content.querySelector('#profile-portrait')===holder)holder.innerHTML='<p class="muted">暂未连通家庭 服务器，连接家庭 Wi-Fi 后可加载主子照片。</p>';}
}
async function renderShoeArchive(){
  const element=content.querySelector('#shoe-archive');if(!element)return;
  const records=state.shoeRecords.slice().reverse();const generation=reportGeneration;
  const oldUrls=new Set([...element.querySelectorAll('img')].map(image=>image.src));for(const url of oldUrls)if(url.startsWith('blob:'))URL.revokeObjectURL(url);photoUrls=photoUrls.filter(url=>!oldUrls.has(url));element.replaceChildren();
  if(!records.length){element.textContent='尚无洗鞋照片记录。';return;}
  for(const record of records){
    try{
      const report=await getShoeReport(record.id);if(!element.isConnected||hidden||generation!==reportGeneration)return;
      const item=document.createElement('article');const current=record.savedAt&&report?.sourceKey===shoeRecordKey(record);
      item.innerHTML=`<strong>${escape(record.date)} · ${escape(record.taskTitle)} · ${record.shoes.length} 双鞋</strong><p>${current?mediaStatus(report,staticHosting):record.savedAt?'截图待生成':'待补齐照片并保存'}${report&&!current?' · 下图为先前保存的截图':''}</p><button data-action="open-shoes" data-id="${escape(record.taskId)}" data-record="${record.id}">查看前后照片与截图</button>`;
      if(report){const image=document.createElement('img');image.className='shoe-archive-thumb';image.alt=`${record.date} 洗鞋记录缩略图`;image.loading='lazy';const url=URL.createObjectURL(report.blob);photoUrls.push(url);image.src=url;item.prepend(image);}element.append(item);
    }catch{if(element.isConnected)element.textContent='洗鞋截图读取失败，请检查本机存储。';return;}
  }
}
function readRitualRoute() {
  if(captureDaysMatterShare()||hasPendingDaysMatter()){page='档案';ritualKind=null;reportOpen=false;taskDetailId=null;shoeTaskId=null;shoeRecordId=null;return;}
  taskDetailId=null;shoeTaskId=null;shoeRecordId=null;
  const taskRoute=location.hash.match(/^#task\/(.+)$/);if(taskRoute){try{taskDetailId=decodeURIComponent(taskRoute[1]);page='任务';ritualKind=null;reportOpen=false;return;}catch{taskDetailId=null;}}
  const shoes=location.hash.match(/^#shoes\/([^/]+)(?:\/([a-f0-9-]{36}))?$/);
  if(shoes){try{shoeTaskId=decodeURIComponent(shoes[1]);shoeRecordId=shoes[2]||null;page='任务';ritualKind=null;reportOpen=false;return;}catch{shoeTaskId=null;}}
  if(location.hash==='#rules'){page='家规';ritualKind=null;reportOpen=false;return;}
  if(location.hash==='#subscription'){page='订阅';ritualKind=null;reportOpen=false;return;}
  const kind=location.hash.match(/^#ritual\/(morning|noon|evening|gratitude)$/)?.[1];
  ritualKind=kind || null;
  reportOpen=false;
  if(kind)page='今日';
}
function reportCacheKey() {return `${reportGeneration}:${accountClient.profile?.id}:${accountClient.profile?.name}:${dayKey()}:${JSON.stringify(state.days[dayKey()]||{})}`;}
function paintPreparedReport(prepared) {
  for(const button of content.querySelectorAll('[data-action="share-day"],[data-action="copy-report"]'))button.disabled=!prepared.report.allComplete;
  const download=content.querySelector('[data-action="download-card"]');if(download)download.disabled=false;
  const status=content.querySelector('#report-status');if(status)status.textContent=prepared.report.allComplete?'分享卡已准备好。选择微信与接收人后确认发送。':'这是未完成预览；完成四项礼仪后解锁分享。';
  const preview=content.querySelector('#share-image');
  if(preview){const image=document.createElement('img');image.alt=`${prepared.report.date} 礼仪汇总：${prepared.report.completed}项完成，包含文本、缩略图及时间`;const url=URL.createObjectURL(prepared.file);photoUrls.push(url);image.src=url;preview.replaceChildren(image);}
}
function prepareReport() {
  const key=reportCacheKey();
  if(preparedShare && preparedKey===key){paintPreparedReport(preparedShare);return Promise.resolve(preparedShare);}
  if(preparingShare && preparingKey===key)return preparingShare;
  preparingKey=key;
  const report=ritualReport(structuredClone(state),dayKey(),accountClient.profile);
  const snapshot=JSON.stringify(state.days[report.date]||{});const epoch=reportGeneration;
  const pending=buildShareCard(report,getPhoto).then(prepared=>{
    if(epoch===reportGeneration && accountClient.profile?.id===report.account?.id && JSON.stringify(state.days[report.date]||{})===snapshot && report.allComplete){
      archiveReport(prepared,nasToken,{upload:!staticHosting}).catch(error=>notify(staticHosting?`本机汇总保存未完成：${error.message}`:`汇总截图已生成，服务器 待同步：${error.message}`)).finally(()=>{paintArchiveStatus(report.date);renderReportArchive();});
    }
    if(reportCacheKey()!==key)return null;
    preparedShare=prepared;preparedKey=key;paintPreparedReport(prepared);return prepared;
  }).finally(()=>{if(preparingShare===pending){preparingShare=null;preparingKey='';}});
  preparingShare=pending;
  return pending;
}
function renderReport() {
  const report=ritualReport(state,dayKey(),accountClient.profile);
  content.innerHTML=`<button class="back-button" data-action="close-report">‹ 返回每日礼仪</button><h2>礼仪分享预览</h2><p>${report.date} · 完成 ${report.completed} / 4</p><p id="report-status" role="status">正在生成分享卡…</p><div id="share-image"></div><button data-action="share-day" disabled>分享至微信</button><button data-action="download-card" disabled>下载分享卡</button><button data-action="copy-report" disabled>复制请安文本</button><details><summary>查看分段文本与完成时间</summary><pre class="report-text">${escape(reportText(report))}</pre></details><p class="muted">分享卡会包含你的照片与文字。系统分享只打开选择菜单，不会自动发给任何联系人；此应用不能确认微信是否已发送。</p>`;
  content.querySelector('#report-status').insertAdjacentHTML('afterend','<p id="archive-status" role="status"></p>');paintArchiveStatus(report.date);
  prepareReport().catch(error=>{const status=content.querySelector('#report-status');if(status)status.textContent=`分享卡未生成：${error.message}`;});
}
function currentPreparedReport() {
  if(!preparedShare || preparedKey!==reportCacheKey())throw Error('分享卡尚未准备好，请先打开汇总预览');
  return preparedShare;
}
async function offlineStatus() {
  const element = document.querySelector('#offline');
  if (!element) return;
  if (!('serviceWorker' in navigator) || !isSecureContext) { element.textContent='离线不可用：需要 HTTPS 或电脑 localhost。'; return; }
  const registration = await navigator.serviceWorker.getRegistration();
  element.textContent = registration?.active ? '离线缓存已安装。首次安装后请重新打开并用飞行模式验证。' : '离线缓存尚未就绪，请保持联网并稍后重开。';
}
function download(text,name) {
  const url = URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download=name; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
document.addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
document.addEventListener('click',async event=>{
  const button=event.target.closest('button'); if(!button) return;
  try {
    if(button.dataset.page) {archiveEditing=false;discardUnusedPhoto();page=button.dataset.page;ritualKind=null;reportOpen=false;taskDetailId=null;shoeTaskId=null;shoeRecordId=null;history.replaceState(null,'',location.pathname+location.search+(page==='订阅'?'#subscription':page==='家规'?'#rules':''));render();window.scrollTo(0,0);return;}
    const action=button.dataset.action;
    if(action==='disclaimer'){content.querySelector('#role-disclaimer').showModal();return;}
    if(action==='close-disclaimer'){content.querySelector('#role-disclaimer').close();return;}
    if(action==='release-log'){document.querySelector('#release-log').showModal();return;}
    if(action==='close-release-log'){document.querySelector('#release-log').close();return;}
    if(action==='certificate-guide'){document.querySelector('#certificate-guide').showModal();return;}
    if(action==='close-certificate-guide'){document.querySelector('#certificate-guide').close();return;}
    if(action==='copy-certificate-address'){const field=document.querySelector('#certificate-install-address');try{await navigator.clipboard.writeText(field.value);notify('安装地址已复制，请打开 Safari 粘贴');}catch{field.focus();field.select();notify('请长按地址复制，再打开 Safari 粘贴');}return;}

    if(action==='share-task'){const prepared=taskShares.get(button.dataset.id);if(!prepared)throw Error('任务截图正在准备，请稍后点击');try{await shareTaskFile(prepared.blob,prepared.date,prepared.title,undefined,'状态图');notify('请在分享菜单选择微信和接收人');}catch(error){if(error.name==='AbortError'){notify('已取消分享，任务记录保留');return;}throw error;}return;}
    if(action==='toggle-archive-edit'){archiveEditing=!archiveEditing;const archive=button.closest('.task-archive');archive?.classList.toggle('is-editing',archiveEditing);button.setAttribute('aria-pressed',String(archiveEditing));return;}
    if(action==='add-task'){content.querySelector('#add-task-dialog').showModal();return;}
    if(action==='close-add-task'){content.querySelector('#add-task-dialog').close();return;}
    if(action==='open-task'){location.hash='task/'+encodeURIComponent(button.dataset.id);return;}
    if(action==='open-shoes'){location.hash=`shoes/${encodeURIComponent(button.dataset.id)}${button.dataset.record?`/${button.dataset.record}`:''}`;return;}
    if(action==='enable-push'){await pushClient.enable(state.settings);await paintPushStatus();notify('后台已登记，请关闭应用实测；不代表手机已收到');return;}
    if(action==='test-push'){await pushClient.test();notify('推送通道已接受测试，请在手机锁屏核对；不代表已显示');return;}
    if(action==='stop-push'){await pushClient.stop();await paintPushStatus();notify('已停止此设备的后台提醒');return;}
    if(staticHosting&&['sync-photo','sync-photos','sync-media','lan-retry'].includes(action)){await lanBackup.retry();return;}
    if(action==='lan-disconnect'){lanBackup.disconnect();render();notify('已停止回家自动备份，本机与 服务器 照片保留');return;}
    if(action==='open-report'){ritualKind=null;reportOpen=true;if(location.hash)history.replaceState(null,'',location.pathname+location.search);render();return;}
    if(action==='close-report'){reportOpen=false;render();return;}
    if(action==='share-day'){
      try{await sharePrepared(currentPreparedReport());notify('已打开系统分享；请在微信中确认发送',3000);}catch(error){if(error.name==='AbortError'){notify('已取消分享，礼仪记录保留',3000);return;}throw error;}
      return;
    }
    if(action==='download-card'){
      const prepared=currentPreparedReport();const url=URL.createObjectURL(prepared.file);const link=document.createElement('a');link.href=url;link.download=prepared.file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);return;
    }
    if(action==='copy-report'){
      const prepared=currentPreparedReport();if(!prepared.report.allComplete)throw Error('请先完成今日四项礼仪');
      if(!navigator.clipboard?.writeText)throw Error('此设备无法复制，请展开分段文本手动复制');await navigator.clipboard.writeText(prepared.text);notify('请安文本已复制，可粘贴至微信');return;
    }
    if(action==='start-camera')await startCamera();
    if(action==='stop-camera')stopCamera();
    if(action==='download-photo'){
      const photo=currentPhoto?.id===button.dataset.id?currentPhoto:await getPhoto(button.dataset.id);if(!photo)throw Error('本机照片不存在');
      const url=URL.createObjectURL(photo.blob);const link=document.createElement('a');link.href=url;link.download=`${photo.date}-${photo.kind}-${photo.id}.jpg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    if(action==='sync-photo'){
      const photo=await getPhoto(button.dataset.id);if(!photo)throw Error('本机照片不存在');await syncSavedPhoto(photo);
    }
    if(action==='sync-photos')await syncPendingPhotos();
    if(action==='sync-media'){if(!nasToken)throw Error('请先在隐私页填写本机上传服务连接密钥');await retryMedia();}
    if(action==='download-report'){
      const report=await getReport(button.dataset.date);if(!report)throw Error('本机汇总截图不存在');
      const url=URL.createObjectURL(report.blob);const link=document.createElement('a');link.href=url;link.download=`${report.date}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    if(action==='open-ritual') {location.hash=`ritual/${button.dataset.kind}`;return;}
    if(action==='close-ritual') {discardUnusedPhoto();history.replaceState(null,'',location.pathname+location.search);ritualKind=null;render();return;}
    if(button.id==='veil') {setHidden(true);render();}
    if(action==='reveal') {setHidden(true);render();}
    if(action==='complete') commit(draft=>completeTask(draft,button.dataset.id));
    if(action==='delete-task'){
      event.preventDefault();event.stopPropagation();if(!archiveEditing||!button.closest('.task-archive'))return;
      const task=state.tasks.find(t=>t.id===button.dataset.id);if(!task)throw Error('任务不存在或已删除');if(!task.done&&task.status!=='archived')throw Error('请先将任务归档，再进入整理模式删除');
      if(!confirm('确定删除“'+task.title+'”及本机关联照片、截图？\n服务器 备份和已获得积分保留。'))return;
      let media;commit(draft=>{media=deleteTask(draft,task.id);});await deleteTaskMedia(media);notify('任务已删除，服务器 备份保留');return;
    }
    if(action==='archive') commit(draft=>{draft.tasks.find(task=>task.id===button.dataset.id).status='archived';});
    if(action==='edit') {if(state.tasks.find(t=>t.id===button.dataset.id)?.done||state.tasks.find(t=>t.id===button.dataset.id)?.status==='archived'){notify('任务已结束，不可编辑');return;}
      const task=state.tasks.find(item=>item.id===button.dataset.id);
      content.innerHTML=`<h2>编辑任务</h2><form data-form="edit" data-id="${escape(task.id)}">${input('title','标题',task.title)}${area('note','具体内容',task.note)}${taskFields(task)}<label>状态<select name="status">${['active','possible','archived'].map(value=>`<option value="${value}" ${task.status===value?'selected':''}>${{active:'已开展',possible:'尚未发生',archived:'已归档'}[value]}</option>`).join('')}</select></label><label class="check"><input name="confirmed" type="checkbox" ${task.confirmed?'checked':''}>我明确确认以上文字及工作命令为要求</label><p>修改不重置完成状态，不重复计分。</p><button>保存</button></form>`;
    }
    if(action==='export') download(JSON.stringify(state,null,2),`daily-${dayKey()}.json`);
    if(action==='raw') download(localStorage.getItem('zeng-daily-v1')??'null','daily-raw.json');
    if(action==='persist') notify(navigator.storage?.persist ? (await navigator.storage.persist()?'已允许保留；仍请导出备份':'浏览器未允许保留；请定期导出备份'):'此浏览器不支持请求保留存储');
    if(action==='update') await checkForUpdate();
    if(action==='clear' && prompt('输入 清空 确认删除全部本机记录、礼仪及洗鞋照片、洗鞋截图、汇总截图、订阅协议和本人签名。请先分别备份文字和图片。服务器 上的文件不会删除。')==='清空') {let pushStopped=true;try{await pushClient.stop();}catch{pushStopped=false;}reportGeneration++;resetReportQueue();lanBackup.disconnect();await clearMedia();writeState(initialState());state=initialState();currentPhoto=null;photoKey='';preparedShare=null;preparedKey='';storageFailed=false;render();notify(pushStopped?'本机数据已清空；服务器 文件保留':'本机数据已清空；后台停用未同步，请恢复连接后停止设备提醒');}
  } catch(error) {notify(error.message);}
});
document.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;const data=new FormData(form);const value=name=>String(data.get(name)??'');
  if(form.dataset.form==='new-task'){try{let id;const type=value('type');commit(draft=>{id=createTask(draft,{type,title:value('title'),note:value('note').trim(),plannedStart:value('plannedStart'),plannedEnd:value('plannedEnd'),publisher:value('publisher'),executor:value('executor')});});location.hash=(type==='shoe'?'shoes/':'task/')+id;}catch(error){notify(error.message);}return;}
  if(form.dataset.form==='nas-connect'){
    if(staticHosting){notify('网页版不收集 服务器 连接密钥');return;}
    nasToken=value('token');
    try{sessionStorage.setItem('daily-nas-token',nasToken);}catch{}
    form.reset();notify('连接密钥已保留在当前会话，实际连接将在上传时验证');nasStatus();retryMedia();return;
  }
  try {commit(draft=>{
    const type=form.dataset.form;
    if(draft.settings.paused && ['task','ledger'].includes(type)) throw Error('日课已暂停');
    if(type==='daily') daily(draft,form.dataset.kind,value('text'));
    const taskData=()=>({publisher:value('publisher').trim(),executor:value('executor').trim(),title:value('title').trim(),note:value('note').trim(),status:value('status'),confirmed:data.has('confirmed'),startDate:value('startDate'),endDate:value('endDate'),command:value('command').trim(),dailyReminder:data.has('dailyReminder')});
    if(type==='task') draft.tasks.push({id:crypto.randomUUID(),...taskData(),done:false});
    if(type==='edit') Object.assign(draft.tasks.find(task=>task.id===form.dataset.id),taskData());
    if(type==='ledger') {const amount=Number(value('points'));if(!Number.isSafeInteger(amount)||Math.abs(amount)>1000)throw Error('分值须为 -1000 至 1000 的整数');draft.ledger.push({date:dayKey(),kind:value('kind'),points:amount,text:value('text').trim()});}
    if(type==='profile') draft.profile={name:value('name').trim(),notes:value('notes').trim()};
    if(type==='settings') draft.settings={...Object.fromEntries(RITUAL_KINDS.map(kind=>[kind,value(kind)])),hideOnLeave:data.has('hideOnLeave'),paused:data.has('paused')};
  });if(form.dataset.form==='settings')pushClient.sync(state.settings).catch(()=>notify('设置已存本机；后台提醒更新未同步，请联网重试'));}catch(error){notify(error.message);}
});
document.addEventListener('change',async event=>{
  if(event.target.matches('[data-form="new-task"] [name="type"]')){const label=event.target.form.querySelector('[data-custom-title]');label.hidden=event.target.value!=='custom';label.querySelector('input').required=!label.hidden;return;}
  if(event.target.id!=='import') return;
  try {const file=event.target.files[0];if(!file)return;if(file.size>5_000_000)throw Error('备份超过 5 MB');const restored=parseBackup(await file.text());if(!confirm('将覆盖当前本机数据。已导出当前备份并确认继续？'))return;writeState(restored);state=restored;storageFailed=false;render();notify('备份已恢复');}catch(error){notify(`恢复失败：${error.message}`);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.settings.hideOnLeave&&accountClient.loggedIn){setHidden(true);render();}else if(!document.hidden)render();});
window.addEventListener('storage',e=>{if(e.key==='daily-account-locked'&&e.newValue===accountClient.profile?.id){hidden=true;render();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelHold();stopCamera();}});
window.addEventListener('pagehide',stopCamera);
window.addEventListener('blur',()=>cancelHold());
window.addEventListener('hashchange',()=>{discardUnusedPhoto();readRitualRoute();render();});
window.addEventListener('online',()=>{render();retryMedia();});window.addEventListener('offline',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)retryMedia();});
readRitualRoute();
render();
accountClient.boot();
retryMedia();
if(storageFailed)notify('本地读取异常，已保护原始数据。请进入隐私页恢复备份。');
if('serviceWorker' in navigator && isSecureContext) navigator.serviceWorker.register('./sw.js').then(offlineStatus).catch(()=>notify('离线安装失败，请保持联网后重新打开。'));
pushClient.refresh().then(configuration=>{if(!configuration)return;if(configuration.photosConfigured||configuration.reportsConfigured||configuration.shoesConfigured)nasToken='private-session';if(page==='订阅'&&!state.subscription.contractId)render();if(nasToken)retryMedia();});

if(staticHosting){lanBackup.run();window.addEventListener("online",()=>lanBackup.run());document.addEventListener("visibilitychange",()=>{if(!document.hidden)lanBackup.run();});setInterval(()=>{if(!document.hidden)lanBackup.run();},30000);}

installPhotoCameras(content,{notify,blocked:()=>hidden||state.settings.paused,owner:()=>accountClient.profile?.id||''});
