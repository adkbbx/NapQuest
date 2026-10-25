import {findPath} from './open-world-model.js';
import {MAX_LEVEL,BUILDINGS,TROOPS,ENEMIES,RAID_TIERS,tierFor,troopCapacity,buildingCount,costText} from './progression.js';
export {MAX_LEVEL} from './progression.js';
export function upgradeCost(level){return level>=MAX_LEVEL?null:{wood:4+level*2,stone:2+level,coins:Math.ceil(level/2)};}
export function upgradeHome(world){
 const cost=upgradeCost(world.settlement.level);if(!cost)return {ok:false,text:`Your Acorn keep has reached the level ${MAX_LEVEL} chapter cap. Defeat the Goose Captain to earn the village crest.`};
 if(!world.near(...world.location('home'),2.5))return {ok:false,text:'Walk to your home before upgrading it.'};
 if(!world.canAfford(cost))return {ok:false,text:`Next home level needs ${costText(cost)}.`};
 world.pay(cost);world.settlement.level++;world.turn++;const tier=tierFor(world.settlement.level);return {ok:true,text:world.note(`Home upgraded to level ${world.settlement.level}: ${tier.name}. ${tier.promise}`),pose:'work',levelUp:world.settlement.level};
}
export function trainTroop(world,type){
 const t=TROOPS[type];if(!t||world.settlement.level<t.level)return {ok:false,text:`${t?.name||'Troop'} unlocks at level ${t?.level||3}.`};
 if(!buildingCount(world,'barracks'))return {ok:false,text:'Build a rabbit barracks before training troops.'};
 if(world.troops.length>=troopCapacity(world.settlement.level))return {ok:false,text:'Your defender camp is full. Upgrade home for more space.'};
 if(!world.canAfford(t.cost))return {ok:false,text:`Training needs ${costText(t.cost)}.`};
 world.pay(t.cost);const id=world.settlement.nextTroopId++,barracks=[...world.changes].find(([,t])=>t.object?.kind==='barracks')[0].split(',').map(Number),spawn=[[barracks[0],barracks[1]+1],[barracks[0]+1,barracks[1]],[barracks[0]-1,barracks[1]]].find(p=>world.walkable(...p)&&!world.troops.some(u=>Math.hypot(u.x-p[0],u.y-p[1])<.6))||[world.location('home')[0],world.location('home')[1]+1];world.troops.push({id,type,x:spawn[0],y:spawn[1],hp:t.hp,maxHp:t.hp,attackClock:0,route:[],routeClock:0,mode:'idle'});world.turn++;
 return {ok:true,text:world.note(`${t.name} trained. Defenders automatically intercept raiders and recover after each battle.`),pose:'wave',sound:'train'};
}
function raidRoute(world,start,type){const h=world.location('home'),door=[h[0],h[1]+1];
 const breachWorld={walkable:(x,y)=>{const kind=world.tile(x,y).object?.kind;return ['wall','gate'].includes(kind)||world.walkable(x,y);}};
 const openWorld={walkable:(x,y)=>world.tile(x,y).object?.kind!=='gate'&&world.walkable(x,y)};
 const breach=findPath(breachWorld,start,door),open=findPath(openWorld,start,door);
 return type==='boar'||!open.length||open.length>breach.length+6?breach:open;
}
export function startRaid(world){
 if(world.raid?.status==='active')return {ok:false,text:'Finish the current raid first.'};
 if(!world.near(...world.location('home'),15))return {ok:false,text:'Return to your village before starting a raid.'};
 const h=world.location('home');const tier=Math.min(MAX_LEVEL,world.settlement.level),wave=world.settlement.wins+1,enemies=[];
 for(const [i,type] of RAID_TIERS[tier-1].entries()){const spawn=[h[0]+(i%2?7:-6),h[1]-2-i],route=raidRoute(world,spawn,type);if(route.length){const stats=ENEMIES[type];enemies.push({id:`${wave}-${i}`,type,x:spawn[0],y:spawn[1],hp:stats.hp,maxHp:stats.hp,route,attackClock:0});}}
 if(!enemies.length)return {ok:false,text:'No approach to the hollow. Leave a route through the clearing.'};
 for(const u of world.troops){u.hp=u.maxHp;u.route=[];u.attackClock=0;}
 world.raid={status:'active',tier,wave,enemies,baseHp:100+tier*30,maxBaseHp:100+tier*30,whistleClock:0,defenseClocks:{},repathClock:0};
 return {ok:true,text:world.note(`${tier===5?'Final siege':'Village raid'} ${wave}! ${RAID_TIERS[tier-1].map(k=>ENEMIES[k].name).join(', ')}. Defend the hollow!`),raidStart:true};
}
export function whistle(world){
 const raid=world.raid;if(raid?.status!=='active'||raid.whistleClock>0)return {ok:false,text:'Your whistle needs a moment.'};
 const near=raid.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-world.player.x,e.y-world.player.y)<3);
 if(!near.length)return {ok:false,text:'Move within three steps of a raider, then shoo it.'};
 for(const e of near)e.hp=Math.max(0,e.hp-45);raid.whistleClock=1.2;return {ok:true,text:'SHOO! Nearby raiders lose 45 courage.',pose:'wave'};
}
function moveAlong(unit,dt,speed){const next=unit.route?.[0];if(!next)return false;const dx=next[0]-unit.x,dy=next[1]-unit.y,d=Math.hypot(dx,dy);if(d<.06){unit.x=next[0];unit.y=next[1];unit.route.shift();return false;}const amount=Math.min(d,dt*speed);unit.x+=dx/d*amount;unit.y+=dy/d*amount;return true;}
function recoverArmy(world){for(const u of world.troops){u.hp=u.maxHp;u.route=[];u.routeClock=0;u.mode='idle';}}
export function tickVillage(world,dt){
 for(const [,tile] of world.changes){const o=tile.object,p=BUILDINGS[o?.kind]?.production;if(!p)continue;o.stock=o.stock||0;if(o.stock>=p.capacity){o.productionClock=0;continue;}o.productionClock=(o.productionClock||0)+dt;while(o.productionClock>=p.seconds&&o.stock<p.capacity){o.productionClock-=p.seconds;o.stock=Math.min(p.capacity,o.stock+p.amount);}if(o.stock>=p.capacity)o.productionClock=0;}
 if(world.raid?.status!=='active')for(const [i,u] of world.troops.entries()){u.hp=u.maxHp;const h=world.location('home'),target=[h[0]-1+i%4,h[1]+2+Math.floor(i/4)];if(Math.hypot(u.x-target[0],u.y-target[1])>.2){u.routeClock=(u.routeClock||0)-dt;if(u.routeClock<=0){u.route=findPath(world,[u.x,u.y],target);u.routeClock=1;}u.mode=moveAlong(u,dt,TROOPS[u.type].speed)?'walk':'idle';}else u.mode='idle';}
}
export function tickRaid(world,dt){
 const h=world.location('home'),r=world.raid,shots=[];if(r?.status!=='active')return shots;
 r.whistleClock=Math.max(0,r.whistleClock-dt);r.defenseClocks=r.defenseClocks||{};r.repathClock=(r.repathClock||0)-dt;
 if(r.repathClock<=0){r.repathClock=1;for(const e of r.enemies)if(e.hp>0)e.route=raidRoute(world,[e.x,e.y],e.type||'goose');}
 for(const e of r.enemies){if(e.hp<=0)continue;const stats=ENEMIES[e.type||'goose'];e.mode='walk';e.attackClock=(e.attackClock||0)-dt;
  const defender=world.troops.find(u=>u.hp>0&&Math.hypot(u.x-e.x,u.y-e.y)<1.3);
  if(defender){e.mode='attack';if(e.attackClock<=0){e.attackClock=1;defender.hp=Math.max(0,defender.hp-stats.damage*2);shots.push({from:[e.x,e.y-.5],to:[defender.x,defender.y-.5],kind:'hit',amount:stats.damage*2});}continue;}
  const next=e.route[0],tile=next&&world.tile(...next),wall=tile?.object;
  if(wall&&['wall','gate'].includes(wall.kind)&&Math.hypot(e.x-next[0],e.y-next[1])<1.15){e.mode='attack';if(e.attackClock<=0){e.attackClock=1;const damage=stats.damage*stats.wallMultiplier;wall.hp=(wall.hp??BUILDINGS[wall.kind].hp)-damage;world.change(...next,{...wall});shots.push({from:[e.x,e.y-.5],to:[next[0],next[1]-.5],kind:wall.hp<=0?'wallbreak':'wallhit',amount:damage});if(wall.hp<=0){world.change(...next,null);world.note(`A ${wall.kind==='gate'?'gate':'wall'} broke! Rebuild the breach after the raid.`);r.repathClock=0;}}continue;}
  moveAlong(e,dt,stats.speed);if(Math.hypot(e.x-h[0],e.y-h[1]-1)<1.5){e.mode='attack';if(e.attackClock<=0){e.attackClock=1;r.baseHp=Math.max(0,r.baseHp-stats.damage);shots.push({from:[e.x,e.y-.5],to:[h[0],h[1]+.5],kind:'wallhit',amount:stats.damage});}}
 }
 for(const u of world.troops){if(u.hp<=0){u.mode='retreat';continue;}const stats=TROOPS[u.type],enemy=r.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];if(!enemy)continue;u.attackClock=Math.max(0,(u.attackClock||0)-dt);const distance=Math.hypot(enemy.x-u.x,enemy.y-u.y);
  if(distance<=stats.range){u.mode='attack';if(u.attackClock<=0){u.attackClock=stats.seconds;enemy.hp=Math.max(0,enemy.hp-stats.damage);shots.push({from:[u.x,u.y-.5],to:[enemy.x,enemy.y-.5],kind:u.type==='ranger'?'acorn':'hit',source:'troop',amount:stats.damage});}}
  else{u.routeClock=(u.routeClock||0)-dt;if(u.routeClock<=0){u.route=findPath(world,[u.x,u.y],[enemy.x,enemy.y]);u.routeClock=.6;}u.mode=moveAlong(u,dt,stats.speed)?'walk':'idle';}
 }
 for(const [id,t] of world.changes){const o=t.object,attack=BUILDINGS[o?.kind]?.attack;if(!attack)continue;r.defenseClocks[id]=(r.defenseClocks[id]||0)-dt;if(r.defenseClocks[id]>0)continue;const [x,y]=id.split(',').map(Number),enemy=r.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<attack.range).sort((a,b)=>a.hp-b.hp)[0];if(!enemy)continue;r.defenseClocks[id]=attack.seconds;const victims=attack.splash?r.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<=attack.splash):[enemy];for(const v of victims)v.hp=Math.max(0,v.hp-attack.damage);shots.push({from:[x,y-1],to:[enemy.x,enemy.y-.5],kind:attack.kind,amount:attack.damage});}
 if(r.enemies.every(e=>e.hp<=0)){r.status='won';world.settlement.wins++;const coins=3+(r.tier||1)*2;world.earnCoins(coins);world.inventory.stone+=(r.tier||1);if(r.tier===5)world.settlement.captainDefeated=true;recoverArmy(world);world.note(`${r.tier===5?'Goose Captain defeated! Acorn crest earned.':'Raid repelled!'} +${coins} coins, +${r.tier||1} stone. Your defenders return to camp.`);}
 else if(r.baseHp<=0){r.status='lost';world.inventory.berries=Math.max(0,world.inventory.berries-2);recoverArmy(world);world.note('The raiders stole up to 2 berries and left. Home levels, mines and troops are safe. Repair the breached walls and try again.');}
 return shots;
}
