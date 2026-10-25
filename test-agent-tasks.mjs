import test from 'node:test';import assert from 'node:assert/strict';
import {OpenWorld,findPath} from './web/open-world-model.js';
import {activateProject,taskActions,applyTaskAction,taskComplete,taskProgress} from './web/agent-tasks.js';
import {projectActions} from './web/world-actions.js';
function fixture(){const w=new OpenWorld(41);w.flags.bridge=true;w.flags.quiet=true;w.settlement.level=5;Object.assign(w.inventory,{wood:100,stone:100,coins:100,food:20,seeds:20,berries:20,fiber:20,honey:20});return w;}
function perform(w,a){if(a.target){const path=findPath(w,[w.player.x,w.player.y],a.target);const end=path.at(-1);if(end){w.player.x=end[0];w.player.y=end[1];}}return applyTaskAction(w,a);}
test('earning counts new income, never the opening purse, spending or refunds',()=>{
 const w=fixture();w.project=activateProject(w,{kind:'earn',targetCoins:10});assert.equal(taskComplete(w,w.project),false);w.flags.job=true;w.player.x=10;w.player.y=10;
 for(let i=0;i<10;i++){assert.equal(taskComplete(w,w.project),false);assert.ok(w.interact(10,11).ok);}
 assert.equal(w.project.earnedCoins,10);assert.equal(w.inventory.coins,110);assert.equal(taskComplete(w,w.project),true);assert.equal(projectActions(w)[0].kind,'finish');
 w.project=activateProject(w,{kind:'earn',targetCoins:10});w.player.x=2;w.player.y=-3;w.build('quarry',2,-4,{payment:'coins'});w.dismantle(2,-4);assert.equal(w.project.earnedCoins,0);
});
test('gold collection and berry sales count as income, persist, and quiet bells do not block jobs',()=>{
 const w=fixture();w.flags.job=false;w.inventory.berries=0;w.project=activateProject(w,{kind:'earn',targetCoins:10});assert.ok(taskActions(w,w.project).some(a=>a.id==='join_job'));
 w.change(2,-4,{kind:'goldmine',built:true,stock:7});w.player.x=2;w.player.y=-3;w.interact(2,-4);assert.equal(w.project.earnedCoins,7);w.inventory.berries=2;w.player.x=4;w.player.y=-1;w.interact(4,-2,'sell');assert.equal(w.project.earnedCoins,8);
 const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(restored.project.earnedCoins,8);assert.equal(taskComplete(restored,restored.project),false);
});
test('Laya action tools execute the same building, shopping, training, crafting and planting methods as manual play',()=>{
 const cases=[
  [{kind:'build',building:'quarry',amount:1},'build'],
  [{kind:'shop',item:'gloves',amount:1},'buy'],
  [{kind:'craft',item:'picnic',resource:'picnic',amount:1},'craft'],
  [{kind:'plant',amount:1},'plant'],
  [{kind:'recruit',troop:'guard',amount:1},'train'],
 ];
 for(const [p,kind] of cases){const w=fixture();w.change(-5,0,{kind:'barracks',built:true});w.project=activateProject(w,p);const a=taskActions(w,p).find(a=>a.kind===kind);assert.ok(a,`${p.kind} exposes its manual action`);assert.ok(perform(w,a).ok);assert.ok(taskComplete(w,p),`${p.kind} actually completes`);}
});
test('repairing, moving and dismantling preserve their actual costs and completion state',()=>{
 for(const [p,kind] of [[{kind:'repair',building:'wall'},'repair'],[{kind:'move',object:'home',destination:[-6,0]},'move'],[{kind:'dismantle',building:'wall',amount:1},'dismantle']]){
  const w=fixture();w.change(2,-3,{kind:'wall',built:true,hp:10,maxHp:110});w.project=activateProject(w,p);const a=taskActions(w,p).find(a=>a.kind===kind);assert.ok(a);assert.ok(perform(w,a).ok);assert.ok(taskComplete(w,p));
 }
});
test('clear stump frees persisted building ground; sitting remains an explicit alternative',()=>{
 const w=fixture();w.player.x=2;w.player.y=-3;w.change(2,-4,{kind:'stump'});w.player.energy=50;w.interact(2,-4,'sit');assert.equal(w.player.energy,70);assert.equal(w.tile(2,-4).object.kind,'stump');w.project=activateProject(w,{kind:'clear',object:'stump',amount:1});const a=taskActions(w,w.project).find(a=>a.kind==='clear');assert.ok(perform(w,a).ok);assert.equal(w.tile(2,-4).object,null);assert.ok(taskComplete(w,w.project));w.player.x=2;w.player.y=-3;assert.ok(w.build('quarry',2,-4).ok);const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(restored.tile(2,-4).object.kind,'quarry');
});
test('prerequisites and limits prevent free buildings or oversized armies',()=>{
 const w=new OpenWorld(41);const p=activateProject(w,{kind:'build',building:'quarry',amount:1});const actions=taskActions(w,p);assert.ok(!actions.some(a=>a.kind==='build'));assert.ok(actions.some(a=>a.id.startsWith('gather_')));assert.equal(w.settlement.level,1);
 const high=fixture(),army=activateProject(high,{kind:'recruit',troop:'guard',amount:9});assert.equal(taskActions(high,army)[0].kind,'blocked');
});
test('specific interactions, job exit, bee dismissal, eating and goose payments stop after the requested effect',()=>{
 for(const p of [{kind:'eat'},{kind:'quit'},{kind:'dismiss'},{kind:'goose',gooseAction:'return'},{kind:'interact',object:'picnic'}]){const w=fixture();w.flags.job=true;w.flags.goose=true;w.flags.escort=true;w.project=activateProject(w,p);const a=taskActions(w,p).find(a=>a.completes);assert.ok(a);assert.ok(perform(w,a).ok);assert.ok(taskComplete(w,p));}
});
