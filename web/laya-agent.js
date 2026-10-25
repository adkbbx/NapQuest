import {MAX_LEVEL} from './progression.js';
import {PROJECTS,projectActions} from './world-actions.js';
import {BUILDINGS,TROOPS} from './progression.js';
import {GOODS} from './village-services.js';
import {activateProject} from './agent-tasks.js';
export const PROJECT_SCHEMA=4;
export async function askLaya(goal,actions,base=''){
 const response=await fetch(`${base}/api/world/decide`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,context:'',actions:actions.map(({id,intent})=>({id,intent}))}),signal:AbortSignal.timeout(30000)}),answer=await response.json();
 if(!response.ok)throw Object.assign(Error(answer.error||'Local Laya decision unavailable.'),{status:response.status});if(!actions.some(a=>a.id===answer.choice))throw Error('Laya returned an unavailable action.');return answer;
}
export async function interpretGoal(goal,base='',world=null){
 const choose=async (options,question='',request=goal)=>(await askLaya(question?`${request.slice(0,279-question.length)}\n${question}`:request,options.map(([id,intent])=>({id,intent})),base)).choice;
 const groups={maintain:['clear','repair','move','dismantle','plant'],other:['story','raid','interact','goose','eat','quit','dismiss']};
 const extra={clear:'Clear a stump, tree or obstacle to free land.',repair:'Repair damaged walls or structures.',move:'Move or rearrange an existing home or asset.',dismantle:'Dismantle an existing structure for a refund.',plant:'Plant seeds or berry bushes.',raid:'Fight a raid or defeat the Goose Captain.',interact:'Use a named object, steal a picnic, or sleep through a work meeting.',goose:'Return food or bribe the goose to end its chase.',eat:'Eat a snack to restore energy.',quit:'Quit the honey job.',dismiss:'Send the following bee coworkers home.'};
 // Leading request defines the objective; later clauses describe safety or continuation.
 const primaryRequest=goal.split(/[.!?;\n]|\b(?:but|while|then)\b/i)[0].trim()||goal;
 const meaning=await askLaya(primaryRequest,[
  {id:'explore',intent:'Explore new places and discover the woodland.'},
  {id:'spend',intent:'Spend all my coins buying things. Empty my wallet until zero coins remain.'},
  {id:'earn',intent:'Earn additional coins. Make money through jobs or trade.'},
  {id:'upgrade',intent:'Upgrade my main home to a higher level.'},
  {id:'rest',intent:'Go home to sleep, nap or recharge energy.'},
  {id:'build',intent:'Build a quarry, mine, wall, tower, garden, workbench, barracks, cannon or cabin.'},
  {id:'recruit',intent:'Train or recruit guards, rangers or troops.'},
  {id:'gather',intent:'Gather wood, stone, fiber, berries, honey, seeds or food.'},
  {id:'shop',intent:'Buy work gloves, a compass, lunch, berries, seeds, picnic, muffler or a structure.'},
  {id:'craft',intent:'Craft a picnic or muffler using workbench materials.'},
  {id:'maintain',intent:'Clear stumps or land. Repair walls. Move home or assets. Plant seeds. Dismantle structures.'},
  {id:'other',intent:'Complete the bell story. Fight raids. Use objects. End a goose chase. Eat. Quit the honey job. Dismiss bees.'},
 ],base);
 const kind=groups[meaning.choice]?await choose(groups[meaning.choice].map(id=>[id,extra[id]||PROJECTS.find(p=>p.id===id)?.intent])):meaning.choice;
 const project={kind,goal,meaning,schema:PROJECT_SCHEMA};
 const quantity=unit=>{const match=goal.match(new RegExp('(\\d+)\\s*(?:(?:more|additional|new)\\s+)?(?:(?:berry|rabbit|hedgehog|acorn|gold|stone|wooden|woodland|palisade)\\s+)?(?:'+unit+')','i'));if(match)return Math.max(1,Math.min(9999,Number(match[1])));const words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twenty:20};for(const [word,n] of Object.entries(words))if(new RegExp('\\b'+word+'\\s+(?:'+unit+')','i').test(goal))return n;return null;};
 const building=()=>choose(Object.entries(BUILDINGS).map(([id,b])=>[id,`The requested structure is ${b.name}.`]));
 if(project.kind==='upgrade'){const levels=Array.from({length:MAX_LEVEL},(_,i)=>({id:`level_${i+1}`,intent:`The requested home target is level ${i+1}.`}));project.levelChoice=await askLaya(goal,levels,base);project.targetLevel=Number(project.levelChoice.choice.split('_')[1]);}
 if(project.kind==='earn')project.targetCoins=quantity('coins?|gold')||10;
 if(project.kind==='build'){project.building=await building();project.amount=quantity('walls?|towers?|watchtowers?|gardens?|quarries|quarry|mills?|mines?|barracks|cannons?|cabins?|benches|workbenches|paths?|structures?')||1;}
 if(project.kind==='recruit'){project.troop=await choose(Object.entries(TROOPS).map(([id,t])=>[id,`Train ${t.name}.`]));project.amount=quantity('guards?|rangers?|troops?|defenders?|rabbits?|hedgehogs?')||1;}
 if(project.kind==='gather'){project.resource=await choose(['wood','stone','fiber','berries','honey','seeds','food','coins'].map(id=>[id,`Gather or collect ${id}.`]));project.amount=quantity('wood|stones?|fiber|berries|honey|seeds?|food|coins?')||10;if(project.resource==='coins'){project.kind='earn';project.targetCoins=project.amount;}}
 if(project.kind==='craft'){project.item=await choose([['muffler','Craft a bell muffler.'],['picnic','Pack a trail picnic.']]);project.amount=quantity('mufflers?|picnics?')||1;project.resource=project.item;}
 if(project.kind==='shop'){project.item=await choose([...Object.entries(GOODS).map(([id,item])=>[id,`Buy ${item.name}: ${item.description}`]),['structure','Buy a building or structure using coins.']]);if(project.item==='structure'){project.kind='build';project.building=await building();project.payment='coins';project.amount=quantity('walls?|towers?|gardens?|quarries|mills?|mines?|structures?|cabins?')||1;}else{project.amount=quantity('berries|food|meals?|seeds?|mufflers?|picnics?')||GOODS[project.item].amount||1;}}
 if(project.kind==='plant')project.amount=quantity('seeds?|bushes|plants?')||1;
 if(project.kind==='clear'){project.object=await choose([['stump','Clear tree stumps.'],['tree','Clear trees.'],['rock','Clear rocks.'],['bush','Clear brush and berry bushes.'],['sapling','Remove young berry bushes.'],['all','Clear any removable woodland obstacles.']]);project.amount=quantity('stumps?|trees?|rocks?|bushes|tiles?|patches?')||1;}
 if(project.kind==='repair'){const scope=await choose([['all','Repair every damaged structure.'],['specific','Repair one type of structure.']]);project.building=scope==='all'?'all':await building();}
 if(project.kind==='dismantle'){project.building=await building();project.amount=quantity('walls?|towers?|gardens?|quarries|mills?|mines?|structures?|cabins?')||1;}
 if(project.kind==='move'){const sourceRequest=goal.split(/\b(?:near|beside|next to|to|north|south|east|west)\b/i)[0];project.object=await choose([['home','Move my main home.'],['market','Move the village market.'],['bench','Move the village workbench.'],['bell','Move the village bell.'],['office','Move the beekeeper workplace.'],['hive','Move the apiary.'],['picnic','Move the picnic basket.'],['structure','Move another player-built structure.']], 'Which object is being moved?',sourceRequest);if(project.object==='structure')project.object=await building();const coordinates=goal.match(/(-?\d+)\s*,\s*(-?\d+)/);if(coordinates)project.destination=[Number(coordinates[1]),Number(coordinates[2])];else project.anchor=await choose([['home','Move near home.'],['market','Move near the market.'],['player','Move near Mallow.'],['north','Move north of home.'],['south','Move south of home.'],['east','Move east of home.'],['west','Move west of home.']], 'Where should the object end up?',goal.slice(sourceRequest.length)||goal);}
 if(project.kind==='raid'){project.captain=(await choose([['captain','Defeat the Goose Captain final siege.'],['ordinary','Start or win an ordinary village raid.']]))==='captain';project.amount=quantity('raids?|sieges?|battles?')||1;}
 if(project.kind==='goose')project.gooseAction=await choose([['return','Return a snack to end the chase.'],['bribe','Pay a coin to bribe the goose.']]);
 if(project.kind==='interact'){project.object=await choose(['picnic','hive','bell','home','bench','market','office','garden','tower','sapling','stump'].map(id=>[id,`Use the ${id}.`]));if(project.object==='office')project.action=await choose([['use','Accept or perform the honey job.'],['nap','Sleep through the workplace meeting.'],['quit','Quit the job.']]);}
 if(world)activateProject(world,project);
 return project;
}
export async function chooseAction(world,goal,project,base=''){activateProject(world,project);const options=projectActions(world,project),answer=await askLaya(goal,options,base);return {options,answer,chosen:options.find(a=>a.id===answer.choice)};}
