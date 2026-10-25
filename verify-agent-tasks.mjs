// Real local Laya classification and earned-income replay, isolated from browser saves.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {OpenWorld,WALK_COST,findPath} from './web/open-world-model.js';
import {interpretGoal,askLaya} from './web/laya-agent.js';
import {taskActions,applyTaskAction,taskComplete} from './web/agent-tasks.js';
const base='http://127.0.0.1:8788',classifications=[],events=[],world=new OpenWorld(41);
async function retry(fn){for(let i=0;;i++)try{return await fn();}catch(e){if(e.status!==409||i===8)throw e;await new Promise(r=>setTimeout(r,1500));}}
try{
 for(const [goal,kind,params] of [
  ['Earn 10 coins','earn',{targetCoins:10}],['Build a quarry','build',{building:'quarry'}],
  ['Train 2 guards','recruit',{troop:'guard',amount:2}],['Clear a tree stump','clear',{object:'stump'}],
  ['Repair my walls','repair',{building:'wall'}],['Move my home beside the market','move',{object:'home',anchor:'market'}],
  ['Buy work gloves','shop',{item:'gloves'}],
 ]){
  const p=await retry(()=>interpretGoal(goal,base));classifications.push({goal,project:p});
  assert.equal(p.kind,kind,goal);for(const [key,value] of Object.entries(params))assert.equal(p[key],value,`${goal}: ${key}`);
  console.log('Classified:',goal,kind);
 }
 world.project=await retry(()=>interpretGoal('Earn 10 coins',base,world));
 for(let i=0;i<100;i++){
  const options=taskActions(world,world.project),answer=await retry(()=>askLaya(world.project.goal,options,base)),a=options.find(o=>o.id===answer.choice);
  assert.notEqual(a.kind,'blocked',a.text);
  if(a.kind==='finish'){assert.ok(taskComplete(world,world.project));break;}
  if(a.target){const path=findPath(world,[world.player.x,world.player.y],a.target);assert.ok(path.length||world.near(...a.target),'Reachable action');for(const [x,y] of path){world.player.x=x;world.player.y=y;world.player.energy=Math.max(0,world.player.energy-WALK_COST);world.recordTravel(1);}}
  const result=applyTaskAction(world,a);assert.ok(result.ok,JSON.stringify({a,result}));
  if(world.player.sleeping)world.tickRest(7,7);
  events.push({step:i,choice:a.id,coins:world.inventory.coins,earned:world.project.earnedCoins,energy:world.player.energy});
  console.log(i,a.id,'earned',world.project.earnedCoins,'energy',Math.round(world.player.energy));
 }
 assert.ok(taskComplete(world,world.project),'Earn 10 actual new coins within 100 decisions');
 console.log('Real Laya capability replay passed');
}finally{await writeFile('evidence/laya-agent-capabilities-real.json',JSON.stringify({classifications,events,final:world.serialize()},null,2));}
