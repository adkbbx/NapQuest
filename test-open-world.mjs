import test from 'node:test';import assert from 'node:assert/strict';
import {OpenWorld,baseTile,findPath} from './web/open-world-model.js';
test('chunks are deterministic across load order and negative coordinates',()=>{
 const a=new OpenWorld(123),b=new OpenWorld(123);b.chunk(4,-3);
 for(const [x,y] of [[-17,-1],[16,16],[40,-33],[0,0],[120,130]])assert.deepEqual(a.tile(x,y),b.tile(x,y));
 assert.notDeepEqual(baseTile(1,40,40),baseTile(2,40,40));
});
test('resources, edits, planted bushes and buildings survive a saved world',()=>{
 const w=new OpenWorld(41);w.player={x:-3,y:1,energy:100};assert.equal(w.interact(-4,1).ok,true);assert.equal(w.inventory.wood,2);assert.equal(w.tile(-4,1).object.kind,'stump');
 w.player.x=0;w.player.y=2;assert.equal(w.plant(1,3).ok,true);for(let i=0;i<12;i++)w.nap();assert.equal(w.tile(1,3).object.kind,'bush');
 w.inventory.wood=8;w.inventory.stone=4;assert.equal(w.build('home',2,3).ok,true);
 const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.deepEqual(restored.inventory,w.inventory);assert.equal(restored.tile(2,3).object.kind,'home');assert.equal(restored.tile(-4,1).object.kind,'stump');
});
test('the complete story can be played through actual world interactions',()=>{
 const w=new OpenWorld(41),use=(x,y,px=x,py=y+1)=>{w.player.x=px;w.player.y=py;assert.equal(w.interact(x,y).ok,true);};
 use(-4,1,-3,1);use(-5,2,-4,2);use(-4,3,-3,3);assert.equal(w.inventory.wood,4);assert.equal(w.inventory.stone,2);
 use(3,4,3,3);assert.equal(w.flags.bridge,true);assert.equal(w.stage(),1);
 use(10,11,9,11);assert.equal(w.flags.job,true);assert.equal(w.inventory.honey,2);assert.equal(w.stage(),2);
 use(0,-2,0,-1);assert.equal(w.craft('muffler').ok,true);assert.equal(w.stage(),3);
 use(-1,1,-1,2);assert.equal(w.flags.quiet,true);assert.equal(w.stage(),4);assert.equal(w.flags.rested,false);
 use(-2,-1,-2,0);assert.equal(w.player.sleeping,true);assert.deepEqual(w.player.shelter,[-2,-1]);assert.equal(w.flags.rested,false);
 w.finishRest();assert.equal(w.flags.rested,true);assert.ok(w.quest().text.includes('keep exploring'));w.wake();assert.equal(w.player.shelter,null);
});
test('invalid interactions never consume materials and water blocks walking',()=>{
 const w=new OpenWorld(41);assert.equal(w.walkable(3,6),false);const before={...w.inventory};assert.equal(w.interact(3,4).ok,false);assert.deepEqual(w.inventory,before);
 assert.equal(w.build('home',0,2).ok,false);assert.equal(w.craft('muffler').ok,false);assert.deepEqual(w.inventory,before);
 w.flags.bridge=true;assert.equal(w.walkable(3,6),true);assert.equal(w.walkable(2,6),false);
 const path=findPath(w,[3,3],[9,11]);assert.ok(path.length);assert.ok(path.some(([x,y])=>x===3&&y===6));for(const [x,y] of path)assert.ok(w.walkable(x,y));
});
test('honey employment, quitting, goose theft and trading change actual state',()=>{
 const w=new OpenWorld(41);w.player={x:9,y:11,energy:50};w.interact(10,11);w.interact(10,11,'nap');assert.equal(w.flags.manager,true);w.interact(10,11,'quit');assert.equal(w.flags.job,false);
 w.player.x=6;w.player.y=2;w.interact(6,1);assert.equal(w.flags.goose,true);assert.equal(w.inventory.food,3);
 w.player.x=4;w.player.y=-1;w.inventory.berries=2;w.interact(4,-2,'sell');assert.equal(w.inventory.coins,4);assert.equal(w.inventory.berries,0);
});

test('repaired bridge exits remain clear across generated seeds, including the blocked live-world regression',()=>{
 for(const seed of [507937956,...Array.from({length:50},(_,i)=>i*19391)]){const w=new OpenWorld(seed);w.flags.bridge=true;for(let x=3;x<=9;x++)assert.equal(w.tile(x,8).object,null,`seed ${seed}, exit ${x}`);assert.ok(findPath(w,[-2,0],[10,11]).length,`beekeeper reachable for ${seed}`);}
});
