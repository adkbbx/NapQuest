import test from 'node:test';import assert from 'node:assert/strict';
import {OpenWorld} from './web/open-world-model.js';import {upgradeCost} from './web/settlement.js';import {projectActions,explorationPlan,worldActions} from './web/world-actions.js';
test('all five home levels consume real resources and survive reload',()=>{
 let w=new OpenWorld(41);w.player.x=-2;w.player.y=0;
 for(let level=1;level<5;level++){const cost=upgradeCost(level);assert.equal(w.upgradeHome().ok,false);for(const [k,n] of Object.entries(cost))w.inventory[k]=n;assert.equal(w.upgradeHome().ok,true);assert.equal(w.settlement.level,level+1);for(const k of Object.keys(cost))assert.equal(w.inventory[k],0);w=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));}
 assert.equal(w.settlement.level,5);assert.equal(w.upgradeHome().ok,false);w.interact(-2,-1);w.finishRest();assert.equal(w.player.energy,100);
});
test('home projects expose missing materials, earnings, and the actual upgrade, without a premature finish',()=>{
 const w=new OpenWorld(41),project={kind:'upgrade',targetLevel:5};let ids=projectActions(w,project).map(a=>a.id);assert.ok(ids.includes('wood'));assert.ok(ids.includes('stone'));assert.ok(!ids.includes('finish'));assert.ok(!ids.includes('home'));
 Object.assign(w.inventory,{wood:6,stone:3,coins:0,berries:2});ids=projectActions(w,project).map(a=>a.id);assert.ok(ids.includes('earn_coins'));assert.ok(!ids.includes('upgrade_home'));w.inventory.coins=1;assert.ok(projectActions(w,project).some(a=>a.id==='upgrade_home'));
 w.settlement.level=5;assert.deepEqual(projectActions(w,project).map(a=>a.id),['finish']);
});
test('exploration budgets include a route home and spending stops only at zero coins',()=>{
 const w=new OpenWorld(41),plan=explorationPlan(w);assert.ok(plan.newPlaces>0);assert.ok(plan.required<=w.player.energy);w.player.energy=6;assert.equal(explorationPlan(w),null);assert.ok(!projectActions(w,{kind:'explore'}).some(a=>a.id==='explore'));
 w.player.energy=100;w.inventory.coins=1;assert.ok(projectActions(w,{kind:'spend'}).some(a=>a.id==='buy_berry'));w.inventory.coins=0;assert.deepEqual(projectActions(w,{kind:'spend'}).map(a=>a.id),['finish']);
});

test('a previous insulated nap cannot finish an unfinished bell-story project',()=>{
 const w=new OpenWorld(41);w.flags.rested=true;w.settlement.level=2;
 for(const kind of ['story','rest'])assert.ok(!projectActions(w,{kind}).some(a=>a.id==='finish'));
 w.flags.quiet=true;for(const kind of ['story','rest'])assert.ok(!projectActions(w,{kind}).some(a=>a.id==='finish'));w.player.sleeping=true;w.player.shelter=[-2,-1];assert.deepEqual(projectActions(w,{kind:'story'}).map(a=>a.id),['finish']);
});
test('watchtowers visibly modeled as shots repel raids once; losses preserve buildings and home level',()=>{
 const w=new OpenWorld(41);w.change(-4,-2,{kind:'tower'});w.inventory.coins=0;assert.equal(w.startRaid().ok,true);let shots=0;for(let i=0;i<200&&w.raid.status==='active';i++)shots+=w.tickRaid(.2).length;
 assert.ok(shots>0);assert.equal(w.raid.status,'won');assert.equal(w.settlement.wins,1);const coins=w.inventory.coins;w.tickRaid(100);assert.equal(w.inventory.coins,coins);
 const loser=new OpenWorld(41);loser.inventory.berries=5;loser.settlement.level=4;loser.startRaid();for(let i=0;i<400;i++)loser.tickRaid(.2);assert.equal(loser.raid.status,'lost');assert.equal(loser.inventory.berries,3);assert.equal(loser.settlement.level,4);
});
test('gardens, escort endings and saved projects have durable consequences',()=>{
 const w=new OpenWorld(41);w.change(1,3,{kind:'garden'});w.turn=8;w.note('A day passes.');assert.equal(w.inventory.berries,2);w.note('No extra action.');assert.equal(w.inventory.berries,2);
 w.player.x=9;w.player.y=11;w.interact(10,11);assert.equal(w.flags.escort,true);w.interact(10,11);assert.equal(w.flags.escort,false);
 w.project={kind:'upgrade',targetLevel:5};w.ambition='Upgrade my home to level 5';w.autorun=true;const saved=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(saved.project.targetLevel,5);assert.equal(saved.autorun,true);
 for(const energy of [10,50,100]){w.player.energy=energy;assert.ok(worldActions(w).length<=12);}
});
