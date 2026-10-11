export const APP_VERSION='0.1.2-test.12';
export const CLIENT_BUILD=`daily-shell-v${APP_VERSION}`;
export const RELEASES=[
  {version:'0.1.2-test.12',date:'2026-10-11',changes:['软件名称改为曾家家奴，更新页面标题和主屏幕应用名称。','行礼左侧新增家规标签，完整展示五章二十条《曾家家规》及每日训词。','家规采用章节编号、条目排版和训词引文样式，支持离线阅读。']},
  {version:'0.1.2-test.11',date:'2026-10-11',changes:['证书改由已有公网 HTTPS 通道下载，避免手机尚未连通局域网时下载失败。','保留 Safari 安装引导，下载证书不再要求先连接家里的 Wi-Fi。','仅公开家庭 NAS 根证书，契约、照片和 NAS 管理入口仍受保护。']},
  {version:'0.1.2-test.10',date:'2026-10-11',changes:['接入用户提供的支付宝收款码，点击付款打开对应收款页面。','新增付款码查看和保存入口，未唤起支付宝时可从相册扫码。','展示收款人并保留手动付款确认，不自动登记到账或订阅成功。']},
  {version:'0.1.2-test.9',date:'2026-10-11',changes:['增加独立的更新日志按钮，显示当前版本和每次更新内容。','桌面日课的证书按钮改为 Safari 安装引导，提供可复制地址。','统一显示版本、客户端更新版本和离线缓存版本。']},
  {version:'0.1.2-test.8',date:'2026-10-11',changes:['首页移除安装到 iPhone 的说明框，订阅页按钮与内容间距收紧。','订阅说明合并进 SUBSCRIPTION 框，更新订阅身份及保护状态展示。','查看契约接通 NAS 原件，读取后支持离线查看。','简化隐私页并收窄时间输入框。','检查更新比对服务器与客户端，成功启用后自动刷新。','所有提示 3 秒后消失；增加回家自动备份照片至 NAS。']}
];

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function releaseLogHtml(){return `<dialog id="release-log" class="contract-viewer" aria-labelledby="release-log-title"><div class="contract-viewer-header"><h3 id="release-log-title">更新日志</h3><button type="button" data-action="close-release-log">关闭</button></div><p>当前版本：${escape(APP_VERSION)}</p>${RELEASES.map(release=>`<article><h3>${escape(release.version)}</h3><small>${escape(release.date)}</small><ul>${release.changes.map(change=>`<li>${escape(change)}</li>`).join('')}</ul></article>`).join('')}</dialog>`;}
