export const MAX_LEVEL=5;
export const LEVELS=[
 {level:1,name:'Humble hollow',home:'tier1',size:[158,160],unlocks:['bench','home','path','garden'],enemy:'goose',promise:'Gather supplies and shoo your first goose.'},
 {level:2,name:'Timber lodge',home:'tier2',size:[172,174],unlocks:['lumbermill','quarry','wall','gate','tower'],enemy:'goose',promise:'Mills and quarries fund a protected village. Your bedroom blocks the bell.'},
 {level:3,name:'Village hall',home:'tier3',size:[184,186],unlocks:['barracks','goldmine'],enemy:'boar',promise:'Train rabbit guards. Boars batter walls for triple damage.'},
 {level:4,name:'Woodland stronghold',home:'tier4',size:[198,200],unlocks:['cannon'],enemy:'bandit',promise:'Train hedgehog rangers. Cannons hit groups; fox bandits rush openings.'},
 {level:5,name:'Acorn keep',home:'tier5',size:[216,218],unlocks:[],enemy:'captain',promise:'Eight defenders and the Goose Captain final siege. Defeat him to earn the crest.'},
];
export const BUILDINGS={
 bench:{name:'Workbench',level:1,cost:{wood:3,stone:2},limit:3,hp:120,solid:true},
 home:{name:'Guest cabin',level:1,cost:{wood:8,stone:4},limit:3,hp:160,solid:true},
 path:{name:'Footpath',level:1,cost:{stone:1},limit:Infinity},
 garden:{name:'Berry garden',level:1,cost:{wood:4,seeds:2},limit:4,hp:80},
 lumbermill:{name:'Lumber mill',level:2,cost:{wood:4,stone:2},limit:2,hp:140,solid:true,production:{resource:'wood',amount:2,seconds:8,capacity:16}},
 quarry:{name:'Stone quarry',level:2,cost:{wood:5,stone:2},limit:2,hp:160,solid:true,production:{resource:'stone',amount:2,seconds:9,capacity:16}},
 wall:{name:'Palisade wall',level:2,cost:{wood:2,stone:1},limit:40,hp:110,solid:true},
 gate:{name:'Village gate',level:2,cost:{wood:3,stone:2},limit:4,hp:170},
 tower:{name:'Acorn watchtower',level:2,cost:{wood:6,stone:4},limit:3,hp:160,solid:true,attack:{range:6,damage:24,seconds:1.1,kind:'acorn'}},
 barracks:{name:'Rabbit barracks',level:3,cost:{wood:8,stone:5,coins:2},limit:1,hp:200,solid:true},
 goldmine:{name:'Gold mine',level:3,cost:{wood:6,stone:5},limit:2,hp:180,solid:true,production:{resource:'coins',amount:1,seconds:12,capacity:10}},
 cannon:{name:'Acorn cannon',level:4,cost:{wood:8,stone:8,coins:4},limit:2,hp:200,solid:true,attack:{range:7,damage:42,seconds:2,kind:'cannon',splash:1.8}},
};
export const TROOPS={
 guard:{name:'Rabbit guard',level:3,cost:{food:1,coins:1},hp:100,damage:19,range:1.5,speed:2.1,seconds:.85,sprite:'guard'},
 ranger:{name:'Hedgehog ranger',level:4,cost:{food:1,coins:2},hp:75,damage:23,range:5,speed:1.9,seconds:1.2,sprite:'ranger'},
};
export const ENEMIES={
 goose:{name:'Goose scout',sprite:'goose',hp:65,speed:1,damage:6,wallMultiplier:1},
 boar:{name:'Boar breaker',sprite:'boar',hp:150,speed:.8,damage:9,wallMultiplier:3},
 bandit:{name:'Fox bandit',sprite:'bandit',hp:90,speed:1.5,damage:9,wallMultiplier:1},
 captain:{name:'Goose Captain',sprite:'captain',hp:260,speed:.75,damage:13,wallMultiplier:1.6},
};
export const RAID_TIERS=[['goose'],['goose','goose'],['goose','boar'],['boar','bandit','bandit'],['boar','bandit','bandit','captain']];
export const tierFor=level=>LEVELS[Math.max(0,Math.min(MAX_LEVEL,level)-1)];
export const troopCapacity=level=>level<3?0:level===3?3:level===4?5:8;
export const costText=cost=>Object.entries(cost).map(([k,n])=>`${n} ${k}`).join(' + ');
export const buildingCount=(world,kind)=>[...world.changes.values()].filter(t=>t.object?.kind===kind&&!t.object.landmark).length;
export function buildPermission(world,kind){const b=BUILDINGS[kind];if(!b)return {ok:false,text:'Unknown building.'};if(world.settlement.level<b.level)return {ok:false,text:`Unlocks at home level ${b.level}.`};if(buildingCount(world,kind)>=b.limit)return {ok:false,text:`Limit reached: ${b.limit} ${b.name.toLowerCase()}.`};return {ok:true,text:`${costText(b.cost)}. ${buildingCount(world,kind)}/${b.limit===Infinity?'∞':b.limit} built.`};}
