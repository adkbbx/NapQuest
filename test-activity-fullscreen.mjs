import test from 'node:test';
import assert from 'node:assert/strict';
import {activityStatus} from './web/activity-status.js';
import {mountFullscreen} from './web/fullscreen.js';

test('Laya distinguishes pending, moving, working, completion, pause and failure',()=>{
 for(const [input,state] of [[{autoplay:true,thinking:true},'thinking'],[{autoplay:true,walking:true},'walking'],[{autoplay:true,task:'Mine stone'},'working'],[{finished:true},'complete'],[{state:'paused'},'paused'],[{state:'error',detail:'Quota exhausted'},'error'],[{autoplay:true},'running']])assert.equal(activityStatus(input).state,state);
 assert.match(activityStatus({finished:true}).text,/Goal complete/);
 assert.equal(activityStatus({state:'error',detail:'Quota exhausted'}).detail,'Quota exhausted');
});
test('fullscreen enters and exits and reflects browser-driven exits',async()=>{
 const events={},button={textContent:'',addEventListener:(n,fn)=>events[n]=fn,setAttribute(){}};
 const doc={fullscreenElement:null,documentElement:{requestFullscreen:async()=>{doc.fullscreenElement={};}},exitFullscreen:async()=>{doc.fullscreenElement=null;},addEventListener:(n,fn)=>events[n]=fn};
 mountFullscreen(doc,button);await events.click();assert.equal(button.textContent,'Exit full screen');
 await events.click();assert.equal(button.textContent,'Full screen');
 await events.click();doc.fullscreenElement=null;events.fullscreenchange();assert.equal(button.textContent,'Full screen');
});
test('blocked embed fullscreen provides a standalone link',async()=>{
 let click;const link={hidden:true};
 const doc={documentElement:{requestFullscreen:async()=>{throw Error('Blocked');}},defaultView:{location:{href:'https://example.test/play/'}},getElementById:()=>link,addEventListener(){}};
 mountFullscreen(doc,{addEventListener:(_,fn)=>click=fn,setAttribute(){}});await click();
 assert.equal(link.hidden,false);assert.equal(link.href,'https://example.test/play/');
});
