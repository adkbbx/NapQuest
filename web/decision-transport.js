// Local HTTP remains the default. Only the hosted status response enables the GPU queue.
let transport='http',connection;
export function configureDecisionTransport(status){transport=status.transport==='gradio'?'gradio':'http';}
export async function requestDecision(payload,base=''){
 if(transport==='gradio'&&!base){
  try{
   if(!connection)connection=import('./vendor/gradio-client-2.7.1.js').then(({Client})=>Client.connect(location.origin));
   const client=await connection,result=await client.predict('/decide',[payload]),answer=result.data[0];
   if(answer?.error)throw Error(answer.error);
   if(!answer||typeof answer.choice!=='string')throw Error('Laya did not return a decision.');
   return answer;
  }catch(error){connection=null;throw Error(`Online Laya paused: ${error.message||error}. The free GPU may be busy or your daily allowance may be used. Manual play still works.`);}
 }
 const response=await fetch(`${base}/api/world/decide`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)}),answer=await response.json();
 if(!response.ok)throw Object.assign(Error(answer.error||'Laya decision unavailable.'),{status:response.status});
 return answer;
}
