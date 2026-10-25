// Real local Laya decisions over explicit in-memory world scenarios, not browser fixtures.
import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {OpenWorld} from './web/open-world-model.js';import {projectActions} from './web/world-actions.js';import {interpretGoal} from './web/laya-agent.js';
const evidence=[];
async function choose(world,goal){if(!world.project)world.project=await interpretGoal(goal,'http://127.0.0.1:8788');const options=projectActions(world);assert.ok(options.length<=12);for(const a of options)assert.ok(a.intent.length<=180,`${a.id}: ${a.intent.length}`);
 const payload={goal,context:'',actions:options.map(({id,intent})=>({id,intent}))};
 const response=await fetch('http://127.0.0.1:8788/api/world/decide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),answer=await response.json();assert.equal(response.status,200,JSON.stringify(answer));evidence.push({goal,project:world.project,inventory:{...world.inventory},energy:world.player.energy,level:world.settlement.level,options:payload.actions,answer});console.log(goal,'=>',answer.choice);return options.find(o=>o.id===answer.choice);
}
try{
 const spend=new OpenWorld(41);spend.flags.quiet=true;spend.flags.rested=true;
 for(let i=0;i<4&&spend.inventory.coins;i++){const a=await choose(spend,'Spend all my coins buying things.');assert.ok(['buy_lunch','buy_berry'].includes(a.id));spend.player.x=4;spend.player.y=-1;assert.ok(spend.interact(4,-2,a.action).ok);}
 assert.equal(spend.inventory.coins,0);
 const explore=new OpenWorld(41);const choice=await choose(explore,'Explore new places. Eat or buy food to keep going, and return home before energy runs out.');assert.equal(choice.id,'explore');
 const upgrade=new OpenWorld(41);upgrade.flags.quiet=true;upgrade.inventory.wood=6;upgrade.inventory.stone=3;assert.equal((await choose(upgrade,'Upgrade my home to level 5. Keep working until it reaches level 5.')).id,'upgrade_home');
 const low=new OpenWorld(41);low.player.energy=12;const safe=await choose(low,'Explore new places, but refuel or go home before energy runs out.');assert.ok(['eat','home','buy_berry','buy_lunch'].includes(safe.id));
 console.log('Real goal checks passed');
}finally{await writeFile('evidence/world-goal-decisions.json',JSON.stringify(evidence,null,2));}
