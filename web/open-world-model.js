import {upgradeHome,startRaid,whistle,tickRaid,tickVillage,trainTroop} from './settlement.js';
import {MAX_LEVEL,BUILDINGS,buildPermission,costText} from './progression.js';
import {DEFAULT_LOCATIONS,STRUCTURE_PRICES,buyGood,moveObject,placementPermission,tickRest} from './village-services.js';
export const CHUNK=16,TILE=64,VERSION=4;
export const WALK_COST=.55;
export const key=(x,y)=>`${x},${y}`;
export function hash(seed,x,y,salt=0){let n=(seed^Math.imul(x,374761393)^Math.imul(y,668265263)^salt)>>>0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
const landmarks=new Map([
 ['-2,-1',{kind:'home',name:"Mallow's hollow"}],['0,-2',{kind:'bench',name:'Village workbench'}],['4,-2',{kind:'market',name:"Kevin's market"}],['6,1',{kind:'picnic',name:"Kevin's unattended picnic"}],['3,4',{kind:'project',name:'Broken crossing'}],['10,11',{kind:'office',name:'Bee Local 404'}],['13,12',{kind:'hive',name:'The old apiary'}],['-1,1',{kind:'bell',name:'The very loud village bell'}],
 ['-4,1',{kind:'tree'}],['-5,2',{kind:'tree'}],['-4,3',{kind:'rock'}],['-2,3',{kind:'bush'}],['1,2',{kind:'mushroom'}],['8,10',{kind:'bush'}],['9,13',{kind:'bush'}],
]);
export const recipes={muffler:{fiber:2,honey:1},picnic:{berries:2,food:1}};
export const buildings=Object.fromEntries(Object.entries(BUILDINGS).map(([k,b])=>[k,b.cost]));
const villagePaths=new Set(['-2,0','-1,0','0,0','0,-1','0,1','1,1','1,2','2,2','3,2','3,3','3,4','4,-1','4,0','4,1','3,1']);
export function baseTile(seed,x,y){
 const inVillage=x>-7&&x<9&&y>-5&&y<5,river=y>=5&&y<=7;
 // Keep the one-tile bridge exit connected to the beekeeper path for every seed.
 const path=villagePaths.has(key(x,y))||(y===8&&x>=3&&x<=9)||(!river&&x===9&&y>7&&y<15);
 const terrain=river?'water':path?'path':hash(seed,x,y,77)>.97&&!inVillage?'sand':'grass';
 let object=landmarks.get(key(x,y))||null;
 if(!object&&!river&&!path&&!inVillage){const r=hash(seed,x,y,19);object=r<.13?{kind:'tree'}:r<.19?{kind:'apple'}:r<.225?{kind:'rock'}:r<.255?{kind:'bush'}:r<.28?{kind:'mushroom'}:null;}
 return {x,y,terrain,object:object?{...object,id:key(x,y)}:null};
}
const solidKinds=new Set(['tree','apple','rock','home','market','office','bench','hive',...Object.keys(BUILDINGS).filter(k=>BUILDINGS[k].solid)]);
export class OpenWorld {
 constructor(seed=41,saved=null){
  this.locations=structuredClone(DEFAULT_LOCATIONS);this.artifacts={};this.seed=seed;this.chunks=new Map();this.changes=new Map();this.inventory={wood:0,stone:0,fiber:0,berries:0,food:1,honey:0,seeds:1,muffler:0,picnic:0,coins:3};
  this.player={x:0,y:1.7,energy:100,sleeping:false,shelter:null};this.flags={bridge:false,job:false,escort:false,manager:false,quiet:false,goose:false,rested:false};this.turn=0;this.log=[];this.visited=new Set(['0,0']);this.travelled=0;
  this.settlement={level:1,wins:0,gardenTurn:0,plantedCount:0,clearedCount:0,nextTroopId:1,captainDefeated:false};this.troops=[];this.raid=null;this.ambition='Quiet the village bell, go inside my home, and enjoy a peaceful nap with as little work as possible.';this.autorun=false;this.project=null;
  if(saved&&[1,2,3,VERSION].includes(saved.version)&&saved.seed===seed){this.locations={...this.locations,...saved.locations};this.artifacts={...saved.artifacts};this.changes=new Map(saved.changes);this.inventory={...this.inventory,...saved.inventory};this.player={...this.player,...saved.player};this.flags={...this.flags,...saved.flags};this.turn=saved.turn||0;this.log=(saved.log||[]).slice(-30);this.visited=new Set(saved.visited||['0,0']);this.travelled=saved.travelled||0;}
  if(saved&&[1,2,3,VERSION].includes(saved.version)){this.settlement={...this.settlement,...saved.settlement};this.raid=saved.raid||null;this.ambition=saved.ambition||this.ambition;this.autorun=!!saved.autorun;this.project=saved.project?{...saved.project}:null;this.troops=(saved.troops||[]).map(u=>({...u}));if(this.settlement.level>MAX_LEVEL){this.settlement.legacyHighestLevel=this.settlement.level;this.settlement.level=MAX_LEVEL;}if(this.project?.kind==='upgrade')this.project.targetLevel=Math.min(MAX_LEVEL,this.project.targetLevel||MAX_LEVEL);}
 }
 location(kind){return this.locations[kind];}
 isHome(x,y){const h=this.location('home');return x===h[0]&&y===h[1];}
 buyGood(id){return buyGood(this,id);}
 moveObject(from,to){return moveObject(this,from,to);}
 placementPermission(kind,x,y,options){return placementPermission(this,kind,x,y,options);}
 tickRest(dt,seconds=7){return tickRest(this,dt,seconds);}
 chunk(cx,cy){const id=key(cx,cy);if(!this.chunks.has(id)){const tiles=[];for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++)tiles.push(baseTile(this.seed,cx*CHUNK+x,cy*CHUNK+y));this.chunks.set(id,tiles);}return this.chunks.get(id);}
 tile(x,y){x=Math.round(x);y=Math.round(y);const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK);const t=this.chunk(cx,cy)[(y-cy*CHUNK)*CHUNK+x-cx*CHUNK];const change=this.changes.get(key(x,y));
  let result=change?{...t,...change}:t;
  if(this.flags.bridge&&x===3&&y>=5&&y<=7)result={...result,terrain:'bridge'};
  if(result.object?.kind==='sapling'&&this.turn-result.object.planted>=12)result={...result,object:{...result.object,kind:'bush'}};
  return result;
 }
 walkable(x,y){const t=this.tile(x,y);return t.terrain!=='water'&&!solidKinds.has(t.object?.kind);}
 near(x,y,range=1.8){return Math.hypot(this.player.x-x,this.player.y-y)<=range;}
 canAfford(cost){return Object.entries(cost).every(([r,n])=>this.inventory[r]>=n);}
 earnCoins(amount){this.inventory.coins+=amount;if(this.project?.kind==='earn')this.project.earnedCoins=(this.project.earnedCoins||0)+amount;}
 clearLand(x,y){if(!this.near(x,y,2.5))return {ok:false,text:'Walk closer to clear this patch.'};const o=this.tile(x,y).object;if(!o||!['stump','sapling','bush','mushroom','tree','apple','rock'].includes(o.kind))return {ok:false,text:'Choose a stump, tree, rock or patch of brush to clear.'};let harvested=null;if(['tree','apple','rock','bush','mushroom'].includes(o.kind))harvested=this.interact(x,y);if(harvested&&!harvested.ok)return harvested;this.change(x,y,null);if(['stump','tree','apple'].includes(o.kind))this.inventory.wood++;this.player.energy=Math.max(0,this.player.energy-2);this.settlement.clearedCount=(this.settlement.clearedCount||0)+1;this.turn++;return {ok:true,text:this.note('Land cleared. You can place a structure here.'),pose:'work',sound:'chop'};}
 pay(cost){for(const [r,n] of Object.entries(cost))this.inventory[r]-=n;}
 note(text){if(this.turn-this.settlement.gardenTurn>=8){const gardens=[...this.changes.values()].filter(t=>t.object?.kind==='garden').length;if(gardens){this.inventory.berries+=gardens*2;text+=` Gardens produced ${gardens*2} berries.`;}this.settlement.gardenTurn=this.turn;}this.log.push(text);if(this.log.length>30)this.log.shift();return text;}
 change(x,y,object,terrain){const old=this.changes.get(key(x,y))||{};this.changes.set(key(x,y),{...old,object,...(terrain?{terrain}:{})});}
 stage(){return this.flags.quiet?4:!this.flags.bridge?0:!this.inventory.honey&&!this.flags.job?1:!this.inventory.muffler?2:3;}
 quest(){return [
  {title:'Mallow just wants a quiet nap',text:'The village bell rings every eight seconds and wakes Mallow. A wax muffler will stop it. First, repair the river crossing to reach the beekeeper who has the wax.',target:[3,4],hint:'Collect 4 wood from trees and 2 stone from a rock. Then repair the crossing.'},
  {title:'Free honey. Suspicious terms.',text:'The beekeeper has wax to silence the bell. Cross the repaired bridge and visit Bee Local 404.',target:this.location('office'),hint:'Talk to the beekeeper beyond the bridge.'},
  {title:'A muffler for an overachieving bell',text:'Honey wax and two bundles of fiber make a bell muffler. The village workbench accepts very small ambitions.',target:this.location('bench'),hint:'Collect 2 fiber and craft a bell muffler at a workbench.'},
  {title:'Make a little peace',text:'Return to the village bell with the muffler. The entire woodland is trying to look busy until you finish.',target:this.location('bell'),hint:'Fit the muffler to the village bell.'},
  {title:this.flags.rested?'At last, a proper nap':'The bell is quiet. Time to go inside.',text:this.flags.rested?'Mallow finally slept without being woken. The story is complete. Wake up to keep exploring, building, and growing your woodland.':'The muffler has stopped the ringing. Go to Mallow\'s hollow and enter the house for the peaceful nap you earned.',target:this.location('home'),hint:this.flags.rested?'Your woodland stays open. Wake up whenever you want.':'Walk to the front door, then choose Enter home & sleep.'},
 ][this.stage()];}
 interact(x,y,action='use'){
  if(!this.near(x,y))return {ok:false,text:'A little closer. Even sloths have arm limits.'};
  const t=this.tile(x,y),o=t.object;if(!o)return {ok:false,text:'A perfectly ordinary patch of outdoors.'};
  const production=BUILDINGS[o.kind]?.production;if(production){const stock=o.stock||0;if(!stock)return {ok:false,text:`${BUILDINGS[o.kind].name} is working. Produces ${production.amount} ${production.resource} every ${production.seconds} seconds while the village is open.`};if(production.resource==='coins')this.earnCoins(stock);else this.inventory[production.resource]+=stock;this.change(x,y,{...o,stock:0});this.turn++;return {ok:true,text:this.note(`Collected ${stock} ${production.resource} from ${BUILDINGS[o.kind].name}.`),pose:'work',sound:'collect'};}
  let text='',pose='wave';const inv=this.inventory;
  switch(o.kind){
   case 'tree':case 'apple':{const n=2+Math.floor(this.settlement.level/3)+(this.artifacts.gloves?1:0);inv.wood+=n;inv.fiber++;if(o.kind==='apple')inv.food++;this.change(x,y,{kind:'stump',id:key(x,y)});this.player.energy=Math.max(0,this.player.energy-8);text=`${n} wood gathered. Higher home levels improve your tools.`;pose='work';break;}
   case 'rock':{const n=2+Math.floor(this.settlement.level/4)+(this.artifacts.gloves?1:0);inv.stone+=n;this.change(x,y,null);this.player.energy=Math.max(0,this.player.energy-7);text=`${n} stone mined. Higher home levels improve your tools.`;pose='work';break;}
   case 'bush':inv.berries+=2;inv.fiber++;inv.seeds++;this.change(x,y,{kind:'sapling',id:key(x,y),planted:this.turn});text='Berries, fiber, and a seed. A surprisingly productive shrub.';break;
   case 'mushroom':inv.food++;this.change(x,y,null);text='One woodland snack. The choir asked us to stop calling it forage.';break;
   case 'project':if(this.flags.bridge){text='A bridge. Much less swimming.';break;}if(!this.canAfford({wood:4,stone:2}))return {ok:false,text:'The crossing needs 4 wood and 2 stone. The goose has contributed opinions.'};this.pay({wood:4,stone:2});this.flags.bridge=true;text='The crossing is repaired. The bees have noticed a potential employee.';pose='work';break;
   case 'office':
    if(action==='quit'&&this.flags.job){this.flags.job=false;this.flags.escort=false;text='Job ended. Your bee coworkers return to the apiary.';break;}
    if(action==='nap'&&this.flags.job){this.flags.manager=true;this.flags.escort=false;this.player.energy=100;text='You sleep through 94 slides. Promoted. The bees return to their desks.';pose='nap';break;}
    if(!this.flags.job){this.flags.job=true;this.flags.escort=true;inv.honey+=2;text='Honey job accepted: +2 honey. Three coworkers join this shift. Work once or go home to end the escort.';break;}
    this.earnCoins(1);this.flags.escort=false;text='Honey advertisement done: +1 coin. Shift over. Your coworkers head back to the apiary.';pose='work';break;
   case 'hive':inv.honey++;this.flags.job=true;this.flags.escort=true;text='Honey collected: +1 honey. Coworkers join your first shift; going home ends the escort.';break;
   case 'market':
    if(action==='berry'){if(inv.coins<1)return {ok:false,text:'One berry costs 1 coin.'};inv.coins--;inv.berries++;text='Berry bought: -1 coin, +1 berry. Eat it for 25 energy.';}
    else if(action==='sell'){if(inv.berries<2)return {ok:false,text:'Kevin buys two berries for one coin.'};inv.berries-=2;this.earnCoins(1);text='Two berries sold. Kevin calls this a vertically integrated lunch.';}
    else{if(inv.coins<2)return {ok:false,text:'Lunch costs 2 coins. Kevin accepts berries at the other counter.'};inv.coins-=2;inv.food+=2;text='Lunch purchased. Kevin considers this a thrilling plot twist.';}break;
   case 'picnic':inv.food+=2;this.flags.goose=true;text='Kevin has noticed his missing sandwich. Customer service has wings.';pose='sneak';break;
   case 'bell':if(inv.muffler&&!this.flags.quiet){inv.muffler--;this.flags.quiet=true;this.flags.rested=false;inv.seeds+=3;text='The bell falls quiet. Every animal pretends the celebration was their idea. Your afternoon finally belongs to you.';}else text=this.flags.quiet?'A historic amount of silence.':'The bell needs a wax-and-fiber muffler. Ask the beekeeper.';break;
   case 'home':this.flags.escort=false;this.player.shelter=[x,y];this.player.sleeping=true;this.player.restElapsed=0;pose='nap';text='Mallow goes inside and curls up in bed. Any bee coworkers head back to the apiary.';break;
   case 'bench':return {ok:true,text:'Workbench ready. Choose a recipe in the Store.',menu:'craft',pose:'idle'};
   case 'stump':if(action!=='sit')return this.clearLand(x,y);text='The tree has been promoted to a seat.';pose='nap';this.player.energy=Math.min(100,this.player.energy+20);break;
   case 'sapling':text=`A young berry bush. ${Math.max(0,12-(this.turn-o.planted))} more woodland actions until fruit.`;break;
   case 'garden':text='This garden grows 2 berries every eight woodland actions. Berries can be eaten or sold for upgrade money.';break;
   case 'tower':text='Watchtower ready. It automatically throws acorns at raiders within six steps.';break;
   case 'wall':case 'gate':text=`${o.kind==='gate'?'Village gate':'Palisade'}: ${Math.ceil(o.hp??BUILDINGS[o.kind].hp)} durability. Raiders attack blocked walls. Repair damage before the next siege.`;break;
   case 'barracks':text='Your defenders train here. Choose a troop in the army panel; they intercept raiders automatically.';break;
   case 'cannon':text='Acorn cannon: 42 splash damage. Groups of raiders are its favorite problem.';break;
  }
  this.turn++;return {ok:true,text:this.note(text),pose,rest:o.kind==='home'};
 }
 craft(name){const cost=recipes[name];if(!cost||!this.canAfford(cost))return {ok:false,text:name==='muffler'?'The muffler needs 2 fiber and 1 honey.':'A picnic needs 2 berries and 1 food.'};
  const nearBench=this.objectsNear(this.player.x,this.player.y,2).some(o=>o.kind==='bench');if(!nearBench)return {ok:false,text:'Use a nearby workbench. Improvisation has already injured the picnic.'};
  this.pay(cost);this.inventory[name]++;this.turn++;return {ok:true,text:this.note(name==='muffler'?'Bell muffler crafted. Finally, a quiet technology.':'A picnic packed. The future is edible.'),pose:'work'};
 }
 build(kind,x,y,{payment='materials'}={}){const placement=placementPermission(this,kind,x,y,{payment});if(!placement.ok)return placement;const cost=payment==='coins'?{coins:STRUCTURE_PRICES[kind]}:buildings[kind];
  this.pay(cost);this.change(x,y,kind==='path'?null:{kind,id:key(x,y),built:true,paid:{...cost},hp:BUILDINGS[kind].hp,maxHp:BUILDINGS[kind].hp,stock:0,productionClock:0},kind==='path'?'path':undefined);this.turn++;return {ok:true,text:this.note(kind==='path'?'One less muddy footstep.':`A ${BUILDINGS[kind].name.toLowerCase()} built. This clearing has plans.`),pose:'work'};
 }
 plant(x,y){const t=this.tile(x,y);if(!this.near(x,y,2.5)||t.object||t.terrain!=='grass'||this.inventory.seeds<1)return {ok:false,text:'A seed needs an empty patch of grass nearby.'};this.inventory.seeds--;this.settlement.plantedCount=(this.settlement.plantedCount||0)+1;this.change(x,y,{kind:'sapling',id:key(x,y),planted:this.turn});this.turn++;return {ok:true,text:this.note('A berry seed planted. The slowest possible grocery order.'),pose:'work'};}
 eat(){const r=this.inventory.picnic?'picnic':this.inventory.food?'food':this.inventory.berries?'berries':null;if(!r)return {ok:false,text:'An empty bag. A snack would improve the situation.'};this.inventory[r]--;this.player.energy=Math.min(100,this.player.energy+(r==='picnic'?80:25));this.turn++;return {ok:true,text:this.note('A small snack. A large improvement.'),pose:'idle',sound:'eat'};}
 nap(){this.player.sleeping=true;this.player.restElapsed=0;this.player.shelter=null;this.turn++;return {ok:true,text:this.note('Mallow curls up on the grass. A bed would be nicer.'),pose:'nap',rest:true};}
 canSleepQuietly(){return this.flags.quiet||!!this.player.shelter&&this.settlement.level>=2;}
 finishRest(){if(!this.player.sleeping)return null;
  if(!this.canSleepQuietly()){this.player.sleeping=false;this.player.shelter=null;this.player.energy=Math.min(100,this.player.energy+10);return {ok:true,text:this.note('DING! The village bell wakes Mallow. Find honey wax, or upgrade home to level 2 for a soundproof bedroom.'),pose:'look'};}
  this.player.energy=100;if(this.player.shelter&&!this.flags.rested){this.flags.rested=this.flags.quiet;return {ok:true,text:this.note(this.flags.quiet?'Finally, a proper nap. The bell is silent, the bag is down, and the afternoon is yours.':'Finally, a proper nap. Your soundproof bedroom keeps the bell outside. Energy restored.'),pose:'nap'};}return null;
 }
 wake(){this.player.sleeping=false;this.player.shelter=null;return {ok:true,text:'Mallow steps outside. Choose an object to see what you can do.',pose:'idle'};}
 objectsNear(x,y,r=12){const out=[];for(let ty=Math.floor(y-r);ty<=Math.ceil(y+r);ty++)for(let tx=Math.floor(x-r);tx<=Math.ceil(x+r);tx++){const t=this.tile(tx,ty);if(t.object)out.push({...t.object,x:tx,y:ty});}return out;}
 recordTravel(distance){this.travelled+=distance;this.visited.add(key(Math.floor(this.player.x/4),Math.floor(this.player.y/4)));}
 trainTroop(type){return trainTroop(this,type);}
 tickVillage(dt){return tickVillage(this,dt);}
 repair(x,y){const o=this.tile(x,y).object,b=BUILDINGS[o?.kind];if(!b?.hp||!o.built||!this.near(x,y,2.5))return {ok:false,text:'Select a nearby player-built structure to repair.'};const max=b.hp;if((o.hp??max)>=max)return {ok:false,text:'This structure is already intact.'};const cost={wood:1,stone:1};if(!this.canAfford(cost))return {ok:false,text:'Repair needs 1 wood + 1 stone.'};this.pay(cost);this.change(x,y,{...o,hp:max,maxHp:max});return {ok:true,text:this.note(`${b.name} repaired to ${max} durability.`),sound:'build'};}
 dismantle(x,y){const o=this.tile(x,y).object,b=BUILDINGS[o?.kind];if(!o?.built||!b||!this.near(x,y,2.5))return {ok:false,text:'Select a nearby player-built structure first.'};if(o.kind==='barracks'&&this.troops.length)return {ok:false,text:'Your defenders still use this barracks.'};this.change(x,y,null);if(b.production)this.inventory[b.production.resource]+=o.stock||0;for(const [k,n] of Object.entries(o.paid||b.cost))this.inventory[k]+=Math.floor(n/2);return {ok:true,text:this.note(`${b.name} dismantled. Half the building materials returned, rounded down.`),sound:'cloth'};}
 upgradeHome(){return upgradeHome(this);}startRaid(){return startRaid(this);}whistle(){return whistle(this);}tickRaid(dt){return tickRaid(this,dt);}
 serialize(){return {version:VERSION,seed:this.seed,locations:this.locations,artifacts:this.artifacts,changes:[...this.changes],inventory:this.inventory,player:this.player,flags:this.flags,turn:this.turn,log:this.log,visited:[...this.visited],travelled:this.travelled,settlement:this.settlement,troops:this.troops,raid:this.raid,ambition:this.ambition,autorun:this.autorun,project:this.project};}
}

export function findPath(world,start,goal){
 const sx=Math.round(start[0]),sy=Math.round(start[1]),gx=Math.round(goal[0]),gy=Math.round(goal[1]);
 const targets=world.walkable(gx,gy)?[[gx,gy]]:[[gx,gy+1],[gx-1,gy],[gx+1,gy],[gx,gy-1]].filter(([x,y])=>world.walkable(x,y));
 if(!targets.length)return [];
 const estimate=(x,y)=>Math.min(...targets.map(([tx,ty])=>Math.abs(tx-x)+Math.abs(ty-y)));
 const frontier=[],push=n=>{frontier.push(n);let i=frontier.length-1;while(i){const p=(i-1)>>1;if(frontier[p].score<=n.score)break;frontier[i]=frontier[p];i=p;}frontier[i]=n;},pop=()=>{const first=frontier[0],last=frontier.pop();if(frontier.length){let i=0;while(i*2+1<frontier.length){let c=i*2+1;if(c+1<frontier.length&&frontier[c+1].score<frontier[c].score)c++;if(last.score<=frontier[c].score)break;frontier[i]=frontier[c];i=c;}frontier[i]=last;}return first;};
 push({x:sx,y:sy,cost:0,score:estimate(sx,sy)});const visited=new Map([[key(sx,sy),{previous:null,cost:0}]]);let end=null;
 for(let count=0;frontier.length&&count<7000;count++){
  const n=pop();if(n.cost!==visited.get(key(n.x,n.y)).cost)continue;if(targets.some(([x,y])=>x===n.x&&y===n.y)){end=key(n.x,n.y);break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n.x+dx,y=n.y+dy,id=key(x,y),cost=n.cost+1;if(Math.abs(x-sx)>65||Math.abs(y-sy)>65||!world.walkable(x,y)||visited.has(id)&&visited.get(id).cost<=cost)continue;visited.set(id,{previous:key(n.x,n.y),cost});push({x,y,cost,score:cost+estimate(x,y)});}
 }
 const path=[];while(end&&visited.get(end)?.previous){path.push(end.split(',').map(Number));end=visited.get(end).previous;}return path.reverse();
}
