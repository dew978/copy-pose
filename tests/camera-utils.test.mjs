import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraPreflight,requestCameraStream,attachCameraVideo} from '../dist/camera-utils.mjs';
const environment={secure:true,available:true,embedded:false,policyAllowed:true,protocol:'file:'};
test('secure file contexts work, while blocked previews get specific guidance',()=>{
 assert.equal(cameraPreflight(environment),null);
 assert.equal(cameraPreflight({...environment,embedded:true,policyAllowed:false}).code,'EMBEDDED_CAMERA_BLOCKED');
 assert.equal(cameraPreflight({...environment,secure:false,protocol:'content:'}).code,'INSECURE_CONTEXT');
});
test('camera permission starts synchronously without waiting for audio',async()=>{
 let called=false;const stream={getTracks:()=>[]};
 const promise=requestCameraStream({getUserMedia(c){called=true;assert.equal(c.audio,false);return Promise.resolve(stream);}});
 assert.equal(called,true);assert.equal(await promise,stream);
});
test('constraint failures retry once with simpler camera constraints',async()=>{
 let n=0;const stream={getTracks:()=>[]};const r=await requestCameraStream({async getUserMedia(c){n++;if(n===1)throw Object.assign(new Error(),{name:'OverconstrainedError'});assert.equal(c.video,true);return stream;}});assert.equal(r,stream);assert.equal(n,2);
});
test('permission rejection does not automatically retry or loop',async()=>{
 let n=0;await assert.rejects(requestCameraStream({async getUserMedia(){n++;throw Object.assign(new Error(),{name:'NotAllowedError'});}}),{name:'NotAllowedError'});assert.equal(n,1);
});
test('late grants after timeout release the camera',async()=>{
 let finish,stopped=false;const p=requestCameraStream({getUserMedia:()=>new Promise(r=>finish=r)},{timeoutMs:10});await assert.rejects(p,{name:'CameraPermissionTimeout'});finish({getTracks:()=>[{stop(){stopped=true;}}]});await new Promise(r=>setTimeout(r,0));assert.ok(stopped);
});
test('canceled connections release the camera',async()=>{
 let stopped=false;await assert.rejects(requestCameraStream({async getUserMedia(){return {getTracks:()=>[{stop(){stopped=true;}}]};}},{isCurrent:()=>false}),{name:'AbortError'});assert.ok(stopped);
});
test('video startup waits for real frame dimensions, not just a stream handle',async()=>{
 class Video extends EventTarget{constructor(){super();this.videoWidth=0;this.readyState=0;}setAttribute(){}play(){return Promise.resolve();}}
 const v=new Video();let done=false;const p=attachCameraVideo(v,{}, {timeoutMs:100}).then(()=>done=true);await Promise.resolve();assert.equal(done,false);v.videoWidth=1280;v.readyState=2;v.dispatchEvent(new Event('loadeddata'));await p;assert.ok(v.muted&&v.playsInline&&done);
});
