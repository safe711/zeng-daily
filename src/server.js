export const HOME_SERVER='https://192.168.1.20:4180';
export const PUBLIC_SERVER='https://ceramic-calculated-prix-circuits.trycloudflare.com';
export const IPV6_SERVER='https://api.zenglegacy.cn:4180';
const origins=[PUBLIC_SERVER,HOME_SERVER,IPV6_SERVER],key='daily-account-server-origin';
let active=PUBLIC_SERVER;
try{const saved=globalThis.localStorage?.getItem(key);if(origins.includes(saved))active=saved;}catch{}
export const getServerOrigin=()=>active;
export async function fetchAccountServer(path,options,{fetcher=fetch,timeout=15000}={}){
 if(!/^\/api\/account\/[A-Za-z0-9%/_-]+$/.test(path))throw Error('账号服务器路径无效');
 let error;
 for(const origin of [active,...origins.filter(value=>value!==active)]){
  const controller=new AbortController(),small=/\/(login|me|unlock\/password|unlock\/options)$/.test(path);
  const timer=small?setTimeout(()=>controller.abort(new DOMException('Connection timeout','TimeoutError')),Math.min(origin===PUBLIC_SERVER?7000:3000,timeout)):null;
  try{
   const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(timeout),...(options.signal?[options.signal]:[])]);
   const response=await fetcher(origin+path,{...options,signal});
   if([502,503,504].includes(response.status)){error=Error('Account upstream unavailable');continue;}
   active=origin;try{globalThis.localStorage?.setItem(key,origin);}catch{}
   return response;
  }catch(e){error=e;}finally{if(timer)clearTimeout(timer);}
 }
 throw error;
}
