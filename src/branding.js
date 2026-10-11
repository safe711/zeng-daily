export const BRAND_LINE='曾家狗奴才专用，致力于一生服务曾家。';
let logoPromise;
export async function drawBrandFooter(context,width,height){
 let logo=null;if(typeof Image!=='undefined'){logoPromise??=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('应用 Logo 加载失败，请联网更新后重试'));image.src=new URL('../icon-192.png',import.meta.url).href;});logo=await logoPromise;}
 const top=height-112;context.fillStyle='#242731';context.fillRect(30,top,width-60,94);if(logo)context.drawImage(logo,48,top+12,70,70);context.fillStyle='#e4cfaa';context.font='bold 23px system-ui, sans-serif';context.fillText('曾家家奴',136,top+35);context.fillStyle='#c6bdac';context.font='21px system-ui, sans-serif';context.fillText(BRAND_LINE,136,top+68);
}
