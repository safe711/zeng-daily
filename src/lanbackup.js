import {listPhotos,listReports,listShoePhotos,listShoeReports,syncPhoto} from './photos.js';
import {syncPendingReports} from './reports.js';
import {syncPendingShoeMedia} from './shoes.js';

export function validateLanUrl(value){
  const url=new URL(value);
  const parts=url.hostname.split('.').map(Number);
  const privateIp=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31);
  if(url.protocol!=='https:'||!privateIp||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('请输入家庭 NAS 的 HTTPS 局域网地址');
  return url.origin;
}
export function createLanBackup({records=()=>[],notify=()=>{},storage=globalThis.localStorage,fetcher=globalThis.fetch,online=()=>globalThis.navigator?.onLine!==false,photos=listPhotos,reports=listReports,shoePhotos=listShoePhotos,shoeReports=listShoeReports,sendPhoto=syncPhoto,sendReports=syncPendingReports,sendShoes=syncPendingShoeMedia}={}){
  let config=null,busy=false;
  try{const saved=JSON.parse(storage.getItem('daily-lan-backup'));if(saved?.key&&saved.key.length>=32&&saved.key.length<=256)config={url:validateLanUrl(saved.url),key:saved.key};}catch{}
  function save(url,key){
    url=validateLanUrl(url);key=key.trim();if(key.length<32||key.length>256)throw Error('请填写日课独立访问密钥');
    const next={url,key};storage.setItem('daily-lan-backup',JSON.stringify(next));config=next;
  }
  function disconnect(){storage.removeItem('daily-lan-backup');config=null;}
  async function run({manual=false}={}){
    if(busy||!config||!online()){if(manual)notify('请先连接家庭 NAS；照片仍保存在手机');return;}
    busy=true;const connection=config;
    try{
      const pending=(await photos()).filter(p=>p.status!=='uploaded');
      const other=[...await reports(),...await shoePhotos(),...await shoeReports()].some(p=>p.status!=='uploaded');
      if(!pending.length&&!other){if(manual)notify('没有待上传的照片或截图');return;}
      const probe=await fetcher(connection.url+'/api/nas/status',{credentials:'omit',redirect:'error',headers:{Authorization:'Bearer '+connection.key},signal:AbortSignal.timeout(3000)});
      if(!probe.ok)throw Error('NAS 未连接或密钥不正确');
      const status=await probe.json();if(status.configured!==true)throw Error('NAS 照片目录尚未就绪');
      const upload=(path,options={})=>{
        if(config!==connection)throw Error('NAS 连接已变更');
        if(!/^\.\/api\/nas\/(photos|reports|shoes\/photos|shoes\/reports)\?/.test(path))throw Error('上传路径无效');
        return fetcher(connection.url+path.slice(1),{...options,credentials:'omit',redirect:'error',headers:{...options.headers,Authorization:'Bearer '+connection.key}});
      };
      let uploaded=0,failed=0;
      for(const photo of pending){if(config!==connection)return;try{if(await sendPhoto(photo,connection.key,{fetcher:upload}))uploaded++;}catch{failed++;}}
      if(config!==connection)return;
      const summary=await sendReports(connection.key,{fetcher:upload});
      const shoes=await sendShoes(connection.key,{fetcher:upload,records});
      failed+=summary.failed+shoes.failed;uploaded+=summary.uploaded+shoes.photos+shoes.reports;
      notify(`已备份 ${uploaded} 张照片与截图到 NAS${failed?`，${failed} 张保留在手机待补传`:''}`);
      return {uploaded,failed};
    }catch{if(manual)notify('暂时连不上家庭 NAS，请检查 Wi-Fi、证书与密钥；照片仍保存在手机');}
    finally{busy=false;}
  }
  function settingsHtml(){return `<section><h3>回家自动备份到 NAS</h3><p>打开日课、回到应用或网络恢复时，检测家庭 NAS 并补传待上传照片和截图。外网连不上时保留在手机。浏览器若提示访问本地网络，请选择允许。</p><p><a href="http://192.168.1.20:4181/nas-certificate.mobileconfig" target="_blank" rel="noopener">下载 NAS 连接证书</a></p><p>请先连接家里的 Wi-Fi，用 Safari 下载并选择“允许”。然后到 iPhone 设置 → 已下载描述文件 → 安装；再到通用 → 关于本机 → 证书信任设置，开启“日课家庭 NAS”。描述文件只包含家庭 NAS 的根证书。</p><form data-form="lan-backup"><label>家庭 NAS 地址<input name="url" type="url" value="https://192.168.1.20:4180" required></label><label>日课独立访问密钥<input name="key" type="password" autocomplete="off" minlength="32" maxlength="256" required></label><p class="muted">密钥仅保存在这台手机的浏览器，用于自动备份；不会发送给 GitHub。停止连接可移除本机密钥。</p><button>保存并开启自动备份</button></form><p>${config?'已开启回家自动备份':'尚未开启；照片仍保存在手机'}</p><button data-action="lan-retry">立即检查并补传</button><button data-action="lan-disconnect">停止自动备份</button></section>`;}
  return {save,disconnect,run,settingsHtml,get configured(){return !!config;}};
}
