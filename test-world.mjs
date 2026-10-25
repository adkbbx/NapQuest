import test from 'node:test';
import assert from 'node:assert/strict';
import {advance,distance,route,trailTarget,frameDelta} from './web/world-motion.js';
import {atlases} from './web/rig-data.js';

test('movement never overshoots a destination, including a zero-length segment',()=>{
  assert.deepEqual(advance([0,0],[3,4],2.5),[1.5,2]);
  assert.deepEqual(advance([0,0],[3,4],100),[3,4]);
  assert.deepEqual(advance([3,4],[3,4],0),[3,4]);
});
test('both bank crossings pass over the same bridge in the right order',()=>{
  assert.deepEqual(route([365,465],[730,325]),[[470,318],[598,328],[730,325]]);
  assert.deepEqual(route([730,325],[190,375]),[[598,328],[470,318],[190,375]]);
  assert.deepEqual(route([365,465],[330,350]),[[330,350]]);
});
test('followers track the route around corners rather than cutting toward the leader',()=>{
  const trail=[[0,0],[100,0],[100,100]];
  assert.deepEqual(trailTarget(trail,50),[100,50]);
  assert.deepEqual(trailTarget(trail,150),[50,0]);
  assert.deepEqual(trailTarget(trail,900),[0,0]);
  assert.equal(distance(trailTarget(trail,50),trailTarget(trail,90)),40);
});
test('background-tab time gaps cannot advance the whole chase in one frame',()=>{
  assert.equal(frameDelta(100000,0),.05);
  assert.equal(frameDelta(16,0),.016);
  assert.equal(frameDelta(0,20),0);
});
test('all generated skeletal parts have usable crops within their original atlas',()=>{
  assert.deepEqual(Object.keys(atlases).sort(),['bee','fox','goose','mallow']);
  for(const atlas of Object.values(atlases)){
    assert.equal(atlas.boxes.length,6);
    for(const [x,y,w,h] of atlas.boxes){assert.ok(x>=0&&y>=0&&w>0&&h>0);assert.ok(x+w<=atlas.width&&y+h<=atlas.height);}
  }
});
