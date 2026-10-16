import {GROWTH_ROUTES,GROWTH_BASE_NAMES,growthIdentity,growthOptions,growthTarget,growthProgress} from './growth.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses={published:'等待本人确认',confirmed:'执行中',submitted:'等待主子评价',improve:'需要改进',deferred:'已延期',passed:'满意，通过',cancelled:'已取消',declined:'已拒绝',stopped:'已中止'};
const actions={'rules-confirm':'确认家规','management-consent':'调整角色管理范围',configure:'提前调整标准',begin:'开始阶段',choose:'选择分类',service:'满意服务记账','service-merged':'合并关联服务',publish:'发布考核',confirm:'确认考核内容',report:'提交完成情况',review:'考核评价',retry:'安排补考／恢复',defer:'延期',cancel:'取消考核',decline:'拒绝考核',stop:'中止考核',promoted:'晋升通过'};
const live=new Set();
export function growthKeepsView(id) {return [...live].some(v=>v.account===id&&v.root.contains(document.activeElement)&&document.activeElement.matches('input,textarea,select'));}
const date=v=>v?new Date(v).toLocaleString('zh-CN',{hour12:false}):'未设置';
export const growthHostHtml=(memberId='')=>'<section class="growth-panel" data-growth-member="'+esc(memberId)+'"><h3>成长与晋升</h3><p role="status">正在读取成长档案…</p></section>';
function node(key,label,state,selected,detail='') {
  return '<button type="button" class="growth-node is-'+state+'" data-growth-node="'+esc(key)+'" aria-pressed="'+(selected===key)+'"><strong>'+esc(label)+'</strong><small>'+({'complete':'已完成',current:'当前',available:'可选',locked:'未解锁',unselected:'未选路线'})[state]+'</small>'+detail+'</button>';
}
export function growthTreeHtml(g,selected) {
  const baseIndex=['entry','junior','formal'].indexOf(g.base),options=growthOptions(g);
  const basics=GROWTH_BASE_NAMES.map((name,i)=>'<div class="growth-base">'+node(['entry','junior','formal'][i],name,i<baseIndex||g.route?'complete':i===baseIndex?'current':'locked',selected)+'</div>').join('');
  function routeRow(id){const record=g.routes[id],available=options.includes(id);return '<div class="growth-route-row">'+[1,2,3].map(star=>{
    const state=g.route===id&&record.stars===star?'current':record?.stars>=star?'complete':star===1&&available?'available':record||available?'unselected':'locked';
    return node(id+':'+star,GROWTH_ROUTES[id].name+' '+'★'.repeat(star),state,selected);
  }).join('<span class="growth-arrow" aria-hidden="true">→</span>')+'</div>';}
  return '<div class="growth-tree-scroll" tabindex="0" aria-label="从左向右的成长树，可横向及纵向滚动"><div class="growth-tree">'+basics+
    '<div class="growth-roots">'+['dog','private','disaster'].map(routeRow).join('')+'</div><div class="growth-children">'+
    '<div>'+['guard','housework','tribute'].map(routeRow).join('')+'</div><div>'+['intimate','bathroom'].map(routeRow).join('')+'</div><p class="muted">挡灾奴暂不设下层分类</p></div></div></div><div class="growth-tree-controls"><button type="button" data-growth-view="start">← 成长起点</button><button type="button" data-growth-view="current">当前身份</button></div>';
}
function requirements(p) {
  if(!p)return '<p>当前资格已完成；可查看并选择已解锁路线。</p>';
  return '<p>目标：'+esc(p.target.label)+' · '+(p.started?'标准已锁定':'尚未开始')+'</p><ul>'+
    (p.rules.days!==undefined?'<li>完整四项日课：'+p.days+' / '+p.rules.days+' 天</li>':'')+
    '<li>满意任务：'+p.tasks+' / '+p.rules.tasks+' 次'+(p.target.stage==='star3'?'（二星通过后另计）':'')+'</li>'+
    (p.rules.rules?'<li>需本人确认家规</li>':'')+'<li>达到次数只解锁考核，主子明确“满意，通过”后才晋升。</li></ul>';
}
function examHtml(e,owner){
  if(!e)return '<p class="muted">尚无本阶段考核</p>';
  const active=['published','confirmed','submitted','improve','deferred'].includes(e.status);
  return '<article class="growth-exam"><h4>'+esc(e.label)+'考核 · '+esc(statuses[e.status])+'</h4><dl><dt>具体内容</dt><dd>'+esc(e.content)+'</dd><dt>通过标准</dt><dd>'+esc(e.criteria)+'</dd><dt>截止时间</dt><dd>'+esc(date(e.dueAt))+'</dd></dl>'+
    (e.report?'<h5>完成情况</h5><p>'+esc(e.report)+'</p>':'')+(e.comment?'<h5>评价</h5><p>'+esc(e.comment)+'</p>':'')+
    (active?'<div data-exam-id="'+esc(e.id)+'">'+
      (!owner&&e.status==='published'?'<button data-growth-action="confirm">已读具体内容，同意执行</button><button data-growth-action="decline">拒绝本次考核</button>':'')+
      (!owner&&e.status==='confirmed'?'<form data-growth-form="report"><label>普通非性服务完成情况<textarea name="report" maxlength="2000" required></textarea></label><button>提交完成情况</button></form>':'')+
      (owner&&e.status==='submitted'?'<form data-growth-form="review"><label>评价<textarea name="comment" maxlength="1000" required></textarea></label><label>结果<select name="result"><option value="improve">需要改进</option><option value="pass">满意，通过</option></select></label><label class="growth-check"><input type="checkbox" name="satisfied">我明确确认满意，通过（晋升时必选）</label><button>保存考核评价</button></form>':'')+
      (owner&&['improve','deferred'].includes(e.status)?'<button data-growth-action="retry">'+(e.status==='improve'?'安排补考，重新确认':'恢复考核，重新确认')+'</button>':'')+
      (e.status!=='deferred'?'<details><summary>延期</summary><form data-growth-form="defer"><label>原因<input name="reason" maxlength="1000" required></label><label>延期至<input name="dueAt" type="datetime-local" required></label><button>保存延期</button></form></details>':'')+
      (owner?'<button data-growth-action="cancel">取消本次考核</button>':'<button data-growth-action="stop">中止本次考核</button>')+'</div>':'')+
    '<details><summary>考核过程记录</summary>'+e.history.map(h=>'<p>'+esc(date(h.at))+' · '+esc(actions[h.action]||h.action)+' · '+esc(h.by)+(h.report?'<br>'+esc(h.report):'')+(h.comment?'<br>'+esc(h.comment):'')+(h.reason?'<br>'+esc(h.reason):'')+'</p>').join('')+'</details></article>';
}
export function mountGrowth(root,{client,memberId=client.profile.id,notify=()=>{}}) {
  if(!root)return()=>{};
  const account=client.profile.id,owner=client.profile.role==='owner',view={account,root};live.add(view);
  let alive=true,data=null,selected=null,busy=false;
  const valid=()=>alive&&client.loggedIn&&client.profile?.id===account&&root.isConnected;
  const path='growth/'+encodeURIComponent(memberId);
  function serviceForm(){const source=data.sources,g=data.growth;
    const options=(values,prefix)=>'<option value="">不选择</option>'+values.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.title)+' · '+(g.services.some(e=>e.aliases.includes(prefix+s.id))?'已记账':'未记账')+'</option>').join('');
    return '<details><summary>确认满意服务／合并任务与差事</summary><form data-growth-form="service"><p>同一服务同时有任务和差事时，请同时选择两条记录。关联后仅计一次；重复评价、补图与同步不增加次数。</p><label>已完成任务<select name="taskId">'+options(source.tasks,'task:')+'</select></label><label>已验收差事<select name="dutyId">'+options(source.duties,'duty:')+'</select></label><label class="growth-check"><input type="checkbox" name="satisfied" required>满意，确认完成</label><label class="growth-check"><input type="checkbox" name="nonsexual" required>普通非性服务；同时选择的记录属于同一次服务</label><button>确认记账或合并</button></form></details>';
  }
  function configure(){return '<details><summary>提前调整尚未开始阶段的要求</summary><form data-growth-form="configure"><label>阶段<select name="stage"><option value="junior">入门 → 初级</option><option value="formal">初级 → 正式</option><option value="star2">★ → ★★</option><option value="star3">★★ → ★★★</option></select></label><label>满意任务次数<input name="tasks" type="number" min="0" max="1000" required></label><label data-base-rule>完整四项日课天数<input name="days" type="number" min="0" max="3650" required></label><label class="growth-check" data-base-rule><input name="rules" type="checkbox">需要本人确认家规</label><p>开始后标准锁定；考核发布后具体内容及通过标准也不能追加。</p><button>保存提前约定</button></form></details>';}
  function selectedDetail(g){
    const [route,star]=selected.split(':'),r=GROWTH_ROUTES[route];
    if(!r){const index=['entry','junior','formal'].indexOf(route);return '<h4>'+esc(GROWTH_BASE_NAMES[index])+'</h4>'+ (route==='entry'?'<p>成长起点，原有账号身份和契约历史另行保留。</p>':requirements(growthProgress(g,data.state,{key:route,stage:route,route:null,label:GROWTH_BASE_NAMES[index]})));}
    const chosen=g.route===route,record=g.routes[route],selectable=growthOptions(g).includes(route);
    const p=Number(star)>1?growthProgress(g,data.state,{key:route+':star'+star,stage:'star'+star,route,label:r.name+' '+'★'.repeat(Number(star))}):null;
    return '<h4>'+esc(r.name)+' '+'★'.repeat(Number(star))+'</h4><p>'+esc(r.service)+'</p>'+
      (r.sensitive?'<p>私密分类默认不进入公开分享。身份标签不代表同意任何现实身体或私密活动。</p>':'')+
      (r.parent?'<p>需保留 '+esc(GROWTH_ROUTES[r.parent].name)+' ★★★资格；新子类从★开始，父类与其他分类历史继续保留。</p>':'')+
      (p?requirements(p):'<p>首次选择即为★；回到旧分类恢复其原有星级。</p>')+
      (record?'<p>已取得：'+esc(r.name)+' '+'★'.repeat(record.stars)+'</p>':'')+
      (!chosen&&selectable?(owner?'<form data-growth-form="choose"><input type="hidden" name="route" value="'+route+'"><label>改类原因<input name="reason" maxlength="1000" required></label><button '+(!g.managementConsent?'disabled':'')+'>主子直接改类</button><p>需要本人事先同意角色管理范围；变更会通知本人。</p></form>':'<button data-growth-action="choose" data-route="'+route+'">选择此分类</button>'):'');
  }
  function centerTree(key){const scroll=root.querySelector('.growth-tree-scroll'),button=[...root.querySelectorAll('[data-growth-node]')].find(b=>b.dataset.growthNode===key);if(!scroll||!button)return;const a=button.getBoundingClientRect(),b=scroll.getBoundingClientRect();scroll.scrollLeft+=a.left-b.left-(scroll.clientWidth-a.width)/2;scroll.scrollTop=Math.max(0,scroll.scrollTop+a.top-b.top-12);}
  function paint(){if(!valid())return;const old=root.querySelector('.growth-tree-scroll'),position=old?{left:old.scrollLeft,top:old.scrollTop}:null;const g=data.growth,p=growthProgress(g,data.state),target=growthTarget(g);
    selected??=g.route?g.route+':'+g.routes[g.route].stars:g.base;
    root.innerHTML='<h3>成长与晋升</h3><p class="growth-current">'+esc(data.member.name)+' · <strong>'+esc(growthIdentity(g))+'</strong></p><p class="muted">原有身份：'+esc(g.legacyIdentity||data.member.legacyIdentity)+'。成长分类不会改变账号权限。</p>'+growthTreeHtml(g,selected)+
      '<div class="growth-node-detail">'+selectedDetail(g)+'</div><section><h4>当前晋升进度</h4>'+requirements(p)+
      (!owner?'<button data-growth-action="rules-confirm">'+(g.rulesConfirmedAt?'已确认家规':'本人确认家规')+'</button><label class="growth-check"><input type="checkbox" data-growth-consent '+(g.managementConsent?'checked':'')+'>同意主子在成长分类管理范围内直接改类（可撤回）</label>':'')+
      (target&&!p.started?'<button data-growth-action="begin">开始本阶段并锁定要求</button>':'')+
      (owner?configure()+serviceForm():'')+
      (owner&&p?.ready&&!g.exams.some(e=>['published','confirmed','submitted','improve','deferred'].includes(e.status))?'<details><summary>发布'+esc(target.label)+'考核</summary><form data-growth-form="publish"><label>具体普通非性服务内容<textarea name="content" maxlength="2000" required></textarea></label><label>明确通过标准<textarea name="criteria" maxlength="2000" required></textarea></label><label>截止时间（可选）<input name="dueAt" type="datetime-local"></label><label class="growth-check"><input name="nonsexual" type="checkbox" required>仅普通非性服务，不要求私密影像或熬夜</label><button>发布，等待本人确认</button></form></details>':'')+
      examHtml(p?.exam,owner)+'</section><details><summary>全历史与资格记录</summary>'+g.history.slice().reverse().map(h=>'<p>'+esc(date(h.at))+' · '+esc(actions[h.action]||h.action)+' · '+esc(h.by)+
        (h.action==='choose'?'<br>'+esc(h.from?GROWTH_ROUTES[h.from].name:'正式奴才')+' → '+esc(GROWTH_ROUTES[h.to].name)+' · '+esc(h.reason):'')+(h.identity?'<br>'+esc(h.identity):'')+'</p>').join('')+
      g.exams.filter(e=>e.id!==p?.exam?.id).slice().reverse().map(e=>examHtml(e,owner)).join('')+'</details><p class="muted">忠诚积分继续用于原有兑换，不能购买星级。拒绝、中止、延期与补考不扣分、不清空历史，也不自动派生惩罚。用杯子接水与陪伴仅按普通非性任务记录，不按金额或时长倍增。</p><button data-growth-refresh>重新读取</button><p data-growth-status role="status"></p>';
    const f=root.querySelector('[data-growth-form="configure"]');if(f){const update=()=>{const stage=f.elements.stage.value,r=g.rules[stage],base=['junior','formal'].includes(stage);f.elements.tasks.value=r.tasks;f.elements.days.value=r.days??0;f.elements.days.required=base;f.elements.rules.checked=!!r.rules;f.querySelectorAll('[data-base-rule]').forEach(e=>e.hidden=!base);};f.elements.stage.onchange=update;update();}
    const scroll=root.querySelector('.growth-tree-scroll');if(position){scroll.scrollLeft=position.left;scroll.scrollTop=position.top;}else centerTree(selected);
  }
  function accept(next){if((next.revision??0)<(data?.revision??0))return;data=next;paint();}
  async function load(){try{const next=await client.control(path);if(!valid())return;accept(next);}catch(e){if(valid()){if(data){const status=root.querySelector('[data-growth-status]');if(status)status.textContent=e.message;return;}root.innerHTML='<h3>成长与晋升</h3><p role="status">'+esc(e.message)+'</p><button data-growth-refresh>重新读取</button>';}}}
  async function send(input){if(busy||!valid())return;busy=true;const disabled=new Map([...root.querySelectorAll('button')].map(b=>[b,b.disabled]));root.setAttribute('aria-busy','true');root.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const next=await client.control(path,{method:'POST',data:{...input,requestId:crypto.randomUUID()}});if(!valid())return;accept(next);notify('成长档案已保存');}
    catch(e){if(valid()){const status=root.querySelector('[data-growth-status]');if(status)status.textContent=e.message;else notify(e.message);for(const [button,wasDisabled]of disabled)button.disabled=wasDisabled;}}
    finally{busy=false;root.removeAttribute('aria-busy');}}
  function click(e){const b=e.target.closest('button');if(!b||!root.contains(b)||busy)return;
    if(b.dataset.growthView){const g=data.growth;selected=b.dataset.growthView==='start'?'entry':g.route?g.route+':'+g.routes[g.route].stars:g.base;paint();centerTree(selected);return;}
    if(b.dataset.growthNode){selected=b.dataset.growthNode;paint();return;}
    if(b.hasAttribute('data-growth-refresh')){load();return;}
    if(b.dataset.growthAction){e.preventDefault();send({action:b.dataset.growthAction,route:b.dataset.route,examId:b.closest('[data-exam-id]')?.dataset.examId});}}
  function submit(e){const form=e.target.closest('[data-growth-form]');if(!form||!root.contains(form))return;e.preventDefault();e.stopPropagation();
    const input={...Object.fromEntries(new FormData(form)),action:form.dataset.growthForm,examId:form.closest('[data-exam-id]')?.dataset.examId};
    for(const key of ['satisfied','nonsexual'])input[key]=form.elements[key]?.checked===true;
    if(input.dueAt)input.dueAt=new Date(input.dueAt).toISOString();
    if(input.action==='configure'){input.rules={tasks:Number(input.tasks)};if(['junior','formal'].includes(input.stage))Object.assign(input.rules,{days:Number(input.days),rules:form.elements.rules.checked});}
    send(input);}
  function change(e){if(e.target.matches('[data-growth-consent]'))send({action:'management-consent',agreed:e.target.checked});}
  root.addEventListener('click',click);root.addEventListener('submit',submit);root.addEventListener('change',change);load();
  return()=>{alive=false;live.delete(view);root.removeEventListener('click',click);root.removeEventListener('submit',submit);root.removeEventListener('change',change);};
}
