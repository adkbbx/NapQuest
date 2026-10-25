import test from 'node:test';import assert from 'node:assert/strict';
import {OpenWorld,VERSION,findPath} from './web/open-world-model.js';
import {describeInteraction,nextObjective} from './web/world-guide.js';
test('ringing bell interrupts indoor sleep; quiet home completes a real rest',()=>{
 const w=new OpenWorld(41);w.player.x=-2;w.player.y=0;w.player.energy=20;
 w.interact(-2,-1);assert.equal(w.player.sleeping,true);assert.equal(w.player.energy,20);assert.deepEqual(w.player.shelter,[-2,-1]);
 w.finishRest();assert.equal(w.player.sleeping,false);assert.equal(w.player.shelter,null);assert.equal(w.flags.rested,false);
 w.flags.quiet=true;w.interact(-2,-1);w.finishRest();assert.equal(w.flags.rested,true);assert.equal(w.player.energy,100);assert.equal(w.player.sleeping,true);
 const restored=new OpenWorld(41,JSON.parse(JSON.stringify(w.serialize())));assert.equal(restored.player.sleeping,true);assert.deepEqual(restored.player.shelter,[-2,-1]);
 assert.equal(restored.finishRest(),null);restored.wake();assert.equal(restored.player.sleeping,false);assert.equal(restored.player.shelter,null);
});
test('inspecting never spends money and names risks before commitment',()=>{
 const w=new OpenWorld(41),before=JSON.stringify(w.serialize());
 assert.match(describeInteraction(w,w.tile(4,-2).object).label,/2 coins/);
 assert.match(describeInteraction(w,w.tile(6,1).object).detail,/goose will chase/);
 assert.match(describeInteraction(w,w.tile(10,11).object).detail,/coworkers/i);
 assert.equal(JSON.stringify(w.serialize()),before);
});

test('an insulated bedroom permits rest without claiming the bell story is complete',()=>{
 const w=new OpenWorld(41);w.settlement.level=2;w.player.x=-2;w.player.y=0;
 assert.match(describeInteraction(w,w.tile(-2,-1).object).detail,/soundproof/);
 w.interact(-2,-1);const rest=w.finishRest();assert.match(rest.text,/soundproof/);assert.equal(w.player.energy,100);assert.equal(w.flags.quiet,false);assert.equal(w.flags.rested,false);
 assert.equal(nextObjective(w).steps[3][1],false);
});
test('the next stop follows resources, repairs, crafting and the final indoor nap',()=>{
 const w=new OpenWorld(41);assert.match(nextObjective(w).label,/Collect wood/);const target=nextObjective(w).target;assert.ok(findPath(w,[0,1.7],target).length);
 w.inventory.wood=4;assert.match(nextObjective(w).label,/Collect stone/);w.inventory.stone=2;assert.deepEqual(nextObjective(w).target,[3,4]);
 w.flags.bridge=true;assert.deepEqual(nextObjective(w).target,[10,11]);w.inventory.honey=1;assert.match(nextObjective(w).label,/fiber/);w.inventory.fiber=2;assert.deepEqual(nextObjective(w).target,[0,-2]);w.inventory.muffler=1;assert.deepEqual(nextObjective(w).target,[-1,1]);w.flags.quiet=true;assert.deepEqual(nextObjective(w).target,[-2,-1]);assert.equal(nextObjective(w).steps[4][1],false);
});
test('version-one saves retain inventory and edits under the narrower path generator',()=>{
 const old=new OpenWorld(41);old.inventory.wood=7;old.change(7,3,{kind:'home',built:true});const saved={...old.serialize(),version:1};delete saved.player.sleeping;delete saved.player.shelter;delete saved.flags.rested;
 const migrated=new OpenWorld(41,saved);assert.equal(migrated.inventory.wood,7);assert.equal(migrated.tile(7,3).object.kind,'home');assert.equal(migrated.flags.rested,false);assert.equal(migrated.serialize().version,VERSION);
 assert.equal(migrated.tile(8,0).terrain,'grass');
});

test('fitting a muffler requires a new indoor nap even when a previous save recorded rest',()=>{
 const w=new OpenWorld(41);w.flags.rested=true;w.inventory.muffler=1;w.player.x=-1;w.player.y=1;w.interact(-1,1);assert.equal(w.flags.quiet,true);assert.equal(w.flags.rested,false);w.player.x=-2;w.player.y=0;w.interact(-2,-1);w.finishRest();assert.equal(w.flags.rested,true);
});
