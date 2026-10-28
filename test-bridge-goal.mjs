import test from 'node:test';
import assert from 'node:assert/strict';
import {OpenWorld,findPath} from './web/open-world-model.js';
import {activateProject,taskActions,taskComplete,applyTaskAction} from './web/agent-tasks.js';
import {interpretGoal} from './web/laya-agent.js';
import {runHostedDecision} from './web/decision-wait.js';

test('bridge goal gathers its materials, repairs the crossing, and stops',()=>{
 const w=new OpenWorld(41);w.project=activateProject(w,{kind:'bridge'});
 for(let i=0;i<12&&!taskComplete(w,w.project);i++){
  const a=taskActions(w,w.project).find(a=>a.id==='repair_bridge'||a.id.startsWith('gather_'));
  assert.ok(a,'a productive bridge action is available');
  const end=findPath(w,[w.player.x,w.player.y],a.target).at(-1);
  if(end)[w.player.x,w.player.y]=end;
  assert.equal(applyTaskAction(w,a).ok,true);
 }
 assert.equal(w.flags.bridge,true);assert.equal(taskComplete(w,w.project),true);
 assert.equal(taskActions(w,w.project)[0].kind,'finish');
 assert.equal(w.flags.job,false);assert.equal(w.flags.quiet,false);
 const restored=new OpenWorld(41,w.serialize());assert.equal(taskComplete(restored,restored.project),true);
});
test('goal interpretation exposes bridge repair as its own model choice',async()=>{
 const previous=globalThis.fetch;
 try{
  globalThis.fetch=async(_,options)=>{const body=JSON.parse(options.body);assert.ok(body.actions.length<=12);const choice=body.actions.some(a=>a.id==='bridge')?'bridge':'maintain';assert.ok(body.actions.some(a=>a.id===choice));return {ok:true,json:async()=>({choice})};};
  const p=await interpretGoal('fix the bridge','',new OpenWorld(41));assert.equal(p.kind,'bridge');
 }finally{globalThis.fetch=previous;}
});
test('hosted queue timeout cancels the job instead of waiting forever',async()=>{
 let cancelled=false;
 const job={cancel(){cancelled=true;},async *[Symbol.asyncIterator](){await new Promise(()=>{});}};
 await assert.rejects(runHostedDecision(async()=>({submit:()=>job}),{}, {timeoutMs:10}),/No response/);
 assert.equal(cancelled,true);
});
test('manual takeover cancels a queued decision',async()=>{
 const controller=new AbortController();let cancelled=false;
 const job={cancel(){cancelled=true;},async *[Symbol.asyncIterator](){controller.abort();await new Promise(()=>{});}};
 await assert.rejects(runHostedDecision(async()=>({submit:()=>job}),{}, {signal:controller.signal}),/cancelled/);
 assert.equal(cancelled,true);
});
test('GPU quota errors surface, and successful results pass through',async()=>{
 const job=events=>({cancel(){},async *[Symbol.asyncIterator](){yield* events;}});
 await assert.rejects(runHostedDecision(async()=>({submit:()=>job([{type:'status',stage:'error',message:'GPU quota exhausted'}])}),{}),/quota exhausted/);
 const result=await runHostedDecision(async()=>({submit:()=>job([{type:'data',data:[{choice:'bridge'}]},{type:'status',stage:'complete'}])}),{});
 assert.equal(result.data[0].choice,'bridge');
});
