export function activityStatus({autoplay,thinking,walking,task,sleeping,finished,state,detail,elapsed=0}){
 if(task)return {state:'working',text:`${autoplay?'Laya':'Mallow'} · ${task}`};
 if(walking)return {state:'walking',text:`${autoplay?'Laya':'Mallow'} · Walking to the next action`};
 if(finished)return {state:'complete',text:'Laya · Goal complete. Ready for a new goal.'};
 if(autoplay&&thinking)return {state:'thinking',text:`Laya · Thinking / waiting · ${Math.floor(elapsed)}s`};
 if(autoplay&&sleeping)return {state:'resting',text:'Laya · Resting, then continuing'};
 if(autoplay)return {state:'running',text:'Laya · Preparing the next action'};
 if(state==='error'||state==='blocked')return {state,text:'Laya · Paused — open Laya for details',detail};
 if(state==='paused')return {state,text:'Laya · Paused. You have control.'};
 return {state:'idle',text:'Ready · You have control'};
}
