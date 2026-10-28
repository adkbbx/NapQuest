import test from 'node:test';
import assert from 'node:assert/strict';
import {OpenWorld} from './web/open-world-model.js';
import {GameAudio} from './web/game-audio.js';

test('honey collection cannot restart an escort after a completed shift',()=>{
 const w=new OpenWorld(41);w.player.x=10;w.player.y=11;
 w.interact(10,11);assert.equal(w.flags.escort,true);
 w.interact(10,11);assert.equal(w.flags.escort,false);
 w.player.x=13;w.player.y=12;w.interact(13,12);
 assert.equal(w.flags.escort,false);assert.equal(w.inventory.honey,3);
});
test('an unattended escort ends after 30 seconds, including an old saved escort',()=>{
 const w=new OpenWorld(41);w.flags.job=true;w.flags.escort=true;
 const restored=new OpenWorld(41,w.serialize());
 restored.tickVillage(29);assert.equal(restored.flags.escort,true);
 restored.tickVillage(1);assert.equal(restored.flags.escort,false);
});
test('finishing the honey crafting chore dismisses bees immediately',()=>{
 const w=new OpenWorld(41);w.flags.escort=true;w.player.x=0;w.player.y=-2;
 w.inventory.honey=1;w.inventory.fiber=2;
 assert.equal(w.craft('muffler').ok,true);assert.equal(w.flags.escort,false);
});
test('real stumps clear while the crossing retains its repair interaction',()=>{
 const w=new OpenWorld(41);w.player.x=3;w.player.y=4;
 w.change(2,4,{kind:'stump'});assert.equal(w.interact(2,4).ok,true);
 assert.equal(w.tile(2,4).object,null);
 w.inventory.wood=4;w.inventory.stone=2;
 assert.equal(w.interact(3,4).ok,true);assert.equal(w.flags.bridge,true);
 assert.equal(w.walkable(3,6),true);
});
test('audio starts muted even after a previous session was unmuted',()=>{
 const previous=globalThis.localStorage;
 try{
  for(const saved of [null,'{"muted":false,"effects":false}','invalid']){
   globalThis.localStorage={getItem:()=>saved};const audio=new GameAudio();
   assert.equal(audio.muted,true);
   if(saved?.includes('effects'))assert.equal(audio.effects,false);
  }
 }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
