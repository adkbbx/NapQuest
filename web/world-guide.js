import {BUILDINGS,LEVELS,tierFor,buildingCount,costText} from './progression.js';
import {upgradeCost} from './settlement.js';
// One source for the visible action, its consequences, and the next story step.
export function describeInteraction(world,o){
 if(!o)return {title:'Choose something in the world',label:'Select an object',detail:'Click a tree, rock, building, or neighbor. You will see its action before doing anything.',duration:0};
 const spec=BUILDINGS[o.kind];if(spec?.production){const p=spec.production,stock=o.stock||0;return {title:spec.name,label:stock?`Collect ${stock} ${p.resource}`:'Check production',detail:`${stock}/${p.capacity} ${p.resource} stored. Produces ${p.amount} every ${p.seconds} seconds while the village is open. Collect to make room for more.`,duration:stock ? .8 : 0};}
 if(spec&&['wall','gate','barracks','cannon'].includes(o.kind))return {title:spec.name,label:'Inspect '+spec.name.toLowerCase(),detail:o.kind==='barracks'?'Train rabbit guards and hedgehog rangers in the defenders panel. They fight automatically.':o.kind==='cannon'?'Fires a 42-damage acorn blast every 2 seconds, hitting groups within range.':`${Math.ceil(o.hp??spec.hp)}/${spec.hp} durability. ${o.kind==='gate'?'Friendly traffic can pass. Raiders must break the gate.':'Stops raiders until broken. Boars deal triple wall damage.'} Select Repair after damage.`,duration:0};
 const info={
  tree:['Oak tree','Chop tree',`Gain ${2+Math.floor(world.settlement.level/3)+(world.artifacts.gloves?1:0)} wood + 1 fiber. Uses 8 energy. Leaves a stump.`,1.3],
  apple:['Apple tree','Chop apple tree',`Gain ${2+Math.floor(world.settlement.level/3)+(world.artifacts.gloves?1:0)} wood + 1 fiber + 1 food. Uses 8 energy.`,1.3],
  rock:['Mossy rock','Mine stone',`Gain ${2+Math.floor(world.settlement.level/4)+(world.artifacts.gloves?1:0)} stone. Uses 7 energy. Removes this rock.`,1.2],
  bush:['Berry bush','Pick berries','Gain 2 berries + 1 fiber + 1 seed. The bush will regrow.',.8],
  mushroom:['Mushrooms','Gather mushrooms','Gain 1 food. You can eat it to restore energy.',.7],
  home:[o.built?'Guest cabin':tierFor(world.settlement.level).name,'Enter home & sleep',world.flags.quiet?'Go inside and sleep in bed. The bell is silent.':world.settlement.level>=2?'Go inside and recharge in your soundproof bedroom. The bell cannot wake you.':'Go inside and try to sleep. Silence the bell or upgrade home to level 2 to sleep through it.',1],
  bench:['Workbench','Open recipes','Craft a bell muffler with 2 fiber + 1 honey. Materials are used only when you craft.',0],
  market:["Kevin's market",'Buy lunch · 2 coins','2 coins buy 2 food. 1 coin buys 1 berry. Sell 2 berries for 1 coin.',.6],
  office:['Bee Local 404',world.flags.job?'Work · earn 1 coin':'Accept honey job','Get 2 honey when you join. Coworkers escort one shift, then return after work or when you go home.',.9],
  hive:['Apiary','Take honey','Gain 1 honey. Taking it enrolls you in the bee job.',.8],
  picnic:["Kevin's picnic",'Steal picnic','Gain 2 food. The goose will chase you and take a sandwich back.',.6],
  bell:['Village bell',world.flags.quiet?'Inspect quiet bell':world.inventory.muffler?'Fit bell muffler':'Inspect ringing bell',world.flags.quiet?'The wax muffler stops the ringing. Go inside your home for a peaceful nap.':'The bell rings every 8 seconds. A muffler needs 2 fiber + 1 honey at a workbench.',world.inventory.muffler?1.1:0],
  project:['River crossing',world.flags.bridge?'Inspect repaired bridge':'Repair bridge · 4 wood + 2 stone',world.flags.bridge?'You can now walk across the river to the beekeeper.':'Uses 4 wood + 2 stone. Opens a walking route to the beekeeper.',1.6],
  stump:['Tree stump','Clear stump','Gain 1 wood, use 2 energy and free this tile for building. Sit and rest is available as another action.',.9],
  sapling:['Young berry bush','Check growth',`Fruit in ${Math.max(0,12-(world.turn-o.planted))} more woodland actions.`,0],
  garden:['Berry garden','Inspect garden','Grows 2 berries every 8 woodland actions. Eat them or sell for upgrade money.',0],
  tower:['Watchtower','Inspect watchtower','Automatically throws acorns at raiders within six steps.',0],
  wall:['Palisade','Inspect palisade','Blocks walking. Raiding geese need a route around it.',0],
 }[o.kind]||[o.name||o.kind,'Inspect','Walk closer to inspect this object.',0];
 return {title:info[0],label:info[1],detail:info[2],duration:info[3]};
}
export const RESOURCE_USES={wood:'Wood builds defenses, mines and upgrades your home. Lumber mills produce it continuously. Chop trees for more. Higher home levels improve yields.',stone:'Stone builds walls, towers, cannons and home upgrades. Quarries produce it continuously. Mine rocks for more.',fiber:'2 fiber + 1 honey crafts the bell muffler at a workbench. Trees and berry bushes provide fiber.',berries:'Eat a berry for 25 energy, sell 2 for 1 coin, or use 2 berries + 1 food for a picnic. Gardens grow berries.',food:'Eat one food for 25 energy, or spend it training a defender. Lunch costs 2 coins for 2 food.',honey:'Combine 1 honey + 2 fiber at a workbench to silence the bell. Get it at the apiary or honey job.',seeds:'Plant one seed for a berry bush, or build a garden with 2 seeds + 4 wood. Gardens yield berries every 8 actions.',muffler:'Fit this to the village bell to stop ringing and let Mallow sleep peacefully.',picnic:'A packed picnic restores 80 energy. Craft at a workbench using 2 berries + 1 food.',coins:'Train defenders, buy food or pay for home upgrades. Gold mines produce coins. Earn coins by selling berries, working a honey shift, or winning raids.'};
function resource(world,kinds){return world.objectsNear(world.player.x,world.player.y,24).filter(o=>kinds.includes(o.kind)&&(world.flags.bridge||o.y<5)).sort((a,b)=>Math.hypot(a.x-world.player.x,a.y-world.player.y)-Math.hypot(b.x-world.player.x,b.y-world.player.y))[0];}
export function villageObjective(world){
 const level=world.settlement.level,cost=upgradeCost(level),steps=LEVELS.map(t=>[`${t.level} · ${t.name}`,level>=t.level]);
 let label,detail,target;
 if(world.raid?.status==='active'){label='Defend your village';detail='Your troops intercept raiders. Stand close and shoo. Repair damaged walls with wood and stone.';const e=world.raid.enemies.find(e=>e.hp>0);target=e&&[e.x,e.y];}
 else if(world.player.energy<20){label='Recharge at home';detail='Enter your home and sleep before the next building expedition.';target=world.location('home');}
 else if(!cost){
  if(world.settlement.captainDefeated){label='The Acorn keep is yours';detail='Captain defeated. Build out the village, refill your mines and replay sieges when you choose.';target=world.location('home');}
  else if(!buildingCount(world,'barracks')){label='Build a rabbit barracks';detail=`Choose Rabbit barracks in Build your village, then place it on nearby empty ground. Needs ${costText(BUILDINGS.barracks.cost)}.`;}
  else if(world.troops.length<4){label='Train your defenders';detail='Train guards and rangers in the defenders panel. Four is a useful start; your keep houses eight.';}
  else if(!buildingCount(world,'cannon')){label='Build an acorn cannon';detail=`Its blast hits groups. Choose it in the build panel and place it along the approach. Needs ${costText(BUILDINGS.cannon.cost)}.`;}
  else{label='Challenge the Goose Captain';detail='Walls delay the attack. Defenders and towers hold the clearing. Start the final siege when ready.';target=world.location('home');}
 }
 else{
  const missing=Object.entries(cost).find(([k,n])=>world.inventory[k]<n);
  if(!missing){label=`Upgrade home to level ${level+1}`;detail=`You have ${costText(cost)}. Upgrade your home to become ${tierFor(level+1).name}.`;target=world.location('home');}
  else{const [kind,needed]=missing;const mine=[...world.changes.entries()].find(([,t])=>BUILDINGS[t.object?.kind]?.production?.resource===kind&&t.object.stock>0);
   if(mine){label=`Collect ${kind} from your mine`;detail='Select the stocked building and collect its resources. Production stops when storage is full.';target=mine[0].split(',').map(Number);}
   else if(kind==='coins'){label=`Earn upgrade coins · ${world.inventory.coins}/${needed}`;detail='Sell 2 berries for 1 coin at the market, collect your gold mine, or win a raid.';const o=world.inventory.berries>=2?{x:world.location('market')[0],y:world.location('market')[1]}:resource(world,['bush']);target=o&&[o.x,o.y];}
   else{label=`Gather ${kind} · ${world.inventory[kind]}/${needed}`;detail=`${kind==='wood'?'Chop trees, or build a lumber mill at level 2.':'Mine rocks, or build a quarry at level 2.'} Next home unlock: ${tierFor(level+1).promise}`;const o=resource(world,kind==='wood'?['tree','apple']:['rock']);target=o&&[o.x,o.y];}
  }
 }
 return {label,detail,target,steps};
}
export function nextObjective(world){
 let label,detail,target;
 if(!world.flags.bridge&&world.inventory.wood<4){const o=resource(world,['tree','apple']);label=`Collect wood · ${world.inventory.wood}/4`;detail='Select a tree, walk over, then choose Chop tree. Each tree gives 2 wood.';target=o&&[o.x,o.y];}
 else if(!world.flags.bridge&&world.inventory.stone<2){const o=resource(world,['rock']);label=`Collect stone · ${world.inventory.stone}/2`;detail='Select a rock, then Mine stone. One rock gives the 2 stone you need.';target=o&&[o.x,o.y];}
 else if(!world.flags.bridge){label='Repair the river crossing';detail='You have the materials. Go to the broken bridge and choose Repair bridge.';target=[3,4];}
 else if(!world.inventory.honey&&!world.flags.job&&!world.flags.quiet){label='Get honey wax from the beekeeper';detail='Cross the bridge. Accept the honey job at Bee Local 404. It comes with three coworkers.';target=world.location('office');}
 else if(!world.flags.quiet&&!world.inventory.muffler&&world.inventory.fiber<2){const o=resource(world,['bush','tree']);label=`Gather fiber · ${world.inventory.fiber}/2`;detail='Pick berries or chop a tree. Each gives 1 fiber for the muffler.';target=o&&[o.x,o.y];}
 else if(!world.flags.quiet&&!world.inventory.muffler){label='Craft a bell muffler';detail='Go to a workbench. Use 2 fiber + 1 honey to craft the muffler.';target=world.location('bench');}
 else if(!world.flags.quiet){label='Silence the village bell';detail='Go to the bell and choose Fit bell muffler. The ringing will stop.';target=world.location('bell');}
 else if(!world.flags.rested){label='Go inside for a peaceful nap';detail='The hollow tree with the round door is your home. Choose Enter home & sleep.';target=world.location('home');}
 else{label='Your afternoon is yours';detail='The story is finished. Explore, plant berries, build a cabin, or stay in bed.';target=world.location('home');}
 return {label,detail,target,steps:[['Repair the crossing',world.flags.bridge],['Get honey wax',world.flags.job||world.inventory.honey>0||world.flags.quiet],['Craft a muffler',world.inventory.muffler>0||world.flags.quiet],['Silence the bell',world.flags.quiet],['Sleep at home',world.flags.rested]]};
}
