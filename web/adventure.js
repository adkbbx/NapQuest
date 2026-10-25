import {Woodland} from './world-runtime.js';
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let game=null, ready=false, active=false, paused=false, speed=1, generation=0, controller=null;
const dayParameter=new URLSearchParams(location.search).get('day');
const initialDay=/^\d{1,10}$/.test(dayParameter??'')&&Number(dayParameter)<2**31?Number(dayParameter):41;
let recording=[],recordingStart=null;
let position=[190,375], trail=[[190,375]], lastSeed=initialDay, soundOn=false, audio=null;
const world=new Woodland($('world'),{bubble,sound:frequency=>chime(frequency)});
const resourceNames={coins:'coins',food:'food',energy:'energy',fame:'fame',trouble:'trouble',naps:'naps'};
const svgStart='<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="99" rx="29" ry="8" fill="#52633d" opacity=".18"/>';
const eyes='<circle cx="39" cy="48" r="3" fill="#49372f"/><circle cx="61" cy="48" r="3" fill="#49372f"/><path d="m42 65q8 6 16 0" fill="none" stroke="#49372f" stroke-width="2.5" stroke-linecap="round"/>';
function npcArt(kind){
  const outline='stroke="#67523a" stroke-width="2.5" stroke-linejoin="round"';
  if(kind==='sign')return svgStart+`<path d="M49 38v62" ${outline}/><path d="M12 20h61l15 15-15 15H12Z" fill="#b68d58" ${outline}/><path d="m30 34 37 0m-8-7 9 7-9 7" fill="none" stroke="#f4e5bc" stroke-width="3"/></svg>`;
  if(kind==='duck'||kind==='goose')return svgStart+`<ellipse cx="43" cy="81" rx="29" ry="17" fill="${kind==='goose'?'#eee6cb':'#dfc887'}" ${outline}/><path d="M57 77V45" stroke="${kind==='goose'?'#eee6cb':'#dfc887'}" stroke-width="23"/><circle cx="60" cy="38" r="19" fill="${kind==='goose'?'#eee6cb':'#dfc887'}" ${outline}/><path d="m75 36 24 8-24 7Z" fill="#ba7f40" ${outline}/><circle cx="65" cy="35" r="3" fill="#49372f"/><path d="m28 95-4 8m31-8 4 8" stroke="#b97b42" stroke-width="4"/><path d="M23 76q15 15 31 2" fill="none" ${outline}/></svg>`;
  if(kind==='snail')return svgStart+`<path d="M12 95q3-18 47-15l18-30q15 14 10 44Z" fill="#a4ad72" ${outline}/><circle cx="38" cy="72" r="25" fill="#b99165" ${outline}/><path d="M29 58q29-9 25 17T31 83q-13-9-1-15t13 9" fill="none" ${outline}/><path d="m77 58-5-27m11 24 10-23" ${outline}/><circle cx="72" cy="29" r="5" fill="#f2e9c8" ${outline}/><circle cx="94" cy="30" r="5" fill="#f2e9c8" ${outline}/></svg>`;
  if(kind==='mushroom')return svgStart+`<path d="m37 49-4 48h34l-4-48" fill="#ede2bd" ${outline}/><path d="M8 48q0-67 84 0-42 20-84 0" fill="#b87550" ${outline}/><circle cx="31" cy="30" r="8" fill="#eee4c4"/><circle cx="59" cy="21" r="6" fill="#eee4c4"/><circle cx="73" cy="38" r="5" fill="#eee4c4"/><circle cx="43" cy="70" r="3" fill="#49372f"/><circle cx="57" cy="70" r="3" fill="#49372f"/><path d="m43 82q7 5 14 0" fill="none" ${outline}/></svg>`;
  if(kind==='bee')return svgStart+`<ellipse cx="29" cy="39" rx="20" ry="13" fill="#e8e7cb" ${outline}/><ellipse cx="71" cy="39" rx="20" ry="13" fill="#e8e7cb" ${outline}/><ellipse cx="50" cy="67" rx="28" ry="30" fill="#d3ac50" ${outline}/><path d="M26 61h48M26 76h48" stroke="#6d573b" stroke-width="8"/><circle cx="50" cy="41" r="20" fill="#d3ac50" ${outline}/><circle cx="43" cy="38" r="3" fill="#49372f"/><circle cx="57" cy="38" r="3" fill="#49372f"/><path d="m43 49 14 0" ${outline}/><path d="m39 25-8-11m30 11 8-11" ${outline}/></svg>`;
  let color={frog:'#a0ad69',fox:'#be8256',squirrel:'#b18a62',goblin:'#94a160',owl:'#9a825d',badger:'#8a8c79'}[kind]||'#a0ad69';
  let ears=kind==='fox'?'<path d="m22 36-2-32 22 22m16 0L80 4l-2 32" fill="#be8256" stroke="#67523a" stroke-width="2.5"/>':kind==='frog'?'<circle cx="31" cy="29" r="13" fill="#a0ad69"/><circle cx="69" cy="29" r="13" fill="#a0ad69"/>':'<circle cx="28" cy="28" r="12" fill="'+color+'"/><circle cx="72" cy="28" r="12" fill="'+color+'"/>';
  const cap=kind==='goblin'?'<path d="M13 26q37-26 74 0Z" fill="#a17a51" stroke="#67523a" stroke-width="3"/><path d="M23 20q27-48 54 0Z" fill="#a17a51" stroke="#67523a" stroke-width="2"/>':'';
  return svgStart+`<ellipse cx="50" cy="83" rx="27" ry="19" fill="${color}" ${outline}/>${ears}<ellipse cx="50" cy="49" rx="32" ry="30" fill="${color}" ${outline}/>${kind==='fox'?'<path d="m20 48 30 30 30-30-30 14Z" fill="#f1dfb8"/>':''}${kind==='badger'?'<path d="m31 22 8 4-2 38-14-19m46-23-8 4 2 38 14-19" fill="#e9e2c6"/>':''}${eyes}${kind==='owl'?'<circle cx="37" cy="47" r="14" fill="none" stroke="#e9dfb8" stroke-width="7"/><circle cx="63" cy="47" r="14" fill="none" stroke="#e9dfb8" stroke-width="7"/>':''}${cap}<path d="m31 96-5 8m43-8 5 8" stroke="#67523a" stroke-width="6" stroke-linecap="round"/></svg>`;
}
async function api(path,data,signal){
  const response=await fetch(path,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(60000)]):AbortSignal.timeout(10000)});
  const result=await response.json();
  if(!response.ok){const error=new Error(result.error||'The woods lost the connection.');error.code=result.code;error.status=response.status;throw error;}
  return result;
}
function report(text){$('error').textContent=text;$('error').hidden=!text;}
function announce(text){$('announcement').textContent=text;}
function bubble(text){$('speech').textContent=`“${text}”`;}
function actorPosition(point){position=point;const a=world.actors.get('mallow');if(a)a.pos=[...point];}
function actorState(animation=''){world.mode('mallow',animation==='nap'?'nap':animation==='walking'?'walk':'idle');}
function resources(){
  for(const name of ['coins','food','energy','fame','trouble'])$(name).textContent=game?.[name]??({coins:3,food:0,energy:6,fame:0,trouble:0}[name]);
  $('friends').textContent=game?.friends.length??0;
  $('turn-count').textContent=`${game?.history.length??0} / 7`;
  $('journal-count').textContent=game?`${game.history.length} decisions made`:'Waiting for ambition';
  $('progress-dots').replaceChildren();
  for(let i=0;i<7;i++){const dot=document.createElement('i');dot.className=i<(game?.history.length??0)?'done':i===(game?.history.length??-1)&&active?'active':'';$('progress-dots').append(dot);}
}
function checkpoint(token){return token===generation&&!controller?.signal.aborted;}
async function hold(milliseconds,token){await world.wait(milliseconds);return checkpoint(token);}
async function unpaused(token){while(paused&&checkpoint(token))await new Promise(r=>setTimeout(r,80));return checkpoint(token);}
function showScene(scene){
  $('scene-name').textContent=scene.title;
  $('stage-caption').textContent=scene.callback||'One goal. The next questionable decision.';
  $('current-situation').hidden=false;$('current-situation').replaceChildren();
  const title=document.createElement('strong');title.textContent=scene.title;
  const situation=document.createElement('span');situation.textContent=scene.situation;
  $('current-situation').append(title,situation);
  $('npc').innerHTML=npcArt(scene.npc);$('npc').hidden=['fox','goose','bee'].includes(scene.npc);$('npc').className='npc';
  $('npc').style.left=`${Math.min(880,scene.position[0]+73)/960*100}%`;
  $('npc').style.top=`${scene.position[1]/600*100}%`;
  $('world').classList.toggle('wet-world',scene.key==='rain');
}
function addEntry(event){
  const entry=document.createElement('article');entry.className='entry';entry.dataset.turn=event.turn;
  const heading=document.createElement('div');heading.className='entry-heading';
  const number=document.createElement('span');number.className='turn-number';number.textContent=String(event.turn).padStart(2,'0');
  const title=document.createElement('h3');title.textContent=event.action_label;heading.append(number,title);entry.append(heading);
  if(event.callback){const cause=document.createElement('p');cause.className='callback';cause.textContent=event.callback;entry.append(cause);}
  const story=document.createElement('p');story.textContent=event.story;entry.append(story);
  const changes=document.createElement('div');changes.className='changes';
  for(const [resource,delta] of Object.entries(event.deltas)){const chip=document.createElement('span');chip.className=`change ${delta<0?'cost':''}`;chip.textContent=`${delta>0?'+':''}${delta} ${resourceNames[resource]}`;changes.append(chip);}
  entry.append(changes);
  for(const [name,value] of [['Friend',event.new_friend],['Acquired',event.new_item]])if(value){const text=document.createElement('p');text.className='new-object';text.textContent=`${name}: ${value}`;entry.append(text);}
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='What Laya chose';details.append(summary);
  const scores=document.createElement('div');scores.className='model-scores';
  for(const [choice,score] of Object.entries(event.evidence.probabilities)){const label=document.createElement('span');label.textContent=choice===event.action?`${choice} · chosen`:choice;const value=document.createElement('span');value.textContent=`${(score*100).toFixed(1)}%`;scores.append(label,value);}
  details.append(scores);const timing=document.createElement('p');timing.textContent=`Local Laya · ${event.evidence.elapsed_ms} ms. Model scores, not guaranteed correctness.`;details.append(timing);entry.append(details);
  $('journal').append(entry);$('journal').scrollTo({top:$('journal').scrollHeight,behavior:reduced?'instant':'smooth'});
}
function mote(event){
  const positive=Object.entries(event.deltas).find(([k,v])=>v>0&&k!=='trouble')||Object.entries(event.deltas)[0];
  if(!positive)return;
  const effect=document.createElement('span');effect.className='mote';effect.style.left=`${position[0]/960*100}%`;effect.style.top=`${position[1]/600*100-13}%`;
  effect.textContent=`${positive[1]>0?'+':''}${positive[1]} ${resourceNames[positive[0]]}`;$('world').append(effect);setTimeout(()=>effect.remove(),1800);
}
async function act(event,token){
  $('stage-caption').textContent=event.action_label;
  if(!await world.perform(event,game)||!checkpoint(token))return;
  position=world.point('mallow');resources();mote(event);world.reconcile(game);
  chime(event.animation==='nap'?196:event.new_friend?523:392);
}
async function finish(){
  await world.finish(game);
  active=false;paused=false;document.body.classList.remove('paused');
  $('pause').disabled=true;$('thinking').hidden=true;$('current-situation').hidden=true;
  $('ending').hidden=false;
  $('ending-title').textContent=game.ending.title;$('ending-subtitle').textContent=game.ending.subtitle;
  $('verdict').textContent=`Home with ${game.food} food · ${game.spent} coins spent · ${game.naps} naps · ${game.friends.length} friends`;
  $('souvenir').textContent=`Souvenir of the afternoon: ${game.ending.souvenir}.`;
  $('loose-ends').replaceChildren();
  for(const text of game.ending.loose_ends){const li=document.createElement('li');li.textContent=text;$('loose-ends').append(li);}
  $('stage-caption').textContent=game.ending.title;$('scene-name').textContent='Home. Subject to interpretation.';
  $('npc').hidden=true;$('world').classList.remove('wet-world');
  announce(`${game.ending.title} ${game.ending.subtitle}`);
  let past=[];try{past=JSON.parse(localStorage.getItem('napquest-afternoons')||'[]');}catch{}
  const previous=past.find(p=>p.seed===game.seed);
  $('past-run').hidden=!previous;
  if(previous)$('past-run').textContent=`Last time on this same day: ${previous.food} food, ${previous.friends} friends, ${previous.naps} naps. This time: ${game.food} food, ${game.friends.length} friends, ${game.naps} naps.`;
  if(!past.some(p=>p.id===game.id)){
    past.unshift({id:game.id,goal:game.goal,seed:game.seed,food:game.food,friends:game.friends.length,naps:game.naps,title:game.ending.title});
    try{localStorage.setItem('napquest-afternoons',JSON.stringify(past.slice(0,8)));}catch{}
  }
  resources();
}
async function loop(token){
  try{
    while(game?.phase==='running'&&checkpoint(token)){
      if(!await unpaused(token))return;
      const scene=game.next_scene;showScene(scene);
      if(!await world.enter(scene)||!checkpoint(token))return;
      await hold(650,token);if(!await unpaused(token))return;
      $('thinking').hidden=false;$('thinking-text').textContent='Mallow is considering his options…';
      $('stage-caption').textContent='Laya is choosing. Mallow is looking suspiciously confident.';
      const request={revision:game.revision,request_id:crypto.randomUUID()};
      let next;
      for(let attempt=0;attempt<4;attempt++){
        try{next=await api(`/api/adventures/${game.id}/step`,request,controller.signal);break;}
        catch(error){if(error.code==='busy'&&attempt<3){await hold(700,token);continue;}throw error;}
      }
      if(!checkpoint(token))return;
      game=next;recording.push(next);$('thinking').hidden=true;
      const event=game.history.at(-1);
      if(!await unpaused(token))return;
      await act(event,token);if(!checkpoint(token))return;addEntry(event);
      announce(`${event.turn}. ${event.story}`);
      await hold(500,token);
    }
    if(checkpoint(token)&&game?.phase==='ended')await finish();
  }catch(error){
    if(!checkpoint(token))return;
    active=false;paused=true;world.paused=true;document.body.classList.add('paused');$('thinking').hidden=true;
    report(`${error.message} Your goal and completed choices are still here.`);$('retry').hidden=false;
    $('pause').textContent='Paused';
  }
}
async function begin(seed){
  const goal=$('goal').value.trim();if(!goal||!ready)return;
  controller?.abort();world.cancel();const token=++generation;controller=new AbortController();
  paused=false;active=false;document.body.classList.remove('paused');report('');$('retry').hidden=true;
  $('go').disabled=true;$('go').textContent='Laya is reading the goal…';
  try{
    const payload={goal};if(seed!==undefined&&seed!==null)payload.seed=seed;
    const fresh=await api('/api/adventures',payload,controller.signal);if(!checkpoint(token))return;
    world.reset();world.speed=speed;recording=[];recordingStart=fresh;game=fresh;lastSeed=game.seed;trail=[[190,375]];actorPosition([190,375]);actorState();
    $('trail').setAttribute('points','190,375');$('journal').replaceChildren();$('ending').hidden=true;$('waiting').hidden=true;
    $('goal-form').hidden=true;$('run-bar').hidden=false;document.body.classList.add('in-adventure');$('pause').disabled=false;$('pause').textContent='Pause';$('pause').setAttribute('aria-pressed','false');
    $('goal-display').textContent=game.goal;$('ambition').textContent=`Mallow's reading of the mission: ${game.mission_label.toLowerCase()}.`;
    $('day-name').textContent=`Mossbrook · ${game.day}`;resources();active=true;
    bubble('I have understood most of the assignment.');announce('The adventure has started. Mallow will decide for himself.');
    loop(token);
  }catch(error){if(checkpoint(token))report(error.message);}
  finally{if(token===generation){$('go').disabled=!ready;$('go').innerHTML='Set Mallow loose <span aria-hidden="true">→</span>';}}
}
function changeGoal(){
  controller?.abort();world.cancel();generation++;active=false;paused=false;document.body.classList.remove('paused');
  $('goal-form').hidden=false;$('run-bar').hidden=true;document.body.classList.remove('in-adventure');$('thinking').hidden=true;$('retry').hidden=true;
  $('current-situation').hidden=true;$('goal').focus({preventScroll:true});report('');
  $('go').disabled=!ready;$('go').innerHTML='Set Mallow loose <span aria-hidden="true">→</span>';
  $('stage-caption').textContent=lastSeed===null?'Choose a goal.':'Same day, new ambition. Change the goal and set him loose.';
}
$('goal-form').addEventListener('submit',event=>{event.preventDefault();begin(lastSeed);});
document.querySelectorAll('[data-goal]').forEach(button=>button.addEventListener('click',()=>{$('goal').value=button.dataset.goal;$('goal').focus({preventScroll:true});}));
$('change-goal').addEventListener('click',changeGoal);$('different-goal').addEventListener('click',changeGoal);
$('watch-again').addEventListener('click',async()=>{
  if(!recording.length)return;
  controller?.abort();world.cancel();const token=++generation;controller=new AbortController();
  world.reset();world.speed=speed;game=recordingStart;resources();paused=false;active=true;$('pause').disabled=false;$('pause').textContent='Pause';
  $('pause').setAttribute('aria-pressed','false');document.body.classList.remove('paused');
  $('ending').hidden=true;$('journal').replaceChildren();$('ambition').textContent='Recorded Laya decisions · no new inference';
  try{
    for(const saved of recording){
      const event=saved.history.at(-1);showScene(event);
      if(!await world.enter(event)||!checkpoint(token))return;
      game=saved;await act(event,token);if(!checkpoint(token))return;addEntry(event);await hold(500,token);
    }
    if(checkpoint(token))await finish();
  }catch(error){if(checkpoint(token))report(error.message);}
});
$('same-day').addEventListener('click',()=>begin(game.seed));$('another-day').addEventListener('click',()=>begin());
$('pause').addEventListener('click',()=>{
  if(!active)return;paused=!paused;world.paused=paused;document.body.classList.toggle('paused',paused);
  $('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));
  $('stage-caption').textContent=paused?'Afternoon paused. Even the bad decisions can wait.':'Mallow is back on his own schedule.';
});
$('speed').addEventListener('click',()=>{speed=speed===1?2:speed===2?4:1;world.speed=speed;$('speed').textContent=`${speed}× speed`;});
$('retry').addEventListener('click',async()=>{
  if(!game)return;
  const token=generation;report('');
  try{
    const recovered=await api(`/api/adventures/${game.id}`);if(token!==generation)return;
    const oldCount=$('journal').children.length;game=recovered;
    world.paused=false;for(const event of game.history.slice(oldCount)){await world.perform(event,game);addEntry(event);}world.reconcile(game);
    resources();$('retry').hidden=true;paused=false;active=true;document.body.classList.remove('paused');$('pause').textContent='Pause';
    controller=new AbortController();loop(token);
  }catch(error){if(token===generation&&error.name!=='AbortError')report(error.message);}
});
async function poll(){
  try{
    const status=await api('/api/status');ready=status.status==='ready';
    $('model-dot').className=`status-dot ${ready?'':status.status}`;
    $('model-status').textContent=ready?'Laya · running locally':status.status==='error'?'Laya is unavailable. No decisions are faked.':'Loading local Laya…';
    $('retry-model').hidden=status.status!=='error';$('model-status').title=`${status.model} · ${status.revision.slice(0,8)}`;
    if(!$('goal-form').hidden)$('go').disabled=!ready;
  }catch{ready=false;$('model-status').textContent='Game server disconnected.';$('model-dot').className='status-dot error';$('go').disabled=true;}
  setTimeout(poll,ready?12000:2000);
}
$('retry-model').addEventListener('click',async()=>{try{await api('/api/model/retry',{});}catch(error){report(error.message);}});
function chime(frequency){
  if(!soundOn||!audio)return;
  const o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.value=frequency;
  gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.45);
  o.connect(gain);gain.connect(audio.destination);o.start();o.stop(audio.currentTime+.45);
}
$('sound').addEventListener('click',async()=>{
  if(!audio)audio=new AudioContext();soundOn=!soundOn;if(soundOn){await audio.resume();chime(392);}else await audio.suspend();
  $('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundOn));
});
$('toggle-journal').addEventListener('click',()=>{const open=document.body.classList.toggle('journal-open');$('toggle-journal').textContent=open?'Hide journal':'Show journal';$('toggle-journal').setAttribute('aria-expanded',String(open));});
resources();$('go').disabled=true;poll();
