// Explicit supplied scenario, isolated from earned village progress and normal practice saves.
import {OpenWorld} from './open-world-model.js';
import {BUILDINGS} from './progression.js';
export function defensePractice(level=5){
 const w=new OpenWorld(41);w.settlement.level=level;w.flags.bridge=true;w.flags.quiet=true;w.player={x:-2,y:1,energy:100,sleeping:false,shelter:null};
 Object.assign(w.inventory,{wood:60,stone:50,coins:30,food:12,seeds:6});
 const structures=[['lumbermill',2,-4],['quarry',-5,-4],['goldmine',5,-4],['barracks',-5,0],['tower',-4,-2],['tower',1,0],['cannon',0,2],['cannon',2,1],['wall',-5,-3],['wall',-4,-3],['wall',-3,-3],['wall',-2,-3],['wall',-1,-3],['wall',-5,-2],['wall',-5,1],['gate',0,-1]];
 for(const [kind,x,y] of structures){const b=BUILDINGS[kind];if(b.level<=level)w.change(x,y,{kind,built:true,hp:b.hp,maxHp:b.hp,stock:0,productionClock:0});}
 if(level>=3)for(const type of level>=4?['guard','guard','ranger','ranger']:['guard','guard'])w.trainTroop(type);
 w.ambition='Defend my woodland village and enjoy the afternoon.';w.note(`Supplied defense practice, level ${level}. Buildings, defenders and supplies are a demonstration fixture. Your earned village uses a separate save.`);return w;
}
