// Bound both connection setup and queue execution; cancel stale jobs on manual takeover.
export async function runHostedDecision(connect,payload,{signal,timeoutMs=30000}={}){
 let job,timer,stopped=false;
 const cancel=()=>{stopped=true;if(job)Promise.resolve(job.cancel()).catch(()=>{});};
 let abort;
 const deadline=new Promise((_,reject)=>{
  abort=()=>{cancel();reject(new Error('Decision cancelled.'));};
  if(signal?.aborted){abort();return;}
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{cancel();reject(new Error('No response within 30 seconds. Try again later or take control to play manually.'));},timeoutMs);
 });
 try{
  return await Promise.race([deadline,(async()=>{
   const client=await connect();if(stopped)throw new Error('Decision cancelled.');
   job=client.submit('/decide',[payload]);let data;
   for await(const event of job){
    if(stopped)throw new Error('Decision cancelled.');
    if(event.type==='data')data=event;
    if(event.type==='status'&&event.stage==='error')throw new Error(typeof event.message==='string'?event.message:'Laya could not complete this request.');
   }
   if(!data)throw new Error('Laya returned no decision.');
   return data;
  })()]);
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
