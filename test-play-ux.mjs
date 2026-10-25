import test from 'node:test';
import assert from 'node:assert/strict';
import {OpenWorld} from './web/open-world-model.js';
import {projectActions,travelBudget} from './web/world-actions.js';
import {nextObjective} from './web/world-guide.js';
import {GameAudio} from './web/game-audio.js';

test('a moved home remains the home for saving, upgrades, AI and raids',()=>{
 const w=new OpenWorld(41);w.flags.quiet=true;w.flags.bridge=true;
 assert.ok(w.moveObject([-2,-1],[-6,0]).ok);assert.equal(w.tile(-2,-1).object,null);assert.equal(w.tile(-6,0).object.kind,'home');
 assert.deepEqual(nextObjective(w).target,[-6,0]);w.player.x=-6;w.player.y=1;
 Object.assign(w.inventory,{wood:6,stone:3,coins:1});assert.ok(w.upgradeHome().ok);
 w.player.energy=5;assert.deepEqual(projectActions(w,{kind:'explore'}).find(a=>a.id==='home').target,[-6,0]);
 assert.ok(w.startRaid().ok);assert.ok(w.raid.enemies.every(e=>e.route.at(-1)?.[0]===-6));
 const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.deepEqual(restored.location('home'),[-6,0]);assert.equal(restored.settlement.level,2);assert.ok(Number.isFinite(travelBudget(restored,[0,0]).returnCost));
});
test('moving a stocked building preserves stock, durability, payment and the resource balance',()=>{
 const w=new OpenWorld(41);w.settlement.level=2;w.player.x=2;w.player.y=-3;w.inventory.coins=8;assert.ok(w.build('quarry',2,-4,{payment:'coins'}).ok);w.tickVillage(18);const before=structuredClone(w.tile(2,-4).object),inventory={...w.inventory};
 assert.ok(w.moveObject([2,-4],[6,-3]).ok);assert.deepEqual({...w.tile(6,-3).object,id:before.id},before);assert.deepEqual(w.inventory,inventory);assert.equal(w.tile(2,-4).object,null);
 w.player.x=6;w.player.y=-2;assert.ok(w.interact(6,-3).ok);assert.equal(w.inventory.stone,4);assert.equal(w.tile(6,-3).object.stock,0);
});
test('invalid moves never erase assets, close the home door or edit during a raid',()=>{
 const w=new OpenWorld(41),before=JSON.stringify(w.serialize());assert.equal(w.moveObject([-2,-1],[4,-2]).ok,false);assert.equal(JSON.stringify(w.serialize()),before);assert.equal(w.moveObject([4,-2],[-2,0]).ok,false);assert.equal(w.moveObject([-2,-1],[0,6]).ok,false);w.startRaid();assert.equal(w.moveObject([-2,-1],[-6,0]).ok,false);
});
test('coin construction pays on a valid placement only and refunds coins rather than free materials',()=>{
 const w=new OpenWorld(41);w.settlement.level=2;w.inventory.coins=8;w.player.x=2;w.player.y=-3;
 assert.equal(w.build('quarry',4,-2,{payment:'coins'}).ok,false);assert.equal(w.inventory.coins,8);assert.ok(w.build('quarry',2,-4,{payment:'coins'}).ok);assert.equal(w.inventory.coins,0);assert.equal(w.inventory.wood,0);assert.ok(w.dismantle(2,-4).ok);assert.equal(w.inventory.coins,4);assert.equal(w.inventory.stone,0);
});
test('store artifacts have a real effect, cannot be bought twice, and survive reload',()=>{
 const w=new OpenWorld(41);w.inventory.coins=20;assert.ok(w.buyGood('gloves').ok);assert.equal(w.buyGood('gloves').ok,false);assert.equal(w.inventory.coins,10);w.player.x=-3;w.player.y=1;w.interact(-4,1);assert.equal(w.inventory.wood,3);assert.ok(w.buyGood('compass').ok);const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.deepEqual(restored.artifacts,{gloves:true,compass:true});assert.equal(restored.inventory.coins,2);
});
test('naps wake once after the chosen time, preserve story completion and resume projects',()=>{
 const w=new OpenWorld(41);w.flags.quiet=true;w.project={kind:'story'};w.player.x=-2;w.player.y=0;w.player.energy=10;w.interact(-2,-1);assert.equal(w.tickRest(4.9,5),null);assert.equal(w.player.sleeping,true);assert.ok(w.tickRest(.1,5).napFinished);assert.equal(w.player.sleeping,false);assert.equal(w.player.energy,100);assert.equal(w.flags.rested,true);assert.deepEqual(projectActions(w).map(a=>a.id),['finish']);assert.equal(w.tickRest(20,5),null);
 w.project={kind:'upgrade',targetLevel:5};w.nap();const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(restored.tickRest(6,7),null);assert.ok(restored.tickRest(1,7).napFinished);assert.equal(restored.player.sleeping,false);assert.ok(projectActions(restored).some(a=>a.id==='wood'));
});
test('master mute persists even before audio is unlocked and keeps the effects mix',()=>{
 const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};const a=new GameAudio();a.effects=false;a.ambience=true;a.muted=true;a.update();const restored=new GameAudio();assert.equal(restored.muted,true);assert.equal(restored.effects,false);assert.equal(restored.ambience,true);delete globalThis.localStorage;
});
