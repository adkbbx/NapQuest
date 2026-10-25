import test from 'node:test';
import assert from 'node:assert/strict';
import {CutoutRig} from './web/rig.js';
import {atlases} from './web/rig-data.js';

class SvgElement {
  constructor(tag){this.tag=tag;this.attributes={};this.children=[];}
  setAttribute(key,value){this.attributes[key]=String(value);}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  replaceChildren(...children){this.children=[];this.append(...children);}
}
globalThis.document={createElementNS:(_,tag)=>new SvgElement(tag)};
const create=kind=>new CutoutRig(kind,new SvgElement('div'));
const transforms=rig=>[rig.root,rig.upper,...[...rig.joints.values()].map(j=>j.group)].map(e=>e.attributes.transform);

test('Mallow arm crop excludes the neighboring head fragment',()=>{
  const [x,y,width,height]=atlases.mallow.boxes[2];
  assert.ok(x>1200&&x+width<1500);
  assert.ok(y<60&&height>440);
  assert.ok(atlases.mallow.boxes[1][0]+atlases.mallow.boxes[1][2]>1024);
});

test('head and shoulders inherit torso movement and every cutout preserves aspect',()=>{
  for(const kind of Object.keys(atlases)){
    const rig=create(kind);
    assert.equal(rig.joints.get('head').group.parent,rig.upper);
    if(rig.joints.has('arm'))assert.equal(rig.joints.get('arm').group.parent,rig.upper);
    assert.equal(rig.joints.get('leg').group.parent,rig.root);
    for(const {group} of rig.joints.values()){
      const crop=group.children[0].attributes;
      const box=crop.viewBox.split(' ').map(Number);
      assert.ok(Math.abs(Number(crop.width)/Number(crop.height)-box[2]/box[3])<1e-9);
    }
  }
});

test('idle feet stay planted and heads do not wobble; poses ease instead of snapping',()=>{
  for(const kind of ['mallow','goose','fox']){
    const rig=create(kind),root=rig.root.attributes.transform,head=rig.joints.get('head').angle;
    for(let i=0;i<180;i++)rig.update(1/60,0,'idle');
    assert.equal(rig.root.attributes.transform,root);
    assert.equal(rig.joints.get('head').angle,head);
    rig.update(1/60,0,'nap');
    assert.ok(rig.joints.get('head').angle>0&&rig.joints.get('head').angle<3);
    for(let i=0;i<180;i++)rig.update(1/60,0,'nap');
    assert.ok(rig.joints.get('head').angle>11.9);
    for(const mode of ['walk','wave','look','sneak','pursue','sleep','idle']){
      for(let i=0;i<90;i++)rig.update(1/60,110,mode);
      assert.ok(transforms(rig).every(t=>!t.includes('NaN')&&!t.includes('Infinity')));
    }
  }
});

test('reduced motion is stable while still showing the requested pose',()=>{
  for(const kind of Object.keys(atlases)){
    const rig=create(kind);
    rig.update(1/60,100,'nap',true);
    const first=transforms(rig);
    for(let i=0;i<120;i++)rig.update(1/60,100,'nap',true);
    assert.deepEqual(transforms(rig),first);
    assert.equal(rig.joints.get('head').angle,12);
  }
});
