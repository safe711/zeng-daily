import {getServerOrigin} from './server.js';
import {listPhotos,listReports,listShoePhotos,listShoeReports,syncPhoto} from './photos.js';
import {listSubscriptionMedia} from './photos.js';
import {syncTaskMedia} from './taskmedia.js';
import {syncPendingReports} from './reports.js';
import {syncPendingShoeMedia} from './shoes.js';

export function validateLanUrl(value){
  const url=new URL(value);
  const parts=url.hostname.split('.').map(Number);
  const privateIp=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31);
  if(url.protocol!=='https:'||!privateIp||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('请输入家庭 服务器 的 HTTPS 局域网地址');
  return url.origin;
}
export function createLanBackup({records=()=>[],tasks=()=>[],notify=()=>{},getAccountToken=null,storage=globalThis.localStorage,fetcher=globalThis.fetch,online=()=>globalThis.navigator?.onLine!==false,photos=listPhotos,reports=listReports,shoePhotos=listShoePhotos,shoeReports=listShoeReports,sendPhoto=syncPhoto,sendReports=syncPendingReports,sendShoes=syncPendingShoeMedia}={}){
  let config=null,busy=false,pairing=null,lastStatus='正在等待家庭 服务器 自动连接';
  let disabled=false;try{disabled=storage.getItem('daily-lan-disabled')==='true';}catch{}
  try{const saved=JSON.parse(storage.getItem('daily-lan-backup'));if(saved?.key&&saved.key.length>=32&&saved.key.length<=256)config={url:validateLanUrl(saved.url),key:saved.key};}catch{}
  if(config)lastStatus='已保存本机连接，回家后自动备份';
  function paintStatus(text){lastStatus=text;const node=globalThis.document?.querySelector('[data-lan-status]');if(node)node.textContent=text;}
  function connectionError(error){if(error.name==='TimeoutError'||error.name==='AbortError')return '手机连接 服务器 超时，请点击下方连接检测页';if(error instanceof TypeError)return '手机的网络请求未能到达 服务器，请点击下方连接检测页';return error.message||'服务器 连接尚未完成';}
  function save(url,key){
    url=validateLanUrl(url);key=key.trim();if(key.length<32||key.length>256)throw Error('请填写日课独立访问密钥');
    const next={url,key};storage.setItem('daily-lan-backup',JSON.stringify(next));config=next;disabled=false;storage.removeItem('daily-lan-disabled');
  }
  function disconnect(){storage.removeItem('daily-lan-backup');storage.setItem('daily-lan-disabled','true');disabled=true;config=null;}
  async function connect(){
    if(getAccountToken){const accountToken=getAccountToken();if(accountToken)return {url:getServerOrigin(),key:accountToken,account:true};throw Error('请先登录曾家家奴账号');}
    /* Legacy device pairing retained only for older configuration compatibility. */
    if(config)return config;if(disabled||!online())throw Error('请在家里的 Wi-Fi 打开软件以连接 服务器');
    if(pairing)return pairing;
    pairing=(async()=>{
      let candidate;try{candidate=JSON.parse(storage.getItem('daily-lan-device'));}catch{}
      if(!candidate?.id||!candidate?.token){candidate={id:crypto.randomUUID(),token:'device-'+crypto.randomUUID()+'-'+crypto.randomUUID()};storage.setItem('daily-lan-device',JSON.stringify(candidate));}
      const response=await fetcher('https://192.168.1.20:4180/api/nas/pair',{method:'POST',credentials:'omit',redirect:'error',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(candidate),signal:AbortSignal.timeout(15000)});
      if(response.status===403)throw Error('服务器 已收到请求，但首次自动连接窗口已关闭或设备名额已占用');
      if(!response.ok)throw Error('服务器 自动连接返回错误（'+response.status+'）');
      if((await response.json()).paired!==true)throw Error('服务器 连接未确认');
      if(disabled)throw Error('自动备份已停止');
      save('https://192.168.1.20:4180',candidate.token);
      paintStatus('已连接家庭 服务器，已开启自动备份');
      notify('已自动连接家庭 服务器');return config;
    })().finally(()=>{pairing=null;});return pairing;
  }
  async function retry(){disabled=false;storage.removeItem('daily-lan-disabled');return run({manual:true});}
  async function run({manual=false}={}){
    if(busy){if(manual)notify('正在检测 服务器，请稍候');return;}
    if(disabled||!online()){if(manual)notify('目前离线或自动备份已停止；照片仍保存在手机');return;}
    busy=true;
    try{
      const connection=await connect();
      const pending=(await photos()).filter(p=>p.status!=='uploaded');
      const other=[...await reports(),...await shoePhotos(),...await shoeReports(),...(tasks().length?await listSubscriptionMedia():[])].some(p=>p.status!=='uploaded'&&(p.role===undefined||p.role==='task-photo'||p.role==='task-report'));
      if(!pending.length&&!other&&!manual)return;
      const probe=await fetcher(connection.url+'/api/nas/status',{credentials:'omit',redirect:'error',headers:{Authorization:'Bearer '+connection.key},signal:AbortSignal.timeout(3000)});
      if(probe.status===401)throw Error('服务器 已连通，但此设备的连接凭证已失效');
      if(!probe.ok)throw Error('服务器 服务返回错误（'+probe.status+'）');
      const status=await probe.json();if(status.configured!==true)throw Error('服务器 照片目录尚未就绪');
      paintStatus('已连接家庭 服务器，已开启自动备份');
      if(!pending.length&&!other){if(manual)notify('服务器 已连接，没有待上传的照片或截图');return;}
      const upload=(path,options={})=>{
        if(!connection.account&&config!==connection)throw Error('服务器 连接已变更');
        if(!/^\.\/api\/nas\/(photos|reports|shoes\/photos|shoes\/reports|tasks\/photos|tasks\/reports)\?/.test(path))throw Error('上传路径无效');
        return fetcher(connection.url+path.slice(1),{...options,credentials:'omit',redirect:'error',headers:{...options.headers,Authorization:'Bearer '+connection.key}});
      };
      let uploaded=0,failed=0;
      for(const photo of pending){if(!connection.account&&config!==connection)return;try{if(await sendPhoto(photo,connection.key,{fetcher:upload}))uploaded++;}catch{failed++;}}
      if(!connection.account&&config!==connection)return;
      const summary=await sendReports(connection.key,{fetcher:upload});
      const shoes=await sendShoes(connection.key,{fetcher:upload,records});
      const taskMedia=tasks().length?await syncTaskMedia(tasks(),{fetcher:upload,key:connection.key}):{uploaded:0,failed:0};
      failed+=summary.failed+shoes.failed+taskMedia.failed;uploaded+=summary.uploaded+shoes.photos+shoes.reports+taskMedia.uploaded;
      if(uploaded>0)notify(`已备份 ${uploaded} 张照片与截图到服务器${failed?`，${failed} 张保留在手机待补传`:''}`);else if(failed>0){paintStatus(`${failed} 张照片或截图待补传`);if(manual)notify(`${failed} 张照片或截图暂未上传，仍保存在手机`);}else if(manual)notify('没有新增图片需要备份');
      return {uploaded,failed};
    }catch(error){const text=connectionError(error);paintStatus(text);if(manual)notify(text+'；照片仍保存在手机');}
    finally{busy=false;}
  }
  async function readContract(){
    const connection=await connect();
    let response;
    try{response=await fetcher(connection.url+'/api/private/contract',{credentials:'omit',redirect:'error',cache:'no-store',headers:{Authorization:'Bearer '+connection.key},signal:AbortSignal.timeout(15000)});}catch{throw Error('手机未能访问 服务器 契约，请在隐私页打开连接检测页');}
    if(!connection.account&&config!==connection)throw Error('服务器 连接已变更，请重试');
    if(response.status===401)throw Error('此设备的 服务器 连接已失效，请联系管理者重新连接');
    if(!response.ok)throw Error('服务器 契约原件暂时无法读取');
    if(Number(response.headers.get('content-length'))>8000000)throw Error('契约原件过大');
    const blob=await response.blob();
    if(blob.size>8000000)throw Error('契约原件过大');
    return blob;
  }
  async function readProfilePhoto(){
    const connection=await connect();const response=await fetcher(connection.url+'/api/private/profile-photo',{credentials:'omit',redirect:'error',cache:'no-store',headers:{Authorization:'Bearer '+connection.key},signal:AbortSignal.timeout(15000)});
    if(!connection.account&&config!==connection)throw Error('服务器 连接已变更');if(!response.ok)throw Error('档案照片暂时无法读取');
    if(response.headers.get('content-type')!=='image/jpeg'||Number(response.headers.get('content-length'))>8000000)throw Error('档案照片格式无效');
    const blob=await response.blob(),bytes=new Uint8Array(await blob.slice(0,3).arrayBuffer());if(!blob.size||blob.size>8000000||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw Error('档案照片内容无效');return blob;
  }
  async function uploadIdentity(record,video,signature){
    const connection=await connect();
    const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
    const videoHash=await digest(video),signatureHash=await digest(signature);
    const metadata=new Blob([JSON.stringify({...record,videoHash,signatureHash})],{type:'application/json'});let receipt;
    for(const [kind,blob,fingerprint] of [['video',video,videoHash],['signature',signature,signatureHash],['record',metadata,await digest(metadata)]]){
      if(!connection.account&&config!==connection)throw Error('服务器 连接已变更');
      const response=await fetcher(connection.url+'/api/private/identity?id='+record.id+'&kind='+kind,{method:'POST',credentials:'omit',redirect:'error',headers:{Authorization:'Bearer '+connection.key,'Content-Type':blob.type,'X-Identity-Fingerprint':fingerprint},body:blob,signal:AbortSignal.timeout(180000)});
      receipt=await response.json();if(!response.ok||!receipt.uploaded||(kind!=='record'&&receipt.fingerprint!==fingerprint))throw Error(receipt.error||'服务器 签约资料未保存完整');
    }
    return {signedAt:receipt.signedAt,videoHash:receipt.videoHash,signatureHash:receipt.signatureHash,nasPath:receipt.path};
  }
  function settingsHtml(){return `<section><h3>自动备份到服务器</h3><p>登录后自动连接当前服务器入口，补传照片、汇总截图和洗鞋记录。家庭网络使用局域网入口，外网可通过域名连接（需要 IPv6 网络）。连接失败时保留图片，恢复连接后补传。无需填写地址或密钥。</p><p>若浏览器提示访问本地网络，请选择允许。连接凭证只保存在本机。</p><p data-lan-status>${disabled?'自动备份已停止':(getAccountToken?.()&&lastStatus==='请先登录曾家家奴账号'?'账号已登录，有待传照片时自动备份':lastStatus).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}</p><button data-action="lan-retry">立即连接并补传</button><button data-action="lan-disconnect">停止自动备份</button><p><a href="${getServerOrigin()}/connection-check" target="_blank" rel="noopener noreferrer">打开连接检测页</a></p><p><button type="button" data-action="certificate-guide">证书安装帮助</button></p></section>`;}
  return {save,disconnect,connect,retry,run,uploadIdentity,readContract,readProfilePhoto,settingsHtml,get enabled(){return !disabled;},get configured(){return !!config;}};
}
