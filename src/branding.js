export const BRAND_LINE='曾家狗奴才专用，致力于一生服务曾家。';
let logoPromise;
export async function drawBrandFooter(context,width,height){
 let logo=null;if(typeof Image!=='undefined'){logoPromise??=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('应用 Logo 加载失败，请联网更新后重试'));image.src=new URL('../icon-192.png',import.meta.url).href;});logo=await logoPromise;}
 context.font='18px system-ui, sans-serif';const size=30,gap=12,textWidth=context.measureText(BRAND_LINE).width,left=(width-size-gap-textWidth)/2,top=height-65;const previous=context.globalAlpha;context.globalAlpha=.4;if(logo)context.drawImage(logo,left,top-23,size,size);context.fillStyle='#b0aaa0';context.fillText(BRAND_LINE,left+size+gap,top);context.globalAlpha=previous;
}
