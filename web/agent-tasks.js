import {BUILDINGS,TROOPS,buildingCount,troopCapacity,MAX_LEVEL,costText} from './progression.js';
import {GOODS,STRUCTURE_PRICES} from './village-services.js';
import {upgradeCost} from './settlement.js';
import {findPath,WALK_COST} from './open-world-model.js';

export const TASK_KINDS=new Set(['clear','earn','build','recruit','craft','gather','shop','plant','repair','move','dismantle','raid','eat','quit','dismiss','interact','goose']);
export function activateProject(world,project){
 if(project.started)return project;
 project.started=true;project.initialCoins=world.inventory.coins;project.earnedCoins=0;project.initialWins=world.settlement.wins;
 project.initialAmount=world.inventory[project.kind==='shop'?GOODS[project.item]?.kind:project.resource||project.item]||0;
 project.initialCount=project.kind==='build'?buildingCount(world,project.building):project.kind==='recruit'?world.troops.filter(u=>u.type===project.troop).length:project.kind==='clear'?world.settlement.clearedCount||0:project.kind==='plant'?world.settlement.plantedCount||0:project.kind==='dismantle'?built(world,project.building).length:0;
 return project;
}
function built(world,kind){return [...world.changes].filter(([,t])=>t.object?.built&&(!kind||kind==='all'||t.object.kind===kind)).map(([id,t])=>({...t.object,x:Number(id.split(',')[0]),y:Number(id.split(',')[1])}));}
function damaged(world,kind){return built(world,kind).filter(o=>BUILDINGS[o.kind]?.hp&&(o.hp??BUILDINGS[o.kind].hp)<BUILDINGS[o.kind].hp);}
export function taskProgress(world,p){
 const amount=p.amount||1;
 if(p.kind==='earn')return {value:p.earnedCoins||0,total:p.targetCoins||10,label:'Coins earned'};
 if(p.kind==='build')return {value:buildingCount(world,p.building)-(p.initialCount||0),total:amount,label:`Build ${BUILDINGS[p.building]?.name||p.building}`};
 if(p.kind==='recruit')return {value:world.troops.filter(u=>u.type===p.troop).length-(p.initialCount||0),total:amount,label:`Train ${TROOPS[p.troop]?.name||p.troop}`};
 if(p.kind==='gather'||p.kind==='craft')return {value:Math.max(0,(world.inventory[p.resource||p.item]||0)-(p.initialAmount||0)),total:amount,label:`${p.kind==='craft'?'Craft':'Gather'} ${p.resource||p.item}`};
 if(p.kind==='shop'){const item=GOODS[p.item];return {value:item?.artifact?(world.artifacts[p.item]?1:0):Math.max(0,(world.inventory[item?.kind]||0)-(p.initialAmount||0)),total:item?.artifact?1:amount,label:`Buy ${item?.name||p.item}`};}
 if(p.kind==='clear')return {value:(world.settlement.clearedCount||0)-(p.initialCount||0),total:amount,label:'Clear building ground'};
 if(p.kind==='plant')return {value:(world.settlement.plantedCount||0)-(p.initialCount||0),total:amount,label:'Plant berry bushes'};
 if(p.kind==='dismantle')return {value:(p.initialCount||0)-built(world,p.building).length,total:Math.min(amount,p.initialCount||0),label:`Dismantle ${p.building}`};
 if(p.kind==='repair')return {value:damaged(world,p.building).length===0?1:0,total:1,label:`Repair ${p.building||'damaged structures'}`};
 if(p.kind==='raid')return {value:world.settlement.wins-(p.initialWins||0),total:amount,label:p.captain?'Defeat the Goose Captain':'Win village raids'};
 return {value:p.completed?1:0,total:1,label:({move:'Rearrange the village',eat:'Eat a snack',quit:'Leave the honey job',dismiss:'Send bee coworkers home',interact:`Interact with ${p.object}`,goose:'Settle the goose dispute'})[p.kind]||p.kind};
}
export function taskComplete(world,p){const progress=taskProgress(world,p);return !p.blocked&&progress.value>=progress.total;}
export function taskSummary(world,p){const {value,total,label}=taskProgress(world,p);return `${label} · ${Math.max(0,value)} / ${total}`;}

export function taskActions(world,p){
 const out=[],position=[world.player.x,world.player.y],home=world.location('home'),door=[home[0],home[1]+1];
 const add=(id,intent,target,kind='interact',extra={})=>{if(!out.some(a=>a.id===id))out.push({id,intent,target,kind,action:'use',...extra});};
 const route=target=>findPath(world,position,target);
 const safe=target=>{const trip=route(target),end=trip.at(-1)||position,back=findPath(world,end,door);return (trip.length||world.near(...target))&&(back.length||Math.hypot(end[0]-door[0],end[1]-door[1])<1.8)&&world.player.energy>=(trip.length+back.length)*WALK_COST+8;};
 const nearObjects=(kinds)=>world.objectsNear(...position,28).filter(o=>kinds.includes(o.kind)).sort((a,b)=>Math.hypot(a.x-position[0],a.y-position[1])-Math.hypot(b.x-position[0],b.y-position[1])).slice(0,12).filter(o=>safe([o.x,o.y]));
 const block=text=>[{id:'blocked',kind:'blocked',intent:text,text}];
 if(p.blocked)return block(p.blocked);
 if(taskComplete(world,p))return [{id:'finish',kind:'finish',intent:`The goal is complete. ${taskSummary(world,p)}. Stop now.`}];
 if(world.player.sleeping)return [{id:'wake',kind:'wake',intent:'Wake up and continue the unfinished project.'}];
 if(world.raid?.status==='active'){
  const enemy=world.raid.enemies.find(e=>e.hp>0);if(enemy)add('defend','Approach a raider and whistle to defend the village.',[enemy.x,enemy.y],'defend');
  if(world.player.energy<50&&(world.inventory.food||world.inventory.berries||world.inventory.picnic))add('eat','Eat carried food for energy.',null,'eat');return out;
 }
 function support(){
  if(world.player.energy<70&&(world.inventory.food||world.inventory.picnic||world.inventory.berries))add('eat','Eat carried food to restore energy and continue this goal.',null,'eat');
  if(world.player.energy<40)add('home','Return to bed for a timed nap, then continue the unfinished goal.',home);
 }
 function income(){
  const mine=built(world,'goldmine').find(o=>o.stock>0&&safe([o.x,o.y]));if(mine)add('collect_gold',`Collect ${mine.stock} newly produced coins from the gold mine.`,[mine.x,mine.y]);
  if(world.inventory.berries>=2&&safe(world.location('market')))add('sell_berries','Sell 2 berries for 1 earned coin.',world.location('market'),'interact',{action:'sell'});
  if(world.flags.job&&safe(world.location('office')))add('work_coins',`Complete a honey shift for 1 earned coin. ${p.earnedCoins||0} earned so far.`,world.location('office'));
  if(!world.flags.job&&safe(world.location('office')))add('join_job','Accept the honey job, then work shifts to earn coins. Joining gives honey, not coins.',world.location('office'));
  if(!world.flags.job&&world.inventory.berries<2){const bush=nearObjects(['bush'])[0];if(bush)add('forage_to_sell','Gather berries to sell at the market for coins.',[bush.x,bush.y]);}
  if(!world.flags.bridge&&!world.flags.job){const cost={wood:4,stone:2};if(world.canAfford(cost)&&safe(world.location('project')))add('repair_bridge','Repair the crossing to reach the paid honey job.',world.location('project'));else for(const [r,n] of Object.entries(cost))if(world.inventory[r]<n)gather(r,n);}
 }
 function gather(resource,needed){
  if(world.inventory[resource]>=needed)return;
  if(resource==='coins'){income();return;}
  const producer=built(world).find(o=>BUILDINGS[o.kind]?.production?.resource===resource&&o.stock>0&&safe([o.x,o.y]));if(producer){add(`collect_${resource}`,`Collect ${producer.stock} ${resource} from your production building.`,[producer.x,producer.y]);return;}
  const kinds=({wood:['tree','apple'],stone:['rock'],fiber:['bush','tree'],berries:['bush'],seeds:['bush'],food:['mushroom','apple'],honey:['hive','office']})[resource]||[];
  const o=nearObjects(kinds)[0];if(o)add(`gather_${resource}`,`Gather ${resource}. Have ${world.inventory[resource]||0}; need ${needed}.`,[o.x,o.y]);
  if(resource==='food'&&world.inventory.coins>=2)add('buy_food','Buy 2 food for 2 coins from the store.',null,'buy',{item:'lunch'});
 }
 function materials(cost){let missing=false;for(const [r,n] of Object.entries(cost))if((world.inventory[r]||0)<n){missing=true;gather(r,n);}return !missing;}
 function upgrade(level){
  if(world.settlement.level>=level)return true;
  const cost=upgradeCost(world.settlement.level);if(materials(cost))add('upgrade_home',`Upgrade home to level ${world.settlement.level+1}, toward the required level ${level}.`,home,'upgrade');return false;
 }
 function siteActions(kind,payment='materials'){
  const sites=[];
  for(let r=2;r<=5&&sites.length<3;r++)for(let dy=-r;dy<=r&&sites.length<3;dy++)for(let dx=-r;dx<=r&&sites.length<3;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const tile=[home[0]+dx,home[1]+dy];if(world.tile(...tile).object||['water','bridge'].includes(world.tile(...tile).terrain))continue;
   const approach=[[tile[0],tile[1]+1],[tile[0]+1,tile[1]],[tile[0]-1,tile[1]]].find(a=>world.walkable(...a)&&safe(a));if(!approach)continue;
   const planningWorld=Object.create(world);planningWorld.player={...world.player,x:approach[0],y:approach[1]};if(!planningWorld.placementPermission(kind,...tile,{payment}).ok)continue;
   sites.push({tile,approach});
  }
  if(!sites.length){const obstacle=nearObjects(['stump','sapling','bush','tree','rock']).find(o=>Math.hypot(o.x-home[0],o.y-home[1])<6);if(obstacle)add('clear_build_site','Clear an obstacle to make room for the requested structure.',[obstacle.x,obstacle.y],'clear');}
  sites.forEach(({tile,approach},i)=>add(`build_${kind}_${i+1}`,`Place ${BUILDINGS[kind].name} at ${tile.join(', ')}. Pay ${payment==='coins'?`${STRUCTURE_PRICES[kind]} coins`:costText(BUILDINGS[kind].cost)}.`,approach,'build',{building:kind,tile,payment}));
 }
 function build(kind,payment='materials'){
  const spec=BUILDINGS[kind];if(!spec){p.blocked='That structure is not in the building catalog.';return;}
  if(!upgrade(spec.level))return;
  if(buildingCount(world,kind)>=spec.limit){p.blocked=`The village limit is ${spec.limit} ${spec.name}. Move or dismantle one before adding another.`;return;}
  if(materials(payment==='coins'?{coins:STRUCTURE_PRICES[kind]}:spec.cost))siteActions(kind,payment);
 }
 support();
 if(p.kind==='earn')income();
 else if(p.kind==='gather')gather(p.resource,(p.initialAmount||0)+(p.amount||1));
 else if(p.kind==='build')build(p.building,p.payment||'materials');
 else if(p.kind==='recruit'){
  const spec=TROOPS[p.troop],desired=(p.initialCount||0)+(p.amount||1),other=world.troops.filter(u=>u.type!==p.troop).length,level=[3,4,5].find(l=>l>=spec.level&&troopCapacity(l)>=desired+other);
  if(!level)return block('That army exceeds the level 5 capacity of eight defenders.');
  if(upgrade(level)){if(!buildingCount(world,'barracks'))build('barracks');else if(materials(spec.cost))add('train_troop',`Train one ${spec.name}. Pay ${costText(spec.cost)}.`,null,'train',{troop:p.troop});}
 }
 else if(p.kind==='craft'){
  const cost=p.item==='muffler'?{fiber:2,honey:1}:{berries:2,food:1};if(materials(cost)){const bench=nearObjects(['bench'])[0];if(bench)add('craft_item',`Craft one ${p.item}. Pay ${costText(cost)}.`,[bench.x,bench.y],'craft',{item:p.item});else build('bench');}
 }
 else if(p.kind==='shop'){const item=GOODS[p.item];if(!item)return block('This item is not stocked in the store.');if(materials({coins:item.price}))add('buy_item',`Buy ${item.name} for ${item.price} coins.`,null,'buy',{item:p.item});}
 else if(p.kind==='clear'){const kinds=p.object==='all'?['stump','tree','apple','rock','bush','sapling','mushroom']:[p.object||'stump'];const o=nearObjects(kinds)[0];if(o)add('clear_land','Clear this obstacle and free its tile for construction.',[o.x,o.y],'clear');else return block('No matching obstacle is safely reachable nearby. Move closer to the patch you want cleared.');}
 else if(p.kind==='plant'){
  if(materials({seeds:1})){
   for(let dx=-2;dx<=2;dx++){const tile=[Math.round(position[0])+dx,Math.round(position[1])+1];if(!world.tile(...tile).object&&world.tile(...tile).terrain==='grass'&&world.near(...tile,2.5)){add('plant_seed','Plant one berry seed on nearby empty grass.',null,'plant',{tile});break;}}
  }
 }
 else if(p.kind==='repair'){
  const o=damaged(world,p.building).filter(o=>safe([o.x,o.y]))[0];if(o&&materials({wood:1,stone:1}))add('repair_structure',`Repair damaged ${BUILDINGS[o.kind].name} for 1 wood and 1 stone.`,[o.x,o.y],'repair');
 }
 else if(p.kind==='dismantle'){
  const o=built(world,p.building).find(o=>safe([o.x,o.y]));if(o)add('dismantle_structure',`Dismantle ${BUILDINGS[o.kind].name}. Half its paid cost returns.`,[o.x,o.y],'dismantle');
 }
 else if(p.kind==='move'){
  const source=p.object==='home'?world.location('home'):world.location(p.object)||built(world,p.object).map(o=>[o.x,o.y])[0];if(!source)return block('There is no matching asset to move.');
  const anchor=p.anchor==='market'?world.location('market'):p.anchor==='player'?position:home,offset=({north:[0,-4],south:[0,4],east:[4,0],west:[-4,0]})[p.anchor]||[3,0],center=p.destination||[anchor[0]+offset[0],anchor[1]+offset[1]];
  let count=0;for(let r=0;r<=3&&count<3;r++)for(let dy=-r;dy<=r&&count<3;dy++)for(let dx=-r;dx<=r&&count<3;dx++){const to=[Math.round(center[0]+dx),Math.round(center[1]+dy)];if(p.destination&&(dx||dy))continue;if(world.placementPermission(world.tile(...source).object?.kind,...to,{moving:source}).ok)add(`move_asset_${++count}`,`Move ${p.object} from ${source.join(', ')} to ${to.join(', ')} without spending resources.`,null,'move',{from:[...source],to});}
 }
 else if(p.kind==='raid'){
  if(!p.captain||upgrade(MAX_LEVEL)){
   if(p.captain&&!buildingCount(world,'barracks'))build('barracks');
   else if(p.captain&&world.troops.length<4){if(materials(TROOPS.guard.cost))add('train_guard','Train another guard before challenging the Captain.',null,'train',{troop:'guard'});}
   else if(p.captain&&buildingCount(world,'tower')<2)build('tower');
   else if(p.captain&&!buildingCount(world,'cannon'))build('cannon');
   else add('start_raid',p.captain?'Challenge the Goose Captain with your prepared defenses.':'Start a village raid and defend it.',home,'raid');
  }
 }
 else if(p.kind==='eat'){if(world.inventory.food||world.inventory.berries||world.inventory.picnic)add('eat_snack','Eat one carried snack.',null,'eat',{completes:true});else gather('food',1);}
 else if(p.kind==='quit'){if(!world.flags.job)p.completed=true;else add('quit_job','Quit the honey job and end its escort.',world.location('office'),'interact',{action:'quit',completes:true});}
 else if(p.kind==='dismiss')add('dismiss_bees','Send the bee coworkers back to the apiary.',null,'dismiss',{completes:true});
 else if(p.kind==='goose'){
  if(!world.flags.goose)p.completed=true;else if(p.gooseAction==='bribe'){if(materials({coins:1}))add('bribe_goose','Pay 1 coin to end the goose chase.',null,'goose',{mode:'bribe',completes:true});}
  else if(world.inventory.food)add('return_snack','Return one food to end the goose chase.',null,'goose',{mode:'return',completes:true});else gather('food',1);
 }
 else if(p.kind==='interact'){
  const point=world.location(p.object),o=point?{x:point[0],y:point[1]}:nearObjects([p.object])[0];if(o)add('use_object',`Use ${p.object}${p.action&&p.action!=='use'?` with action ${p.action}`:''}.`,[o.x,o.y],'interact',{action:p.action||'use',completes:true});
 }
 if(p.blocked)return block(p.blocked);
 if(taskComplete(world,p))return [{id:'finish',kind:'finish',intent:'The requested goal is complete. Stop now.'}];
 if(!out.length){if(world.player.energy<75)add('home','No safe work route remains. Return home, recharge and try again.',home);else return block('No valid action is available for this goal here. Free building space, move closer, or adjust the requested target.');}
 return out.slice(0,12).map(a=>({...a,intent:`${taskSummary(world,p)}. ${a.intent}`}));
}

export function applyTaskAction(world,a){
 let r;
 switch(a.kind){
  case 'clear':r=world.clearLand(...a.target);break;
  case 'build':r=world.build(a.building,...a.tile,{payment:a.payment});break;
  case 'train':r=world.trainTroop(a.troop);break;
  case 'buy':r=world.buyGood(a.item);break;
  case 'craft':r=world.craft(a.item||a.action);break;
  case 'plant':r=world.plant(...a.tile);break;
  case 'repair':r=world.repair(...a.target);break;
  case 'dismantle':r=world.dismantle(...a.target);break;
  case 'move':r=world.moveObject(a.from,a.to);break;
  case 'eat':r=world.eat();break;
  case 'dismiss':world.flags.escort=false;r={ok:true,text:world.note('Bee coworkers sent back to the apiary.')};break;
  case 'goose':if(a.mode==='bribe'&&world.inventory.coins){world.inventory.coins--;world.flags.goose=false;r={ok:true,text:'The goose accepts one coin and ends the chase.'};}else if(a.mode==='return'&&world.inventory.food){world.inventory.food--;world.flags.goose=false;r={ok:true,text:'One sandwich returned. The goose heads home.'};}else r={ok:false,text:'The goose payment is missing.'};break;
  case 'interact':r=world.interact(...a.target,a.action);break;
  case 'upgrade':r=world.upgradeHome();break;
  case 'raid':r=world.startRaid();break;
  case 'wake':r=world.wake();break;
  case 'defend':r=world.whistle();break;
  default:r={ok:false,text:'This action is not available.'};
 }
 if(r?.ok&&world.project&&(a.completes||a.kind==='move'))world.project.completed=true;
 return r;
}
