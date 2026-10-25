import {atlases} from './rig-data.js';

const NS = 'http://www.w3.org/2000/svg';
let nextRigId = 0;

// [joint, atlas part, shoulder/hip x, y, width, source pivot x, y].
// Pivots refer to visible artwork. Heights preserve the source aspect ratio.
// The limbs overlap the body, and the head/cape cover the shoulder seams.
export const rigLayouts = {
  mallow: {
    legs: [['legBack',5,117,157,32,.40,.12],['leg',4,87,154,33,.45,.13]],
    upper: [
      ['armBack',2,132,110,39,.32,.13],
      ['body',0,100,132,88,.50,.52],
      ['arm',3,76,111,43,.75,.13],
      ['head',1,105,93,111,.52,.85],
    ],
  },
  goose: {
    legs: [['legBack',4,111,150,32,.26,.08],['leg',3,83,150,32,.31,.08]],
    upper: [
      ['tail',5,48,129,31,.78,.63],
      ['head',1,132,132,63,.25,.92],
      ['body',0,95,136,117,.50,.50],
      ['wing',2,74,127,75,.12,.30],
    ],
  },
  fox: {
    legs: [['legBack',4,118,157,36,.42,.15],['leg',4,92,157,36,.42,.15]],
    upper: [
      ['tail',2,83,151,80,.12,.60],
      ['armBack',5,129,117,30,.38,.14],
      ['body',0,105,135,80,.50,.50],
      ['arm',3,88,122,30,.60,.13],
      ['head',1,114,108,104,.50,.87],
    ],
  },
  bee: {
    legs: [['leg',4,102,142,30,.50,.10]],
    upper: [
      ['wingBack',3,113,115,87,.96,.83],
      ['wing',2,114,113,89,.97,.96],
      ['body',0,91,137,106,.50,.50],
      ['head',1,137,130,75,.43,.77],
    ],
  },
};

function element(tag, attributes = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  return el;
}

export class CutoutRig {
  constructor(kind, host) {
    this.kind = kind;
    this.joints = new Map();
    this.mode = 'idle';
    this.phase = 0;
    this.clock = 0;
    this.stride = 0;
    this.pose = {nap:0, wave:0, look:0, angry:0, sneak:0};
    const atlas = atlases[kind];
    const filterId = `rig-alpha-${++nextRigId}`;
    const svg = element('svg', {class:'skeleton', viewBox:'0 0 200 210', 'aria-hidden':'true', overflow:'visible'});
    // Attenuate the generated alpha halo without altering the source images.
    svg.innerHTML = `<defs><filter id="${filterId}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="gamma" amplitude="1" exponent="4" offset="0"/></feComponentTransfer></filter></defs>`;
    this.root = element('g', {'data-root':''});
    this.upper = element('g', {'data-torso':''});
    svg.append(this.root);
    host.replaceChildren(svg);
    for (const part of rigLayouts[kind].legs) this.addPart(part, this.root, atlas, filterId);
    this.root.append(this.upper);
    for (const part of rigLayouts[kind].upper) this.addPart(part, this.upper, atlas, filterId);
    this.update(0);
  }

  addPart([name,index,x,y,width,pivotX,pivotY], parent, atlas, filterId) {
    const box = atlas.boxes[index];
    const height = width * box[3] / box[2];
    const group = element('g', {'data-joint':name});
    const crop = element('svg', {
      x:-width*pivotX, y:-height*pivotY, width, height,
      viewBox:box.join(' '), overflow:'hidden', preserveAspectRatio:'xMidYMid meet',
    });
    crop.append(element('image', {href:`assets/${atlas.file}`, width:atlas.width, height:atlas.height, filter:`url(#${filterId})`}));
    group.append(crop);
    parent.append(group);
    this.joints.set(name, {group,x,y,angle:0});
  }

  joint(name, angle, lift = 0) {
    const joint = this.joints.get(name);
    if (!joint) return;
    joint.angle = angle;
    joint.group.setAttribute('transform', `translate(${joint.x} ${(joint.y-lift).toFixed(3)}) rotate(${angle.toFixed(3)})`);
  }

  update(dt, velocity = 0, mode = 'idle', reduced = false) {
    this.mode = mode;
    const step = Math.max(0, Math.min(dt, .1));
    const blend = reduced ? 1 : 1-Math.exp(-step*9);
    const speed = Math.max(0, Math.min(velocity, 260));
    const moving = speed > 8 && mode !== 'nap' && mode !== 'sleep';
    this.stride += ((moving ? Math.min(1,speed/90) : 0)-this.stride)*blend;
    this.clock += reduced ? 0 : step;
    this.phase += reduced ? 0 : step * (3.5+speed*.035) * this.stride;
    const targets = {
      nap: +(mode==='nap'||mode==='sleep'), wave: +(mode==='wave'),
      look: +(mode==='look'), angry: +(mode==='angry'||mode==='pursue'), sneak: +(mode==='sneak'),
    };
    for (const key of Object.keys(this.pose)) this.pose[key] += (targets[key]-this.pose[key])*blend;
    const {nap,wave,look,angry,sneak} = this.pose;
    const swing = reduced ? 0 : Math.sin(this.phase)*this.stride*(1-nap);
    const breath = reduced ? 0 : Math.sin(this.clock*1.8);
    const bee = this.kind==='bee';
    const goose = this.kind==='goose';
    const legAngle = goose ? 17 : 10;
    this.joint('leg', swing*legAngle - nap*11, Math.max(0,swing)*2);
    this.joint('legBack', -swing*legAngle + nap*11, Math.max(0,-swing)*2);
    this.joint('body', 0);
    this.joint('arm', -swing*9 + nap*15 + wave*62 + (reduced?0:Math.sin(this.clock*5)*7*wave));
    this.joint('armBack', swing*8 - nap*12);
    this.joint('head', nap*12 - look*9 + angry*4);
    this.joint('tail', this.kind==='fox' ? -145 + breath*2 + swing*4 : breath*2);
    this.joint('wing', bee ? -9+(reduced?0:Math.sin(this.clock*31)*18)*(1-nap) : -angry*17+breath*1.2);
    this.joint('wingBack', 12+(reduced?0:Math.sin(this.clock*31+1.4)*15)*(1-nap));
    const settle = nap*(goose?12:9)+sneak*3;
    const lean = sneak*4+angry*3+nap*3;
    const breathing = breath*(nap?.65:.35);
    // Upper-body motion carries head and shoulders together. The planted legs
    // remain separate so idle breathing does not levitate the feet.
    this.upper.setAttribute('transform', `translate(0 ${(settle+breathing).toFixed(3)}) rotate(${lean.toFixed(3)} 100 157)`);
    const flight = bee ? (reduced?0:Math.sin(this.clock*2.1)*2.4) : 0;
    const baseline = goose ? 22 : 14;
    this.root.setAttribute('transform', `translate(0 ${(baseline-flight).toFixed(3)})`);
  }
}
