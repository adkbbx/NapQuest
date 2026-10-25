import test from 'node:test';import assert from 'node:assert/strict';
import {OpenWorld} from './web/open-world-model.js';
import {BUILDINGS,ENEMIES,LEVELS,MAX_LEVEL,RAID_TIERS,troopCapacity} from './web/progression.js';
const supply=w=>Object.assign(w.inventory,{wood:100,stone:100,coins:100,food:20,seeds:20});
test('every home level has a different appearance and unlocks a concrete reward',()=>{
 assert.equal(MAX_LEVEL,5);assert.equal(new Set(LEVELS.map(l=>l.home)).size,5);
 for(const level of [1,2,3,4,5]){const w=new OpenWorld(41);w.settlement.level=level;supply(w);const before={...w.inventory};w.player.x=-2;w.player.y=1;const result=w.build('cannon',-1,2);assert.equal(result.ok,level>=4);if(level<4)assert.deepEqual(w.inventory,before);}
 assert.equal(troopCapacity(3),3);assert.equal(troopCapacity(5),8);assert.ok(RAID_TIERS[4].includes('captain'));
});
test('quarries produce capped stock over active time and collection moves it once into inventory',()=>{
 const w=new OpenWorld(41);supply(w);w.settlement.level=2;w.player.x=-2;w.player.y=1;assert.ok(w.build('quarry',-2,2).ok);const stone=w.inventory.stone;
 w.tickVillage(8);assert.equal(w.tile(-2,2).object.stock,0);w.tickVillage(1);assert.equal(w.tile(-2,2).object.stock,2);w.tickVillage(1000);assert.equal(w.tile(-2,2).object.stock,16);assert.equal(w.inventory.stone,stone);
 assert.ok(w.interact(-2,2).ok);assert.equal(w.inventory.stone,stone+16);assert.equal(w.tile(-2,2).object.stock,0);assert.equal(w.interact(-2,2).ok,false);
 const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));restored.tickVillage(9);assert.equal(restored.tile(-2,2).object.stock,2);
});
test('troops require the right level, a barracks, training costs and a free camp slot',()=>{
 const w=new OpenWorld(41);supply(w);assert.equal(w.trainTroop('guard').ok,false);w.settlement.level=3;assert.equal(w.trainTroop('guard').ok,false);w.player.x=-4;w.player.y=0;assert.ok(w.build('barracks',-5,0).ok);const coins=w.inventory.coins;
 for(let i=0;i<3;i++)assert.ok(w.trainTroop('guard').ok);assert.equal(w.inventory.coins,coins-3);assert.equal(w.trainTroop('guard').ok,false);assert.equal(w.trainTroop('ranger').ok,false);
 const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(restored.troops.length,3);assert.equal(new Set(restored.troops.map(u=>u.id)).size,3);
});
test('gates allow friendly walking while boars actually damage and breach them',()=>{
 const w=new OpenWorld(41);w.settlement.level=3;w.change(-4,-3,{kind:'gate',built:true,hp:55,maxHp:170});assert.ok(w.walkable(-4,-3));assert.ok(w.startRaid().ok);
 const e=w.raid.enemies.find(e=>e.type==='boar');w.raid.enemies=[e];e.x=-5;e.y=-3;e.route=[[-4,-3],[-3,-3],[-2,-3],[-2,-2],[-2,0]];w.raid.repathClock=999;
 let hits=0;for(let i=0;i<35;i++)hits+=w.tickRaid(.1).filter(s=>['wallhit','wallbreak'].includes(s.kind)).length;assert.ok(hits>=3);assert.equal(w.tile(-4,-3).object,null);assert.ok(w.log.some(s=>s.includes('broke')));
});
test('walls delay the first damage to home and repairs pay real resources',()=>{
 const protectedWorld=new OpenWorld(41);protectedWorld.settlement.level=3;
 for(let x=-4;x<=0;x++)for(const y of [-3,1])protectedWorld.change(x,y,{kind:'wall',built:true,hp:110,maxHp:110});
 for(let y=-2;y<=0;y++)for(const x of [-4,0])protectedWorld.change(x,y,{kind:'wall',built:true,hp:110,maxHp:110});
 const bare=new OpenWorld(41);bare.settlement.level=3;
 const firstDamage=w=>{assert.ok(w.startRaid().ok);for(let i=0;i<1000;i++){w.tickRaid(.1);if(w.raid.baseHp<w.raid.maxBaseHp)return i/10;}return Infinity;};
 assert.ok(firstDamage(protectedWorld)>firstDamage(bare));
 protectedWorld.player.x=-3;protectedWorld.player.y=-2;protectedWorld.change(-4,-2,{kind:'wall',built:true,hp:20,maxHp:110});protectedWorld.inventory.wood=1;protectedWorld.inventory.stone=1;assert.ok(protectedWorld.repair(-4,-2).ok);assert.equal(protectedWorld.tile(-4,-2).object.hp,110);assert.equal(protectedWorld.inventory.wood,0);assert.equal(protectedWorld.inventory.stone,0);
});
test('a prepared army and defenses can defeat the captain; rewards and crest persist once',()=>{
 const w=new OpenWorld(41);w.settlement.level=5;supply(w);w.change(-5,0,{kind:'barracks',built:true});w.change(-4,-2,{kind:'tower',built:true});w.change(1,0,{kind:'tower',built:true});w.change(0,2,{kind:'cannon',built:true});w.change(2,1,{kind:'cannon',built:true});
 for(const t of ['guard','guard','ranger','ranger'])assert.ok(w.trainTroop(t).ok);const before=w.inventory.coins;assert.ok(w.startRaid().ok);assert.ok(w.raid.enemies.some(e=>e.type==='captain'));let troopHits=0,cannonShots=0;
 for(let i=0;i<1800&&w.raid.status==='active';i++){w.tickVillage(.05);for(const s of w.tickRaid(.05)){if(s.kind==='cannon')cannonShots++;if(s.source==='troop')troopHits++;}}
 assert.equal(w.raid.status,'won');assert.ok(cannonShots>0);assert.ok(troopHits>0);assert.equal(w.settlement.captainDefeated,true);assert.ok(w.inventory.coins>before);const coins=w.inventory.coins;w.tickRaid(100);assert.equal(w.inventory.coins,coins);assert.ok(w.troops.every(u=>u.hp===u.maxHp));const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(restored.settlement.captainDefeated,true);
});
test('old saves keep materials, edits and achievements while targeting the five-level chapter',()=>{
 const w=new OpenWorld(41);w.settlement.level=10;w.inventory.wood=91;w.change(2,2,{kind:'wall',built:true});w.project={kind:'upgrade',targetLevel:10};const saved={...w.serialize(),version:2};const restored=new OpenWorld(41,saved);
 assert.equal(restored.settlement.level,5);assert.equal(restored.settlement.legacyHighestLevel,10);assert.equal(restored.inventory.wood,91);assert.equal(restored.tile(2,2).object.kind,'wall');assert.equal(restored.project.targetLevel,5);
});
