export const APP_VERSION='0.1.2-test.16';
export const CLIENT_BUILD=`daily-shell-v${APP_VERSION}`;
export const RELEASES=[
  {version:'0.1.2-test.16',date:'2026-10-11',changes:['进行中及归档任务新增删除任务按钮，删除前确认。','删除仅清理所选任务及本机关联照片、截图，保留 NAS 备份和已获得积分。','核对应用标题、安装名称及简称均为曾家家奴。']},
  {version:'0.1.2-test.15',date:'2026-10-11',changes:['任务页调整为顶部添加、进行中任务、底部归档，展示开启和完成时间。','添加任务可选择洗鞋、洗衣服、写作业或填写，并设置计划开始和结束时间。','洗鞋支持多双鞋、每阶段多张照片，逐双记录清理完成时间，全部完成后生成详细对比截图。','其他任务支持上传图片和生成包含任务详情与全部图片的完成截图；任务图片回家自动备份到 NAS。']},
  {version:'0.1.2-test.14',date:'2026-10-11',changes:['NAS 连接显示实际失败阶段，不再把全部失败归为证书或密钥问题。','首次连接等待时间延长到 15 秒；手动检查即使没有待上传图片也验证 NAS 连通。','增加手机连接检测页，无需输入地址或访问密钥。']},
  {version:'0.1.2-test.13',date:'2026-10-11',changes:['回家自动连接 NAS，移除地址和访问密钥输入框，使用本机专用连接凭证。','自动补传照片、汇总截图和洗鞋记录，契约原件通过家庭 NAS 读取。','家规章节保留编号标记，去除标题中重复的一、二等编号。']},
  {version:'0.1.2-test.12',date:'2026-10-11',changes:['软件名称改为曾家家奴，更新页面标题和主屏幕应用名称。','行礼左侧新增家规标签，完整展示五章二十条《曾家家规》及每日训词。','家规采用章节编号、条目排版和训词引文样式，支持离线阅读。']},
  {version:'0.1.2-test.11',date:'2026-10-11',changes:['证书改由已有公网 HTTPS 通道下载，避免手机尚未连通局域网时下载失败。','保留 Safari 安装引导，下载证书不再要求先连接家里的 Wi-Fi。','仅公开家庭 NAS 根证书，契约、照片和 NAS 管理入口仍受保护。']},
  {version:'0.1.2-test.10',date:'2026-10-11',changes:['接入用户提供的支付宝收款码，点击付款打开对应收款页面。','新增付款码查看和保存入口，未唤起支付宝时可从相册扫码。','展示收款人并保留手动付款确认，不自动登记到账或订阅成功。']},
  {version:'0.1.2-test.9',date:'2026-10-11',changes:['增加独立的更新日志按钮，显示当前版本和每次更新内容。','桌面日课的证书按钮改为 Safari 安装引导，提供可复制地址。','统一显示版本、客户端更新版本和离线缓存版本。']},
  {version:'0.1.2-test.8',date:'2026-10-11',changes:['首页移除安装到 iPhone 的说明框，订阅页按钮与内容间距收紧。','订阅说明合并进 SUBSCRIPTION 框，更新订阅身份及保护状态展示。','查看契约接通 NAS 原件，读取后支持离线查看。','简化隐私页并收窄时间输入框。','检查更新比对服务器与客户端，成功启用后自动刷新。','所有提示 3 秒后消失；增加回家自动备份照片至 NAS。']}
];

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function releaseLogHtml(){return `<dialog id="release-log" class="contract-viewer" aria-labelledby="release-log-title"><div class="contract-viewer-header"><h3 id="release-log-title">更新日志</h3><button type="button" data-action="close-release-log">关闭</button></div><p>当前版本：${escape(APP_VERSION)}</p>${RELEASES.map(release=>`<article><h3>${escape(release.version)}</h3><small>${escape(release.date)}</small><ul>${release.changes.map(change=>`<li>${escape(change)}</li>`).join('')}</ul></article>`).join('')}</dialog>`;}
