import {Woodland} from './world-runtime.js';
const $=id=>document.getElementById(id);
const world=new Woodland($('world'),{bubble:text=>{$('speech').textContent=text;$('lab-caption').textContent=text;}});
world.speed=4;let running=0;
const event=(key,action,turn,position)=>({key,action,turn,position,quip:'',animation:action==='nap'||action==='sleep'?'nap':'',deltas:{}});
async function play(kind,action){
  const serial=++running;world.reset();world.speed=Number($('lab-speed').textContent[0]);$('lab-pause').textContent='Pause';
  $('lab-status').textContent=`Scripted fixture: ${kind} / ${action}. Running…`;$('lab-progress').textContent='Playing';$('scene-name').textContent=kind==='goose'?"Kevin's sandwich":"The honey-to-employment pipeline";
  const state={id:`fixture-${serial}`,flags:[],items:[],history:[]};
  try{
    if(kind==='goose'){
      await world.enter({key:'orchard',position:[365,465]});
      await world.perform(event('orchard','steal',1,[365,465]),state);
      await world.enter({key:'chase',position:[435,430]});
      await world.perform(event('chase',action,2,[435,430]),state);
      await world.move('mallow',[330,350],115);await world.wait(900);
    }else{
      await world.enter({key:'bees',position:[365,465]});
      state.flags=['bee_contract'];await world.perform(event('bees','honey',1,[365,465]),state);
      await world.enter({key:'bee_review',position:[730,325]});
      await world.perform(event('bee_review',action,2,[730,325]),state);
      if(action==='quit')state.flags=[];if(action==='sleep')state.items=['regional honey manager'];
      world.reconcile(state);await world.move('mallow',[190,375],120);await world.wait(1200);
      await world.finish({...state,ending:{title:'Home. With consequences.'},history:[event('home','nap',3,[190,375])]});
    }
    if(serial===running){$('lab-status').textContent=`Scripted fixture: ${kind} / ${action}. Complete.`;$('lab-progress').textContent='Complete';}
  }catch(error){if(error.name!=='AbortError'){$('lab-status').textContent=`Failed: ${error.message}`;console.error(error);}}
}
document.querySelectorAll('[data-goose]').forEach(b=>b.addEventListener('click',()=>play('goose',b.dataset.goose)));
document.querySelectorAll('[data-bees]').forEach(b=>b.addEventListener('click',()=>play('bees',b.dataset.bees)));
$('lab-pause').addEventListener('click',()=>{world.paused=!world.paused;$('lab-pause').textContent=world.paused?'Resume':'Pause';});
$('lab-speed').addEventListener('click',()=>{world.speed=world.speed===4?8:world.speed===8?1:4;$('lab-speed').textContent=`${world.speed}× speed`;});
const params=new URLSearchParams(location.search);
if(params.has('auto'))play(params.get('auto')==='goose'?'goose':'bees',params.get('action')||(params.get('auto')==='goose'?'return':'sleep'));
