// Real Laya decisions in a headless world replay. No inventory grants or browser-save edits.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {OpenWorld,WALK_COST} from './web/open-world-model.js';
import {projectActions,routeCost} from './web/world-actions.js';
import {interpretGoal,askLaya} from './web/laya-agent.js';
const goal='Upgrade my home to level 5. Keep working until it reaches level 5.';
const base='http://127.0.0.1:8788',world=new OpenWorld(41),events=[];
world.project=await interpretGoal(goal,base);
assert.equal(world.project.kind,'upgrade');assert.equal(world.project.targetLevel,5);
try{
 for(let i=0;i<320;i++){
  const options=projectActions(world),answer=await askLaya(goal,options,base),a=options.find(o=>o.id===answer.choice);
  assert.ok(a,'Model choice must be available');
  if(a.target){const trip=routeCost(world,[world.player.x,world.player.y],a.id==='home'||a.kind==='upgrade'?[world.location('home')[0],world.location('home')[1]+1]:a.target);assert.ok(Number.isFinite(trip.cost),'Action must be reachable');for(const [x,y] of trip.route){world.player.x=x;world.player.y=y;world.player.energy=Math.max(0,world.player.energy-WALK_COST);world.recordTravel(1);}}
  let result;
  if(a.kind==='interact')result=world.interact(...a.target,a.action);
  else if(a.kind==='upgrade')result=world.upgradeHome();
  else if(a.kind==='eat')result=world.eat();
  else if(a.kind==='wake')result=world.wake();
  else if(a.kind==='rest')result=world.nap();
  else if(a.kind==='finish'){assert.equal(world.settlement.level,5);break;}
  else if(a.kind==='explore')result={ok:true,text:'Exploration route completed'};
  else throw Error(`Unhandled replay action ${a.kind}`);
  assert.ok(result?.ok,JSON.stringify({a,result}));
  if(result.rest)world.finishRest();
  events.push({step:i,choice:a.id,level:world.settlement.level,energy:world.player.energy,position:[world.player.x,world.player.y],inventory:{...world.inventory}});
  console.log(i,a.id,'level',world.settlement.level,'energy',Math.round(world.player.energy));
 }
 assert.equal(world.settlement.level,5,'Project must reach its requested level within 320 decisions');
 console.log('Real Laya home-level-5 replay passed');
}finally{await writeFile('evidence/home-project-five-level-replay.json',JSON.stringify({goal,project:world.project,events,final:world.serialize()},null,2));}
