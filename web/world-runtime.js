import {CutoutRig} from './rig.js';
import {distance,advance,route,trailTarget,frameDelta} from './world-motion.js';

const NS='http://www.w3.org/2000/svg';
const PROPS={
  sandwich:'<path d="m5 24 13-17 43 8 8 20-15 19L9 44Z" fill="#b57c40"/><path d="m8 26 12-13 38 8 8 13-13 14L12 40Z" fill="#f5d896" stroke="#715334" stroke-width="2"/><path d="m10 34 44 10 12-11" fill="none" stroke="#75934b" stroke-width="6"/><path d="m11 39 43 11 10-12" fill="none" stroke="#c4774f" stroke-width="4"/><path d="m10 25 43 10 12-12" fill="none" stroke="#fff0b4" stroke-width="8"/>',
  honey:'<path d="M19 14h32v10l9 7v27q-25 10-48 0V31l7-7Z" fill="#dc9c32" stroke="#76522e" stroke-width="3"/><rect x="16" y="9" width="38" height="11" rx="4" fill="#96734b"/><rect x="17" y="33" width="38" height="21" rx="5" fill="#f5df9b"/><path d="m30 38 9-1 5 8-5 8-9-1-4-7Z" fill="#b47d2e"/>',
  coin:'<circle cx="36" cy="33" r="22" fill="#e4b65b" stroke="#8b6636" stroke-width="4"/><circle cx="36" cy="33" r="15" fill="none" stroke="#fff0ba" stroke-width="2"/><path d="M36 22v23m-6-18h12m-12 13h12" stroke="#8b6636" stroke-width="3"/>',
  badge:'<path d="m22 5 14 23L51 5" fill="none" stroke="#53633d" stroke-width="5"/><rect x="15" y="23" width="43" height="35" rx="5" fill="#f3dfad" stroke="#825e37" stroke-width="3"/><path d="m30 31 11-1 6 10-6 10-11-1-5-9Z" fill="#d49a39"/>',
  manager:'<rect x="7" y="17" width="61" height="39" rx="5" fill="#f7e3ad" stroke="#8d632e" stroke-width="3"/><path d="m20 28 8 8 10-15 10 15 8-8-5 17H25Z" fill="#cf963e"/><path d="M21 51h31" stroke="#7f653c" stroke-width="3"/>',
  paperwork:'<path d="m15 12 39-4 9 48-41 5Z" fill="#f6ebce" stroke="#8a714c" stroke-width="2"/><path d="m25 24 24-3m-22 12 23-3m-21 12 17-2" stroke="#a58c65" stroke-width="3"/>',
  crown:'<path d="m7 17 16 13L37 8l14 22 17-13-9 34H16Z" fill="#d4a24b" stroke="#785731" stroke-width="3"/><path d="M19 43h38" stroke="#f8dc87" stroke-width="4"/><circle cx="37" cy="35" r="4" fill="#ba7350"/>',
  duck:'<ellipse cx="29" cy="47" rx="23" ry="14" fill="#dfc887" stroke="#7f7145" stroke-width="2"/><path d="M39 44V25" stroke="#dfc887" stroke-width="16"/><circle cx="44" cy="22" r="14" fill="#dfc887" stroke="#7f7145" stroke-width="2"/><path d="m55 21 18 5-18 4Z" fill="#b97b42"/><circle cx="47" cy="19" r="2" fill="#49372f"/><path d="M16 45q12 9 21-1" fill="none" stroke="#b49b5d" stroke-width="2"/>',
  desk:'<path d="M5 23h65v10H5Z" fill="#a77b46" stroke="#6f5030" stroke-width="3"/><path d="M14 32v29m45-29v29" stroke="#775633" stroke-width="8"/><path d="M24 6h25v17H24Z" fill="#e8d399" stroke="#82623d" stroke-width="2"/><path d="M29 12h15m-15 5h12" stroke="#ad8c59" stroke-width="2"/>',
};

export class Woodland {
  constructor(root,{bubble=()=>{},sound=()=>{}}={}){
    this.root=root;this.bubble=bubble;this.sound=sound;this.actors=new Map();this.props=new Map();this.tasks=new Set();
    this.layer=document.createElement('div');this.layer.className='cast-layer';this.layer.setAttribute('aria-hidden','true');root.append(this.layer);
    this.paused=false;this.speed=1;this.time=0;this.epoch=0;this.previous=performance.now();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.frame=this.frame.bind(this);this.reset();
    // Advance independently of the compositor. Offscreen browser panels can
    // suspend requestAnimationFrame while their scripts and API calls still run.
    this.timer=setInterval(()=>this.frame(performance.now()),1000/60);
  }
  reset(){
    this.epoch++;for(const task of this.tasks)task.reject(new DOMException('Adventure changed','AbortError'));this.tasks.clear();this.layer.replaceChildren();this.actors.clear();this.props.clear();
    this.time=0;this.paused=false;this.gooseStarted=false;this.completed=new Set();
    this.spawn('mallow','mallow',[190,375],112,document.getElementById('actor'));
    this.root.dataset.sequence='idle';this.root.dataset.beat='';
  }
  cancel(){this.epoch++;for(const task of this.tasks)task.reject(new DOMException('Adventure changed','AbortError'));this.tasks.clear();for(const a of this.actors.values()){a.path=[];a.follow=null;a.mode='idle';}}
  spawn(id,kind,pos,size=90,existing){
    if(this.actors.has(id))return this.actors.get(id);
    const el=existing||document.createElement('div');el.id=id==='mallow'?'actor':`cast-${id}`;el.className=`world-character ${kind}`;
    el.style.width=`${size/960*100}%`;el.dataset.actor=id;
    if(!existing)this.layer.append(el);
    const rig=new CutoutRig(kind,el),a={id,kind,pos:[...pos],el,rig,mode:'idle',path:[],speed:115,follow:null,trail:[[...pos]],facing:1,velocity:0,attached:null};
    this.actors.set(id,a);return a;
  }
  remove(id){const a=this.actors.get(id);if(a&&id!=='mallow')a.el.remove();this.actors.delete(id);}
  point(id){return [...this.actors.get(id).pos];}
  mode(id,mode){const a=this.actors.get(id);if(a)a.mode=mode;}
  face(id,toward){const a=this.actors.get(id);if(a)a.facing=toward[0]<a.pos[0]?-1:1;}
  follow(id,leader,lag=60,offset=[0,0],speed=140,mode='follow'){
    const a=this.actors.get(id);a.path=[];a.follow={leader,lag,offset};a.speed=speed;a.mode=mode;
  }
  stop(id){const a=this.actors.get(id);if(a){a.follow=null;a.path=[];a.attached=null;a.mode='idle';}}
  move(id,destination,speed=115,usePaths=true){
    const a=this.actors.get(id);if(!a)return Promise.resolve(false);
    a.follow=null;a.attached=null;a.path=usePaths?route(a.pos,destination):[[...destination]];a.speed=speed;
    if(a.mode!=='sneak'&&a.mode!=='pursue')a.mode='walk';
    return this.waitUntil(()=>!a.path.length).then(done=>{if(done&&!a.path.length&&a.mode==='walk')a.mode='idle';return done;});
  }
  waitUntil(test){return new Promise((resolve,reject)=>this.tasks.add({test,resolve,reject,epoch:this.epoch}));}
  wait(ms){const until=this.time+ms/1000;return this.waitUntil(()=>this.time>=until);}
  say(id,text,duration=2000){const a=this.actors.get(id);if(!a)return;let el=a.el.querySelector('.cast-callout');if(!el){el=document.createElement('span');el.className='cast-callout';a.el.append(el);}el.textContent=text;a.sayUntil=this.time+duration/1000;}
  beat(name,text){this.root.dataset.beat=name;if(text)this.bubble(text);}
  prop(id,kind,location){
    let p=this.props.get(id);
    if(!p){const el=document.createElement('div');el.className=`world-prop prop-${kind}`;el.dataset.prop=id;el.innerHTML=`<svg viewBox="0 0 75 68" aria-hidden="true">${PROPS[kind]||PROPS.paperwork}</svg>`;this.layer.append(el);p={id,kind,el,pos:[0,0],owner:null};this.props.set(id,p);}
    p.owner=typeof location==='string'?location:null;p.pos=Array.isArray(location)?[...location]:this.point(location);return p;
  }
  propPoint(p){const a=p.owner&&this.actors.get(p.owner),offset=p.offset||(a?.kind==='bee'?[0,-10]:[27,-22]);return a?[a.pos[0]+offset[0],a.pos[1]+offset[1]]:p.pos;}
  async transfer(id,location,duration=700){
    const p=this.props.get(id);if(!p)return false;
    const from=this.propPoint(p),to=typeof location==='string'?this.point(location).map((v,i)=>v+(i?-22:27)):location;
    p.owner=null;const start=this.time;
    const ok=await this.waitUntil(()=>{const f=Math.min(1,(this.time-start)/(duration/1000));p.pos=[from[0]+(to[0]-from[0])*f,from[1]+(to[1]-from[1])*f-(this.reduced?0:Math.sin(f*Math.PI)*42)];return f===1;});
    if(ok){p.owner=typeof location==='string'?location:null;p.pos=[...to];}return ok;
  }
  removeProp(id){this.props.get(id)?.el.remove();this.props.delete(id);}
  frame(now){
    const dt=this.paused?0:frameDelta(now,this.previous)*this.speed;this.previous=now;this.time+=dt;
    for(const a of this.actors.values()){
      const before=[...a.pos];
      if(a.attached){const leader=this.actors.get(a.attached);if(leader)a.pos=[leader.pos[0]-5,leader.pos[1]-61];}
      else if(a.follow){const lead=this.actors.get(a.follow.leader);if(lead){let target=trailTarget(lead.trail,a.follow.lag);target=[target[0]+a.follow.offset[0],target[1]+a.follow.offset[1]];if(distance(a.pos,target)>5)a.pos=advance(a.pos,target,a.speed*dt);}}
      else if(a.path.length){let budget=a.speed*dt;while(a.path.length&&budget>0){const d=distance(a.pos,a.path[0]);a.pos=advance(a.pos,a.path[0],budget);budget-=d;if(d<=a.speed*dt+.01&&distance(a.pos,a.path[0])<.1)a.path.shift();else break;}}
      a.velocity=dt?distance(before,a.pos)/dt:a.velocity;
      if(a.pos[0]!==before[0])a.facing=a.pos[0]<before[0]?-1:1;
      if(distance(a.pos,a.trail.at(-1))>4){a.trail.push([...a.pos]);if(a.trail.length>350)a.trail.shift();}
      a.el.style.left=`${a.pos[0]/960*100}%`;a.el.style.top=`${a.pos[1]/600*100}%`;a.el.style.zIndex=String(Math.round(a.pos[1]));
      const visual=a.el.querySelector('.skeleton');visual.style.transform=`scaleX(${a.facing})`;
      if(dt)a.rig.update(dt,a.velocity,a.mode,this.reduced);
      a.el.dataset.mode=a.mode;a.el.dataset.x=a.pos[0].toFixed(1);a.el.dataset.y=a.pos[1].toFixed(1);
      const callout=a.el.querySelector('.cast-callout');if(callout&&this.time>a.sayUntil)callout.remove();
    }
    for(const p of this.props.values()){const point=this.propPoint(p);p.el.style.left=`${point[0]/960*100}%`;p.el.style.top=`${point[1]/600*100}%`;p.el.style.zIndex=String(Math.round(point[1]+45));p.el.dataset.owner=p.owner||'ground';}
    for(const task of [...this.tasks]){if(task.epoch!==this.epoch){this.tasks.delete(task);task.reject(new DOMException('Adventure changed','AbortError'));}else if(task.test()){this.tasks.delete(task);task.resolve(true);}}
  }
  async enter(scene){
    const token=this.epoch;
    this.root.dataset.sequence=scene.key;
    if(scene.key==='orchard'){
      this.spawn('kevin','fox',[415,480],103);this.prop('kevin-lunch','sandwich',[377,466]);this.mode('kevin','idle');
    }
    if(scene.key==='bees'){
      this.spawn('supervisor','bee',[scene.position[0]+65,scene.position[1]-22],66);this.prop('honey','honey',[scene.position[0]+53,scene.position[1]-3]);
    }
    if(scene.key==='bee_review'){
      this.beat('commute','The honey was free. The commute is not.');
      for(let i=0;i<3;i++){const a=this.actors.get(`bee-${i}`);if(a)this.follow(a.id,'mallow',45+i*36,[0,-16-i*6],170);}
      if(this.actors.has('supervisor'))await this.move('supervisor',[785,305],190,false);
    }
    await this.move('mallow',scene.position,scene.key==='chase'?160:120);
    if(token!==this.epoch)return false;
    if(scene.key==='chase'){
      if(!this.actors.has('goose'))this.spawn('goose','goose',[350,470],107);
      this.follow('goose','mallow',45,[0,0],180,'pursue');this.say('goose','HONK.',1600);
      await this.wait(800);this.mode('mallow','look');
    }
    if(scene.key==='bee_review'){
      this.prop('office-notes','paperwork',[798,324]);
      await Promise.all([0,1,2].filter(i=>this.actors.has(`bee-${i}`)).map(i=>this.move(`bee-${i}`,[735+i*37,291+i%2*24],160,false)));
      this.beat('clock-in','Congratulations. You have a workplace.');this.say('supervisor','You are late.',2000);await this.wait(1100);
    }
    return token===this.epoch;
  }
  async gooseResolution(event){
    this.root.dataset.sequence=`goose-${event.action}`;this.mode('goose','angry');this.stop('mallow');
    if(event.action==='return'){
      this.beat('caught','Fine. The sandwich can go home first.');this.mode('mallow','wave');await this.wait(700);
      this.stop('goose');await this.transfer('kevin-lunch','goose');this.say('goose','Evidence secured.');
      await this.move('goose',[435,474],155);await this.transfer('kevin-lunch','kevin');this.mode('kevin','wave');this.say('kevin','KEVIN. On the label.');
      await this.wait(1700);this.mode('goose','idle');
    }else if(event.action==='bribe'){
      this.beat('bribe','Justice accepts contactless.');this.prop('bribe','coin','mallow');this.stop('goose');await this.transfer('bribe','goose');this.say('goose','Case closed.');
      await this.move('goose',[422,497],150);this.removeProp('bribe');await this.wait(1000);
    }else if(event.action==='nap'){
      this.beat('goose-seat','Emergency camouflage: become furniture.');this.mode('mallow','nap');this.stop('goose');await this.wait(1400);
      await this.move('goose',[this.point('mallow')[0]-5,this.point('mallow')[1]-61],100,false);this.actors.get('goose').attached='mallow';this.mode('goose','idle');this.say('goose','Acceptable chair.');await this.wait(1800);
    }else{
      this.beat('escape','A high-speed chase. By woodland standards.');this.follow('goose','mallow',37,[0,0],184,'pursue');
      for(const point of [[356,370],[285,400],[210,452],[282,530],[430,522],[460,421]]){if(!await this.move('mallow',point,191,false))return;this.say('goose','HONK!',650);this.sound(160);}
      this.stop('goose');this.mode('goose','nap');this.say('goose','I need a union.');await this.move('mallow',[460,370],160,false);await this.wait(1400);
    }
    this.mode('mallow','idle');
  }
  async beeResolution(event){
    this.root.dataset.sequence=`work-${event.action}`;this.stop('mallow');
    if(event.action==='sleep'){
      this.beat('meeting','This meeting could have been a nap.');this.mode('mallow','nap');
      this.prop('slides','paperwork',[794,303]);
      for(let i=0;i<3;i++){this.say('supervisor',`${[12,53,94][i]} slides later…`,1300);this.mode('supervisor','wave');await this.wait(1500);}
      this.removeProp('badge');this.prop('promotion','manager','supervisor');await this.transfer('promotion','mallow');this.say('supervisor','Management material.');this.beat('promotion','Slept through work. Promoted anyway.');await this.wait(1700);
    }else if(event.action==='quit'){
      this.beat('resign','I am pursuing horizontal opportunities.');await this.transfer('honey','supervisor');await this.transfer('badge','supervisor');this.removeProp('badge');this.say('supervisor','Please return the lanyard.');
      await this.wait(1200);await Promise.all([0,1,2].map(i=>this.move(`bee-${i}`,[802+i*22,276],150,false)));for(let i=0;i<3;i++)this.remove(`bee-${i}`);
    }else{
      this.beat('pitch','BUY HONEY. A presentation in its entirety.');this.mode('mallow','wave');this.prop('advert','honey',[this.point('mallow')[0]+4,this.point('mallow')[1]-64]);
      await this.wait(1700);for(let i=0;i<3;i++){this.mode(`bee-${i}`,'wave');this.say(`bee-${i}`,'BZZ!',1300);}this.say('supervisor','Refreshingly authentic.');await this.wait(1500);this.removeProp('advert');
    }
    if(event.action!=='quit')for(let i=0;i<3;i++)if(this.actors.has(`bee-${i}`))this.follow(`bee-${i}`,'mallow',45+i*37,[0,-16-i*6],175);
    this.mode('mallow','idle');
  }
  async perform(event,state){
    const key=`${state.id}:${event.turn}`;if(this.completed.has(key))return true;
    const token=this.epoch;this.beat(event.action,event.quip);
    if(event.key==='orchard'&&event.action==='steal'){
      this.root.dataset.sequence='theft';this.mode('mallow','sneak');this.mode('kevin','look');await this.move('mallow',[372,469],80,false);
      await this.transfer('kevin-lunch','mallow');await this.wait(850);this.mode('kevin','angry');this.say('kevin','MY SANDWICH.');this.sound(220);
      await this.wait(1000);this.spawn('goose','goose',[452,500],107);this.mode('goose','angry');this.say('goose','On it.');await this.wait(800);
      this.follow('goose','mallow',43,[0,0],174,'pursue');this.beat('pursuit','Kevin has outsourced customer service.');
      for(const point of [[330,528],[220,492],[210,420],[300,370],[429,430]]){if(!await this.move('mallow',point,185,false))return false;}
      this.mode('mallow','look');await this.wait(750);
    }else if(event.key==='chase')await this.gooseResolution(event);
    else if(event.key==='bees'&&event.action==='honey'){
      this.root.dataset.sequence='hired';this.spawn('supervisor','bee',[755,300],66);
      if(!this.props.has('honey'))this.prop('honey','honey','supervisor');await this.transfer('honey','mallow');await this.wait(600);
      this.prop('badge','badge','supervisor');await this.transfer('badge','mallow');this.say('supervisor','Welcome aboard.');
      const at=this.point('mallow');
      for(let i=0;i<3;i++){this.spawn(`bee-${i}`,'bee',[at[0]+65+i*20,at[1]-45+i*15],54);this.follow(`bee-${i}`,'mallow',45+i*36,[0,-16-i*6],165);}
      this.beat('contract','The free sample came with coworkers.');await this.wait(2100);
    }else if(event.key==='bee_review')await this.beeResolution(event);
    else{
      this.mode('mallow',event.animation==='nap'?'nap':event.animation==='wave'?'wave':event.animation==='steal'?'sneak':'idle');
      if(event.animation==='coin'){this.prop('payment','coin','mallow');await this.transfer('payment',[event.position[0]+70,event.position[1]]);this.removeProp('payment');}
      if(event.new_item?.includes('honey')&&!this.props.has('honey'))this.prop('honey','honey','mallow');
      if(event.deltas.food>0&&!this.props.has('kevin-lunch')&&!this.props.has('lunch')){this.prop('lunch','sandwich',[event.position[0]+65,event.position[1]]);await this.transfer('lunch','mallow');}
      await this.wait(event.animation==='nap'?2000:1300);
    }
    if(token!==this.epoch)return false;
    this.mode('mallow',event.animation==='nap'?'nap':'idle');this.completed.add(key);return true;
  }
  reconcile(state){
    if(!state.flags.includes('bee_contract')){
      for(let i=0;i<3;i++)this.remove(`bee-${i}`);this.removeProp('badge');
    }
    if(state.items.includes('goose passenger')&&this.actors.has('goose'))this.actors.get('goose').attached='mallow';
    if(state.flags.some(f=>f==='self_crowned'||f==='duck_king'))this.prop('royal-crown','crown','mallow').offset=[0,-99];else this.removeProp('royal-crown');
    for(let i=0;i<2;i++){
      if(state.flags.some(f=>f==='duck_friend'||f==='duck_king'))this.prop(`duck-${i}`,'duck','mallow').offset=[-48-i*37,9+i*7];else this.removeProp(`duck-${i}`);
    }
    if(state.food===0)for(const p of [...this.props.values()])if(p.owner==='mallow'&&['honey','sandwich'].includes(p.kind))this.removeProp(p.id);
  }
  async finish(state){
    this.beat('home',state.ending.title);this.mode('mallow',state.history.at(-1)?.animation==='nap'?'nap':'wave');
    if(state.flags.includes('bee_contract')){const bee=this.actors.get('bee-0');if(bee){this.prop('homework','paperwork',bee.id);this.say(bee.id,'Monday. 9 AM.',3000);}}
    await this.wait(1200);
  }
}
