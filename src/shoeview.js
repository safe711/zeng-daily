import {dayKey,MAX_SHOES,createShoeRecord,addShoe,removeEmptyShoe,attachShoePhoto,saveShoeRecord} from './model.js';
import {getShoePhoto,deleteShoePhoto,getShoeReport,mediaGeneration} from './photos.js';
import {importShoePhoto,syncShoePhoto,archiveShoeCard,syncPendingShoeMedia,shoeRecordKey,shoePhotoPath} from './shoes.js';
import {requireShoePhotos,buildShoeCard} from './shoecard.js';
import {mediaStatus} from './hosting.js';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function shoeRecordHtml(record,{paused=false,staticHosting=false,note=record.note}={}){
  const disabled=paused?'disabled':'';
  const pairs=record.shoes.map((shoe,index)=>{
    const photos=['before','after'].map(phase=>`<section><h4>${phase==='before'?'洗之前':'洗之后'}</h4><div class="shoe-photo-preview" data-shoe-preview="${shoe.id}-${phase}"></div><small data-shoe-status="${shoe.id}-${phase}">${shoe[`${phase}PhotoId`]?'正在读取照片…':'尚未添加照片'}</small><label>选择照片<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" aria-label="鞋子 ${index+1} ${phase==='before'?'洗之前':'洗之后'}选择照片" data-shoe-id="${shoe.id}" data-shoe-phase="${phase}" ${disabled}></label><label>拍摄照片<input type="file" accept="image/*" capture="environment" aria-label="鞋子 ${index+1} ${phase==='before'?'洗之前':'洗之后'}拍摄照片" data-shoe-id="${shoe.id}" data-shoe-phase="${phase}" ${disabled}></label><button data-shoe-action="download-photo" data-shoe-id="${shoe.id}" data-shoe-phase="${phase}" ${shoe[`${phase}PhotoId`]?'':'disabled'}>下载照片</button></section>`).join('');
    const remove=record.shoes.length>1&&!shoe.beforePhotoId&&!shoe.afterPhotoId?`<button data-shoe-action="remove-empty" data-shoe-id="${shoe.id}" ${disabled}>移除空项</button>`:'';
    return `<article><h3>鞋子 ${index+1}</h3>${remove}<div class="shoe-photo-grid">${photos}</div></article>`;
  }).join('');
  const addLabel=record.shoes.length>=MAX_SHOES?`本次已添加 ${MAX_SHOES} 双鞋`:`＋ 添加鞋子 ${record.shoes.length+1}`;
  return `<section class="shoe-record"><h3>${escape(record.date)} · ${record.savedAt?'记录已保存':'待保存'}</h3><div class="shoe-pairs">${pairs}</div><button data-shoe-action="add" ${paused||record.shoes.length>=MAX_SHOES?'disabled':''}>${addLabel}</button><label>本次洗鞋备注<textarea data-shoe-note maxlength="2000" ${disabled}>${escape(note)}</textarea></label><button data-shoe-action="save" ${disabled}>保存记录并生成截图</button><p>每双鞋补齐前后照片后，保存一张含缩略图的记录截图；不会替你完成任务或重复计分。</p><p class="muted">${staticHosting?'网页版：照片与截图仅保存在本机。':'照片与截图分别显示 NAS 状态，上传失败保留待同步。'}</p></section><section><h3>洗鞋记录截图</h3><p data-shoe-report-status>正在读取截图…</p><div class="shoe-report-preview" data-shoe-report-preview></div><button data-shoe-action="download-report">下载本机记录截图</button>${staticHosting?'':'<button data-shoe-action="sync">补传洗鞋照片与截图</button>'}</section>`;
}
export function mountShoes(container,taskId,{getState,commit,notify,getToken,staticHosting,initialRecordId,onSelect,onBack}){
  let active=true;let recordId=initialRecordId;let noteDraft;let busy=false;let epoch=0;let urls=[];
  const record=()=>getState().shoeRecords.find(item=>item.id===recordId&&item.taskId===taskId);
  function disposeUrls(){for(const url of urls)URL.revokeObjectURL(url);urls=[];}
  function image(parent,blob,alt){const element=document.createElement('img');const url=URL.createObjectURL(blob);urls.push(url);element.src=url;element.alt=alt;element.loading='lazy';parent.replaceChildren(element);}
  async function paint(){
    if(!active)return;const generation=++epoch;disposeUrls();const state=getState();const task=state.tasks.find(item=>item.id===taskId);const records=state.shoeRecords.filter(item=>item.taskId===taskId).slice().reverse();
    if(!task){container.innerHTML='<p>任务不存在。</p>';return;}
    if(!record())recordId=records[0]?.id||null;const current=record();if(noteDraft===undefined)noteDraft=current?.note||'';
    container.innerHTML=`<button class="back-button" data-shoe-action="back">‹ 返回任务</button><h2>${escape(task.title)} · 前后对照</h2><section><label>本次洗鞋日期<input data-shoe-date type="date" value="${dayKey()}" max="${dayKey()}" ${state.settings.paused?'disabled':''}></label><button data-shoe-action="create" ${state.settings.paused||task.status!=='active'?'disabled':''}>新建一次洗鞋记录</button>${records.length?`<label>查看洗鞋记录<select data-shoe-select>${records.map(item=>`<option value="${item.id}" ${item.id===recordId?'selected':''}>${item.date} · ${item.shoes.length} 双鞋 · ${item.savedAt?'已保存':'待保存'} · ${item.id.slice(0,8)}</option>`).join('')}</select></label>`:'<p>新建记录后，按鞋子逐一添加洗之前、洗之后的照片。</p>'}</section>${current?shoeRecordHtml(current,{paused:state.settings.paused,staticHosting,note:noteDraft}):''}`;
    if(busy)for(const control of container.querySelectorAll('button,input,select,textarea'))control.disabled=true;
    if(!current)return;
    try{
      for(const [index,shoe] of current.shoes.entries())for(const phase of ['before','after']){
        const id=shoe[`${phase}PhotoId`];if(!id)continue;const photo=await getShoePhoto(id);if(!active||generation!==epoch)return;
        const status=container.querySelector(`[data-shoe-status="${shoe.id}-${phase}"]`);
        if(!photo||photo.recordId!==current.id||photo.shoeId!==shoe.id||photo.phase!==phase){status.textContent='照片未留存，请重新选择';continue;}
        image(container.querySelector(`[data-shoe-preview="${shoe.id}-${phase}"]`),photo.blob,`鞋子 ${index+1} · ${phase==='before'?'洗之前':'洗之后'}`);status.textContent=mediaStatus(photo,staticHosting)+(photo.error?` · ${photo.error}`:'');
      }
      const report=await getShoeReport(current.id);if(!active||generation!==epoch)return;
      const status=container.querySelector('[data-shoe-report-status]');const matches=report&&current.savedAt&&report.sourceKey===shoeRecordKey(current);
      status.textContent=report?`${matches?'当前记录':'先前保存的截图，修改后须重新保存'} · ${mediaStatus(report,staticHosting)}${report.error?` · ${report.error}`:''}`:'保存完整前后照片后生成截图。';
      container.querySelector('[data-shoe-action="download-report"]').disabled=!matches;
      if(report)image(container.querySelector('[data-shoe-report-preview]'),report.blob,`${current.date} 洗鞋记录截图，含洗前洗后缩略图`);
    }catch(error){if(active&&generation===epoch)notify(`照片读取未完成：${error.message}`);}
  }
  function download(blob,name){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  async function retry(){
    if(staticHosting)throw Error('网页版暂不提供 NAS 上传');const token=getToken();if(!token)throw Error('请先在隐私页连接 NAS 上传服务');
    const result=await syncPendingShoeMedia(token,{records:()=>getState().shoeRecords});if(active){await paint();notify(`洗鞋照片已同步 ${result.photos} 张，截图 ${result.reports} 张，待同步 ${result.failed} 项`);}
  }
  async function click(event){
    const button=event.target.closest('button[data-shoe-action]');if(!button)return;event.stopPropagation();if(busy)return;
    const action=button.dataset.shoeAction;
    try{
      if(action==='back'){onBack();return;}
      if(action==='create'){const date=container.querySelector('[data-shoe-date]').value;commit(state=>{recordId=createShoeRecord(state,taskId,date);});noteDraft='';onSelect(recordId);await paint();return;}
      if(action==='add'){commit(state=>addShoe(state,recordId));await paint();return;}
      if(action==='remove-empty'){commit(state=>removeEmptyShoe(state,recordId,button.dataset.shoeId));await paint();return;}
      if(action==='download-photo'){
        const current=record();const shoe=current.shoes.find(item=>item.id===button.dataset.shoeId);const photo=await getShoePhoto(shoe[`${button.dataset.shoePhase}PhotoId`]);if(!photo||photo.recordId!==current.id)throw Error('本机照片未留存');download(photo.blob,shoePhotoPath(photo).split('/').at(-1));return;
      }
      if(action==='download-report'){const current=record();const report=await getShoeReport(current.id);if(!report||report.sourceKey!==shoeRecordKey(current)||!current.savedAt)throw Error('请先重新保存记录并生成截图');download(report.blob,`${current.date}-${current.id}.png`);return;}
      if(action==='sync'){await retry();return;}
      if(action==='save'){
        busy=true;const generation=mediaGeneration();const current=structuredClone(record());const snapshot=shoeRecordKey(current);await paint();await requireShoePhotos(current,getShoePhoto);
        if(generation!==mediaGeneration()||!record()||snapshot!==shoeRecordKey(record()))throw Error('记录已经变化，请重新保存');
        commit(state=>saveShoeRecord(state,current.id,noteDraft));const saved=structuredClone(record());const prepared=await buildShoeCard(saved,getShoePhoto);
        if(generation!==mediaGeneration()||!record()||shoeRecordKey(saved)!==shoeRecordKey(record()))return;
        await archiveShoeCard(prepared,getToken(),{upload:false});notify('洗鞋记录与前后对照截图已保存到本机');
        if(!staticHosting&&getToken())retry().catch(error=>{if(active)notify(`洗鞋图片保留待同步：${error.message}`);});
      }
    }catch(error){if(active)notify(error.message);}finally{busy=false;if(active&&action==='save')await paint();}
  }
  async function change(event){
    const input=event.target;
    if(input.matches('[data-shoe-select]')){recordId=input.value;noteDraft=record()?.note||'';onSelect(recordId);await paint();return;}
    if(!input.matches('input[type="file"][data-shoe-id]'))return;event.stopPropagation();const file=input.files?.[0];if(!file||busy)return;
    busy=true;const current=structuredClone(record());const generation=mediaGeneration();await paint();let photo;
    try{
      if(getState().settings.paused)throw Error('日课已暂停');photo=await importShoePhoto(file,{date:current.date,recordId:current.id,shoeId:input.dataset.shoeId,phase:input.dataset.shoePhase});
      if(generation!==mediaGeneration())return;
      try{commit(state=>attachShoePhoto(state,current.id,photo.shoeId,photo.phase,photo.id));}catch(error){await deleteShoePhoto(photo.id);throw error;}
      notify('照片已保存到本机');
      if(!staticHosting&&getToken())syncShoePhoto(photo,getToken()).catch(error=>{if(active)notify(`照片已保留，NAS 待同步：${error.message}`);}).finally(()=>{if(active)paint();});
    }catch(error){if(active)notify(error.message);}finally{busy=false;if(active)await paint();}
  }
  function input(event){if(event.target.matches('[data-shoe-note]'))noteDraft=event.target.value;}
  container.addEventListener('click',click);container.addEventListener('change',change);container.addEventListener('input',input);paint();
  return ()=>{active=false;epoch++;disposeUrls();container.removeEventListener('click',click);container.removeEventListener('change',change);container.removeEventListener('input',input);};
}
