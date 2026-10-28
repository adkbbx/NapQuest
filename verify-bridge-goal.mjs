import {writeFile} from 'node:fs/promises';
import {OpenWorld,findPath} from './web/open-world-model.js';
import {interpretGoal,askLaya} from './web/laya-agent.js';
import {taskActions,applyTaskAction,taskComplete} from './web/agent-tasks.js';
const base='http://127.0.0.1:8792';
const w=new OpenWorld(41),trace=[];
w.project=await interpretGoal('fix the bridge',base,w);console.log('Goal:',w.project.kind);
for(let i=0;i<16&&!taskComplete(w,w.project);i++){
 const options=taskActions(w,w.project),decision=await askLaya('fix the bridge',options,base),a=options.find(a=>a.id===decision.choice);
 if(a.target){const end=findPath(w,[w.player.x,w.player.y],a.target).at(-1);if(end)[w.player.x,w.player.y]=end;}
 const result=applyTaskAction(w,a);trace.push({action:a.id,ok:result.ok,text:result.text});if(!result.ok)throw Error(result.text);
}
const result={project:w.project.kind,bridge:w.flags.bridge,complete:taskComplete(w,w.project),trace};
await writeFile('evidence/bridge-goal-real-laya.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
if(!result.bridge||!result.complete)process.exitCode=1;
