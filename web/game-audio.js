// Generated ElevenLabs recordings with local procedural effects as a fallback.
export class GameAudio{
 constructor(){this.context=null;this.muted=false;this.effects=true;this.ambience=true;this.buffers=new Map();this.assets={};this.inside=false;this.combat=false;this.voices=new Set();this.lastPlayed=new Map();try{const settings=JSON.parse(localStorage.getItem('napquest-audio-settings')||'{}');this.muted=settings.muted===true;if(typeof settings.effects==='boolean')this.effects=settings.effects;if(typeof settings.ambience==='boolean')this.ambience=settings.ambience;}catch{}}
 async unlock(){
  if(this.context){if(this.context.state==='suspended')await this.context.resume();return;}
  const c=this.context=new AudioContext();this.fx=c.createGain();this.bed=c.createGain();const compressor=c.createDynamicsCompressor();compressor.threshold.value=-15;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.12;compressor.connect(c.destination);this.fx.connect(compressor);this.bed.connect(compressor);this.update();
  const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),samples=buffer.getChannelData(0);let last=0;for(let i=0;i<samples.length;i++){last=(last+(Math.random()*2-1)*.02)/1.02;samples[i]=last*3;}
  this.noise=buffer;const wind=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();wind.buffer=buffer;wind.loop=true;filter.type='lowpass';filter.frequency.value=600;gain.gain.value=.11;wind.connect(filter);filter.connect(gain);gain.connect(this.bed);wind.start();this.wind=gain;
  this.birdTimer=setInterval(()=>{if(!this.forest&&this.ambience&&!this.inside&&!document.hidden){this.tone(1800+Math.random()*800,.16,.018,this.bed);setTimeout(()=>this.tone(2300,.12,.012,this.bed),220);}},9000);
  document.addEventListener('visibilitychange',()=>this.update());
  try{const response=await fetch('assets/audio/manifest.json');if(response.ok){const manifest=await response.json();this.assets=manifest.files||{};for(const [name,path] of Object.entries(this.assets)){try{const audio=await fetch(path);if(audio.ok)this.buffers.set(name,await c.decodeAudioData(await audio.arrayBuffer()));}catch{}}if(this.buffers.has('forest')){this.wind.gain.value=0;const forest=c.createBufferSource();forest.buffer=this.buffers.get('forest');forest.loop=true;forest.connect(this.bed);forest.start();this.forest=forest;}}}catch{}
 }
 update(){try{localStorage.setItem('napquest-audio-settings',JSON.stringify({muted:this.muted,effects:this.effects,ambience:this.ambience}));}catch{}if(!this.context)return;const visible=!document.hidden&&!this.muted;this.fx.gain.setTargetAtTime(this.effects&&visible ? .25 : 0,this.context.currentTime,.08);this.bed.gain.setTargetAtTime(this.ambience&&visible ? (this.inside ? .12 : this.combat ? .17 : .3) : 0,this.context.currentTime,.2);try{localStorage.setItem('napquest-audio-settings',JSON.stringify({muted:this.muted,effects:this.effects,ambience:this.ambience}));}catch{}}
 setCombat(value){if(this.combat!==value){this.combat=value;this.update();}}
 playAt(name,position,listener){const dx=position[0]-listener.x,dy=position[1]-listener.y,d=Math.hypot(dx,dy);if(d>18)return;this.play(name,{volume:1/(1+d*.12),pan:Math.max(-.8,Math.min(.8,dx/10))});}
 setInside(value){if(this.inside!==value){this.inside=value;this.update();}}
 tone(frequency,duration,volume,bus=this.fx,type='sine',end=frequency){if(!this.context||!bus)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(1,end),c.currentTime+duration);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(bus);o.start();o.stop(c.currentTime+duration);}
 rustle(duration,volume,frequency){if(!this.context)return;const c=this.context,s=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;filter.type='lowpass';filter.frequency.value=frequency;g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);s.connect(filter);filter.connect(g);g.connect(this.fx);s.start(c.currentTime,Math.random());s.stop(c.currentTime+duration);}
 play(name,{volume=1,pan=0}={}){
  if(!this.context||this.muted||!this.effects||document.hidden)return;
  const c=this.context,now=c.currentTime,cooldown=({step:.17,melee:.1,wallhit:.16,slingshot:.12,cannon:.18,build:.8,bees:1}[name]??.08);
  if(now-(this.lastPlayed.get(name)??-Infinity)<cooldown||this.voices.size>=14)return;
  this.lastPlayed.set(name,now);
  const buffer=this.buffers.get(name)||this.buffers.get({upgrade:'win'}[name]);
  if(buffer){
   const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;source.playbackRate.value=.97+Math.random()*.06;
   const loudness=({step:.23,bees:.35,bell:.6,honk:.6,melee:.55,wallhit:.65,cannon:.65,slingshot:.48,build:.75}[name]??.8)*volume;
   const duration=Math.min(buffer.duration/source.playbackRate.value,name==='build'?1.2:4);
   gain.gain.setValueAtTime(loudness,now);gain.gain.setValueAtTime(loudness,now+Math.max(0,duration-.04));gain.gain.linearRampToValueAtTime(0,now+duration);
   source.connect(gain);if(c.createStereoPanner){const panner=c.createStereoPanner();panner.pan.value=pan;gain.connect(panner);panner.connect(this.fx);}else gain.connect(this.fx);
   this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};source.start();source.stop(now+duration);return;
  }
  if(name==='step')this.rustle(.1,.28,500);
  else if(name==='chop'||name==='build'){this.rustle(.15,.6,1200);this.tone(180,.12,.28,this.fx,'triangle',70);}
  else if(name==='melee'||name==='wallhit'||name==='wallbreak'){this.rustle(name==='wallbreak'?.5:.15,.45,700);this.tone(130,.18,.2,this.fx,'triangle',55);}
  else if(name==='cannon'){this.rustle(.25,.5,600);this.tone(100,.2,.3,this.fx,'triangle',40);}
  else if(name==='slingshot')this.tone(450,.13,.16,this.fx,'triangle',120);
  else if(name==='boar')this.tone(110,.35,.1,this.fx,'sawtooth',70);
  else if(name==='collect'||name==='train'){this.rustle(.2,.25,900);this.tone(name==='train'?1800:800,.2,.13,this.fx,'sine',1200);}
  else if(name==='eat')this.rustle(.25,.35,2000);
  else if(name==='mine'){this.tone(1400,.2,.16);this.tone(2170,.13,.07);}
  else if(name==='bell'){this.tone(660,1.8,.3);this.tone(990,1.4,.09);}
  else if(name==='honk'){this.tone(310,.3,.12,this.fx,'sawtooth',170);this.tone(350,.25,.07,this.fx,'triangle',190);}
  else if(name==='coin'||name==='upgrade'||name==='win'){this.tone(660,.25,.2);setTimeout(()=>this.tone(990,.35,.15),90);}
  else if(name==='bees')this.tone(220,.5,.1,this.fx,'sawtooth',245);
  else if(name==='door'){this.tone(120,.35,.18,this.fx,'triangle',65);this.rustle(.3,.25,800);}
  else if(name==='whistle')this.tone(1800,.25,.15,this.fx,'sine',2400);
  else this.rustle(.35,.3,1800);
 }
}
