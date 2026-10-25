export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function advance(position,target,budget){
  const d=distance(position,target);
  return d<=budget?[...target]:[position[0]+(target[0]-position[0])*budget/d,position[1]+(target[1]-position[1])*budget/d];
}
// Bank crossings use the only bridge. All points use the same 960 × 600 map.
export function route(from,to){
  const left=from[0]<505,right=from[0]>625,toLeft=to[0]<505,toRight=to[0]>625;
  const east=[[470,318],[598,328]],west=[...east].reverse();
  return [...(left&&toRight?east:right&&toLeft?west:[]),[...to]];
}
export function trailTarget(trail,lag){
  let remaining=lag;
  for(let i=trail.length-1;i>0;i--){
    const d=distance(trail[i],trail[i-1]);
    if(d>=remaining)return advance(trail[i],trail[i-1],remaining);
    remaining-=d;
  }
  return [...trail[0]];
}
export function frameDelta(now,previous){return Math.max(0,Math.min(.05,(now-previous)/1000));}
