import {BUILDINGS,buildPermission} from './progression.js';

export const DEFAULT_LOCATIONS={home:[-2,-1],bench:[0,-2],market:[4,-2],picnic:[6,1],office:[10,11],hive:[13,12],bell:[-1,1],project:[3,4]};
export const STRUCTURE_PRICES={bench:4,home:10,path:1,garden:6,lumbermill:8,quarry:8,wall:2,gate:4,tower:10,barracks:14,goldmine:12,cannon:20};
export const GOODS={
 berry:{name:'Fresh berry',price:1,kind:'berries',amount:1,art:'bush',description:'One berry restores 25 energy when eaten.'},
 lunch:{name:'Packed lunch',price:2,kind:'food',amount:2,art:'picnic',description:'Two meals. Each restores 25 energy.'},
 picnic:{name:'Trail picnic',price:4,kind:'picnic',amount:1,art:'picnic',description:'One picnic restores 80 energy.'},
 seeds:{name:'Berry seeds',price:2,kind:'seeds',amount:3,art:'sapling',description:'Three seeds for planting berry bushes.'},
 muffler:{name:'Bell muffler',price:6,kind:'muffler',amount:1,art:'muffler',description:'Fit it to the village bell for quiet outdoor naps.'},
 gloves:{name:'Woodland work gloves',price:10,artifact:true,art:'gloves',description:'Permanently gather one extra wood or stone per tree or rock.'},
 compass:{name:'Trail compass',price:8,artifact:true,art:'compass',description:'Find nearby wood, stone and berries from your Bag. Pick a result to walk there.'},
};
const fail=text=>({ok:false,text});
export function buyGood(world,id){
 const item=GOODS[id];if(!item)return fail('Choose an item from the store.');
 if(item.artifact&&world.artifacts[id])return fail('You already own this artifact.');
 if(world.inventory.coins<item.price)return fail(`You need ${item.price} coins. Sell berries or collect a gold mine.`);
 world.inventory.coins-=item.price;if(item.artifact)world.artifacts[id]=true;else world.inventory[item.kind]+=item.amount;
 world.turn++;return {ok:true,text:world.note(`${item.name} purchased for ${item.price} coins. ${item.description}`),sound:'coin'};
}
export function placementPermission(world,kind,x,y,{moving=null,payment='materials'}={}){
 if(!Number.isInteger(x)||!Number.isInteger(y))return fail('Choose a tile on the map.');
 const tile=world.tile(x,y),home=world.location('home');
 if(tile.object||['water','bridge'].includes(tile.terrain))return fail('Choose empty dry ground.');
 if(Math.hypot(world.player.x-x,world.player.y-y)<.65||world.troops.some(u=>u.hp>0&&Math.hypot(u.x-x,u.y-y)<.65))return fail('Leave room for Mallow and the defenders.');
 if(moving){
  if(world.player.sleeping||world.raid?.status==='active')return fail('Finish your nap or raid before moving the village.');
  if(Math.hypot(x-home[0],y-home[1])>18)return fail('Keep the layout within 18 steps of home.');
 }else{
  const permission=buildPermission(world,kind);if(!permission.ok)return permission;
  if(!world.near(x,y,3))return fail('Choose a patch within three steps of Mallow.');
  const cost=payment==='coins'?{coins:STRUCTURE_PRICES[kind]}:BUILDINGS[kind].cost;
  if(!world.canAfford(cost))return fail(payment==='coins'?`You need ${cost.coins} coins.`:'Gather the displayed building materials first.');
 }
 const solid=kind==='home'||BUILDINGS[kind]?.solid||['market','office','bench','hive','tree','apple','rock'].includes(kind);
 const blocked=(tx,ty)=>{if(tx===x&&ty===y&&solid)return true;if(moving&&tx===moving[0]&&ty===moving[1])return false;return !world.walkable(tx,ty);};
 const routes=[home,world.location('market'),world.location('bench')];
 const movedLandmark=Object.keys(world.locations).find(k=>moving&&world.locations[k][0]===moving[0]&&world.locations[k][1]===moving[1]);
 if(movedLandmark==='home'&&blocked(x,y+1))return fail('Leave the tile below the front door clear.');
 const entrance=movedLandmark==='home'?[x,y+1]:[home[0],home[1]+1];if(blocked(...entrance))return fail('Leave the tile below the home door clear.');
 // A bounded flood fill protects access to the main village after every edit.
 const start=[Math.round(world.player.x),Math.round(world.player.y)],seen=new Set([start.join(',')]),queue=[start];
 const targets=routes.map(old=>moving&&old[0]===moving[0]&&old[1]===moving[1]?[x,y]:old);
 const reached=()=>targets.every(point=>[[0,1],[-1,0],[1,0],[0,-1]].some(([dx,dy])=>seen.has(`${point[0]+dx},${point[1]+dy}`)));
 for(let i=0;i<queue.length&&i<5000&&!reached();i++){const [tx,ty]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=tx+dx,b=ty+dy,id=`${a},${b}`;if(Math.abs(a-start[0])>40||Math.abs(b-start[1])>40||seen.has(id)||blocked(a,b))continue;seen.add(id);queue.push([a,b]);}}
 for(const old of routes){const point=moving&&old[0]===moving[0]&&old[1]===moving[1]?[x,y]:old;if(![[0,1],[-1,0],[1,0],[0,-1]].some(([dx,dy])=>seen.has(`${point[0]+dx},${point[1]+dy}`)))return fail('This would block a village entrance. Leave a walking route.');}
 return {ok:true,text:moving?'Ready to move. No materials spent.':'Ready to place.'};
}
export function moveObject(world,from,to){
 const o=world.tile(...from).object;if(!o||['project','stump','sapling'].includes(o.kind))return fail('Choose a home, building, tree or village asset. The river crossing stays fixed.');
 const allowed=placementPermission(world,o.kind,...to,{moving:from});if(!allowed.ok)return allowed;
 const landmark=Object.keys(world.locations).find(k=>world.locations[k][0]===from[0]&&world.locations[k][1]===from[1]&&k===o.kind);
 world.change(...from,null);world.change(...to,{...o,id:to.join(','),...(landmark?{landmark}: {})});if(landmark)world.locations[landmark]=[...to];
 world.turn++;return {ok:true,text:world.note(`${o.name||BUILDINGS[o.kind]?.name||o.kind} moved. Routes and village markers updated.`),sound:'cloth',moved:{from,to}};
}
export function tickRest(world,dt,seconds=7){
 if(!world.player.sleeping)return null;
 world.player.restElapsed=Math.min(10,(world.player.restElapsed||0)+Math.max(0,dt));
 const duration=Math.max(5,Math.min(10,seconds));if(world.player.restElapsed<duration)return null;
 const shelter=!!world.player.shelter,rest=world.finishRest();
 if(world.player.sleeping)world.wake();if(shelter&&world.flags.rested&&world.flags.quiet&&['story','rest'].includes(world.project?.kind))world.project.restCompleted=true;
 return {ok:true,text:rest?.text&&!world.flags.rested?rest.text:world.note(shelter?'Nap complete. Mallow steps outside, recharged and ready.':'Nap complete. Mallow is back on his feet.'),sound:'door',pose:'idle',napFinished:true};
}
