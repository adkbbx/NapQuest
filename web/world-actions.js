import {TASK_KINDS,taskActions} from './agent-tasks.js';
import {findPath,key,WALK_COST} from './open-world-model.js';
import {MAX_LEVEL,BUILDINGS,TROOPS,buildingCount,troopCapacity} from './progression.js';
import {upgradeCost} from './settlement.js';
export const RESERVE=8;
export const PROJECTS=[
 {id:'explore',intent:'Explore and discover woodland places while managing energy and food.'},
 {id:'spend',intent:'Spend all existing coins buying things until no coins remain.'},
 {id:'earn',intent:'Work, make money, earn coins or save up an additional requested income amount.'},
 {id:'upgrade',intent:'Upgrade the main home to a requested higher level.'},
 {id:'rest',intent:'Go home, sleep, nap, relax or recharge energy.'},
 {id:'story',intent:'Complete the quiet-bell story, repair the crossing, craft a muffler and sleep peacefully.'},
 {id:'build',intent:'Construct or build a structure, mine, wall, tower, garden, barracks, cannon, cabin or path.'},
 {id:'recruit',intent:'Train or recruit rabbit guards, hedgehog rangers or an army of defenders.'},
 {id:'gather',intent:'Gather, harvest, mine or collect a requested amount of wood, stone, fiber, berries, honey, seeds or food.'},
 {id:'craft',intent:'Craft a bell muffler or pack a picnic from materials at a workbench.'},
 {id:'shop',intent:'Buy a particular artifact, food, seeds, muffler, picnic, or structure from the coin store.'},
 {id:'manage',intent:'Clear a tree stump or land. Move assets. Plant seeds. Repair walls. Dismantle. Fight raids. Eat. Quit work. Dismiss bees. Use an object.'},
];
export function routeCost(world,start,target){
 const oppositeBanks=(start[1]<5&&target[1]>7)||(start[1]>7&&target[1]<5);
 if(oppositeBanks&&!world.flags.bridge||Math.max(Math.abs(start[0]-target[0]),Math.abs(start[1]-target[1]))>65)return {route:[],cost:Infinity,end:start};
 const route=findPath(world,start,target);
 if(!route.length&&Math.hypot(start[0]-target[0],start[1]-target[1])>1.8)return {route:[],cost:Infinity,end:start};
 return {route,cost:route.length*WALK_COST,end:route.at(-1)||start};
}
export function travelBudget(world,target){
 const trip=routeCost(world,[world.player.x,world.player.y],target),back=routeCost(world,trip.end,[world.location('home')[0],world.location('home')[1]+1]);
 return {...trip,returnCost:back.cost,required:trip.cost+back.cost+RESERVE,safe:world.player.energy>=trip.cost+back.cost+RESERVE};
}
export function explorationPlan(world){
 let best=null;
 for(const [dx,dy] of [[10,0],[0,10],[-10,0],[0,-10],[8,8],[-8,8],[-8,-8],[8,-8]]){
  const target=[Math.round(world.player.x)+dx,Math.round(world.player.y)+dy],budget=travelBudget(world,target);if(!budget.safe||!budget.route.length)continue;
  const newPlaces=new Set(budget.route.map(([x,y])=>key(Math.floor(x/4),Math.floor(y/4))).filter(id=>!world.visited.has(id))).size;
  if(!newPlaces)continue;const score=newPlaces/(budget.cost+1);
  if(!best||score>best.score)best={...budget,target,newPlaces,score};
 }
 return best;
}
export function worldActions(world){
 const HOME=world.location('home'),DOOR=[HOME[0],HOME[1]+1];const actions=[],add=(id,intent,target,kind='interact',action='use')=>actions.push({id,intent,target,kind,action});
 if(world.player.sleeping){add('wake','Get out of bed, refueled, and continue the requested exploration or other unfinished goal.',null,'wake');add('finish','Stay resting and stop because the requested nap or other task is complete.',null,'finish');return actions;}
 if(world.raid?.status==='active'){const enemy=world.raid.enemies.find(e=>e.hp>0);if(enemy)add('defend','Shoo the raiding goose to protect your village and earn raid rewards.',[enemy.x,enemy.y],'defend');if(world.inventory.food||world.inventory.berries)add('eat','Eat carried food to restore energy during the defense.',null,'eat');return actions;}
 const position=[world.player.x,world.player.y],home=routeCost(world,position,DOOR),shop=travelBudget(world,world.location('market')),stock=world.inventory;
 const upgrade=upgradeCost(world.settlement.level),needs=upgrade||{wood:8,stone:4,coins:0};
 if(stock.coins>=2&&world.player.energy>=shop.cost+2)add('buy_lunch',`Spend 2 coins buying 2 food at the market. Funds become ${stock.coins-2} coins. Food provides 50 total energy when eaten.`,world.location('market'));
 if(stock.coins>=1&&world.player.energy>=shop.cost+2)add('buy_berry',`Spend 1 coin buying 1 berry at the market. Funds become ${stock.coins-1} coins. Eat it for 25 energy.`,world.location('market'),'interact','berry');
 if(world.player.energy<85&&(stock.food||stock.berries||stock.picnic))add('eat',`Eat carried food now to restore energy. Current energy ${Math.round(world.player.energy)}/100. Food is already paid for.`,null,'eat');
 if(Number.isFinite(home.cost))add('home',`Walk home and sleep to recharge to 100 energy. Return needs ${Math.ceil(home.cost)} energy; current energy ${Math.round(world.player.energy)}. Does not spend coins or discover new places.`,HOME);
 else add('rest','Rest on the grass because no route home is available from here. Recharge before travelling.',null,'rest');
 const resources=world.objectsNear(world.player.x,world.player.y,14).sort((a,b)=>Math.hypot(a.x-world.player.x,a.y-world.player.y)-Math.hypot(b.x-world.player.x,b.y-world.player.y));
 for(const [id,kinds,intent,limit] of [['wood',['tree','apple'],`Gather wood for the next home upgrade and building. Current wood ${stock.wood}/${needs.wood} needed for home level ${world.settlement.level+1}.`,stock.wood<needs.wood],['stone',['rock'],`Mine stone for the next home upgrade or crossing. Current stone ${stock.stone}/${needs.stone} needed.`,stock.stone<needs.stone],['berries',['bush'],'Gather berries for food or sell them for coins to fund home upgrades; also gain fiber and seeds.',stock.berries<8]]){
  if(!limit)continue;const mine=[...world.changes.entries()].map(([id,t])=>({...t.object,x:Number(id.split(',')[0]),y:Number(id.split(',')[1])})).find(o=>BUILDINGS[o.kind]?.production?.resource===id&&(o.stock||0)>0&&travelBudget(world,[o.x,o.y]).safe);if(mine){add(id,`Collect ${mine.stock} ${id} already produced by your ${BUILDINGS[mine.kind].name}.`,[mine.x,mine.y]);continue;}const o=resources.find(o=>kinds.includes(o.kind)&&travelBudget(world,[o.x,o.y]).safe);if(o)add(id,intent,[o.x,o.y]);
 }
 if(upgrade&&world.canAfford(upgrade)&&Number.isFinite(home.cost))add('upgrade_home',`Upgrade your home from level ${world.settlement.level} to ${world.settlement.level+1}. Uses ${upgrade.wood} wood, ${upgrade.stone} stone, ${upgrade.coins} coins. Permanent progress toward level ${MAX_LEVEL}.`,HOME,'upgrade');
 const gold=[...world.changes.entries()].find(([id,t])=>t.object?.kind==='goldmine'&&t.object.stock>0&&travelBudget(world,id.split(',').map(Number)).safe);
 if(gold)add('earn_coins',`Collect ${gold[1].object.stock} coins from your gold mine to fund upgrades.`,gold[0].split(',').map(Number));
 else if(stock.berries>=2&&Number.isFinite(shop.cost))add('earn_coins','Sell 2 berries for 1 coin at the market to pay for home upgrades or supplies.',world.location('market'),'interact','sell');
 else if(world.flags.job&&travelBudget(world,world.location('office')).safe)add('earn_coins','Do one honey advertisement to earn 1 coin for home upgrades or supplies.',world.location('office'));
 const tower=[...world.changes.values()].some(t=>t.object?.kind==='tower');if(tower&&world.near(...world.location('home'),15))add('raid','Defend the village with your watchtower to earn coins and stone for home upgrades.',null,'raid');
 if(!world.flags.bridge&&world.canAfford({wood:4,stone:2})&&travelBudget(world,[3,4]).safe)add('bridge','Repair the river crossing using 4 wood and 2 stone to reach the beekeeper.',[3,4]);
 if(world.flags.bridge&&!world.flags.quiet&&!stock.honey&&!stock.muffler&&!world.flags.job&&travelBudget(world,world.location('office')).safe)add('honey','Accept the honey job for 2 honey wax, needed to craft the bell muffler.',world.location('office'));
 if(!world.flags.quiet&&!stock.muffler&&world.canAfford({fiber:2,honey:1})&&travelBudget(world,world.location('bench')).safe)add('muffler','Craft a bell muffler using 2 fiber and 1 honey to stop the bell.',world.location('bench'),'craft','muffler');
 if(!world.flags.quiet&&stock.muffler&&travelBudget(world,world.location('bell')).safe)add('bell','Fit the muffler to stop the ringing bell so a peaceful nap is possible.',world.location('bell'));
 const explore=explorationPlan(world);if(explore)add('explore',`Explore ${explore.newPlaces} new woodland areas. Walk costs ${Math.ceil(explore.cost)} energy. Reserve ${Math.ceil(explore.returnCost)+RESERVE} energy for returning home. Discover places rather than ending the adventure.`,explore.target,'explore');
 add('finish',`Stop only when the requested task is complete. Home level ${world.settlement.level}/${MAX_LEVEL}, coins ${stock.coins}, energy ${Math.round(world.player.energy)}. Does not upgrade, spend, or explore.`,null,'finish');
 return actions;
}
export function projectActions(world,project=world.project){
 if(project&&TASK_KINDS.has(project.kind))return taskActions(world,project);
 const HOME=world.location('home'),DOOR=[HOME[0],HOME[1]+1];const all=worldActions(world);if(!project||project.kind==='free'||world.raid?.status==='active')return all;
 const wanted=new Set(),stock=world.inventory,level=world.settlement.level;
 const done=project.kind==='spend'?stock.coins===0:project.kind==='upgrade'?level>=(Math.min(MAX_LEVEL,project.targetLevel||MAX_LEVEL)):['story','rest'].includes(project.kind)&&world.flags.rested&&world.flags.quiet&&(world.player.sleeping&&!!world.player.shelter||!!project.restCompleted);
 if(world.player.sleeping)return all.filter(a=>a.id===(done?'finish':'wake'));
 if(done)return all.filter(a=>a.id==='finish');
 const home=routeCost(world,[world.player.x,world.player.y],DOOR),low=world.player.energy<40;
 if(low||world.player.energy<85&&(stock.food||stock.berries||stock.picnic))wanted.add('eat');
 if(project.kind==='spend'){wanted.add('buy_lunch');wanted.add('buy_berry');}
 if(project.kind==='explore'){
  wanted.add('explore');if(stock.food+stock.berries<1&&world.player.energy<65)wanted.add('berries');
 }
 if(project.kind==='upgrade'){
  const cost=upgradeCost(level);if(stock.wood<cost.wood)wanted.add('wood');if(stock.stone<cost.stone)wanted.add('stone');
  if(stock.coins<cost.coins){wanted.add('earn_coins');wanted.add('raid');if(stock.berries<2)wanted.add('berries');}
  wanted.add('upgrade_home');
 }
 if(['story','rest'].includes(project.kind)){
  if(!world.flags.bridge){if(stock.wood<4)wanted.add('wood');if(stock.stone<2)wanted.add('stone');wanted.add('bridge');}
  else if(!world.flags.quiet){if(!stock.honey&&!stock.muffler)wanted.add('honey');if(stock.fiber<2){wanted.add('wood');wanted.add('berries');}wanted.add('muffler');wanted.add('bell');}
  else wanted.add('home');
 }
 if(low){wanted.add('home');if(!(stock.food||stock.berries||stock.picnic)){wanted.add('buy_lunch');wanted.add('buy_berry');wanted.add('berries');wanted.add('rest');}}
 let options=all.filter(a=>wanted.has(a.id));
 if(!options.length){options=all.filter(a=>['eat','home','rest','explore','berries'].includes(a.id));}
 // Returning home remains available when no safe exploration route remains.
 if(project.kind==='explore'&&!options.some(a=>a.id==='explore')&&Number.isFinite(home.cost)){const action=all.find(a=>a.id==='home');if(action&&!options.some(a=>a.id==='home'))options.push(action);}
 return options;
}
