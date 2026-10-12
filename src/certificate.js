export function certificateGuideHtml(){return `<dialog id="certificate-guide" class="contract-viewer" aria-labelledby="certificate-guide-title"><div class="contract-viewer-header"><h3 id="certificate-guide-title">在 Safari 安装 服务器 证书</h3><button type="button" data-action="close-certificate-guide">关闭</button></div><p>桌面的日课无法直接完成证书安装。请复制下方地址，打开 Safari 并粘贴到地址栏。</p><label>Safari 安装地址<input id="certificate-install-address" type="url" readonly value="https://safe711.github.io/zeng-daily/nas-install.html"></label><button type="button" data-action="copy-certificate-address">复制安装地址</button><p>在 Safari 打开地址 → 点击下载并选择“允许” → 设置中安装描述文件 → 开启“日课家庭证书”证书信任。</p></dialog>`;}

if(globalThis.document?.body?.dataset.certificateInstaller==='true'){
  const standalone=globalThis.navigator?.standalone||globalThis.matchMedia?.('(display-mode: standalone)').matches;
  if(standalone){
    document.querySelector('#safari-required').hidden=false;
    document.querySelector('#certificate-download').hidden=true;
  }
  const address=document.querySelector('#installer-address');
  address.value=location.href.split(/[?#]/)[0];
  document.querySelector('#copy-installer-address').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(address.value);document.querySelector('#installer-message').textContent='地址已复制，请打开 Safari 粘贴。';}
    catch{address.focus();address.select();document.querySelector('#installer-message').textContent='请长按地址复制，再打开 Safari 粘贴。';}
  });
}
