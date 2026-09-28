import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraPreflight,requestCameraStream,attachCameraVideo,cameraFrameInfo} from '../dist/camera-utils.mjs';
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
 let stopped=false,current=true;await assert.rejects(requestCameraStream({async getUserMedia(){current=false;return {getTracks:()=>[{stop(){stopped=true;}}]};}},{isCurrent:()=>current}),{name:'AbortError'});assert.ok(stopped);
});
test('4:3 requests an uncropped native frame from the selected camera',async()=>{
 const stream={getTracks:()=>[]};
 const result=await requestCameraStream({getSupportedConstraints:()=>({resizeMode:true}),async getUserMedia(c){
  assert.equal(c.audio,false);assert.deepEqual(c.video.deviceId,{exact:'usb-camera'});
  assert.equal(c.video.width.ideal,1280);assert.equal(c.video.height.ideal,960);
  assert.equal(c.video.aspectRatio.exact,4/3);assert.equal(c.video.resizeMode.exact,'none');return stream;
 }},{aspect:'4:3',deviceId:'usb-camera'});assert.equal(result,stream);
});
test('16:9 retains widescreen capture while requesting no browser crop',async()=>{
 await requestCameraStream({getSupportedConstraints:()=>({resizeMode:true}),async getUserMedia(c){
  assert.equal(c.video.height.ideal,720);assert.equal(c.video.aspectRatio.exact,16/9);
  assert.equal(c.video.resizeMode.exact,'none');return {getTracks:()=>[]};
 }});
});
test('unsupported ratio falls back to a native frame without switching cameras',async()=>{
 const calls=[],stream={getTracks:()=>[]};
 await requestCameraStream({getSupportedConstraints:()=>({resizeMode:true}),async getUserMedia(c){
  calls.push(c);if(calls.length===1)throw Object.assign(new Error(),{name:'OverconstrainedError'});return stream;
 }},{aspect:'4:3',deviceId:'usb-camera'});
 assert.equal(calls.length,2);assert.deepEqual(calls[1],{audio:false,video:{deviceId:{exact:'usb-camera'},resizeMode:{exact:'none'}}});
});
test('legacy fallback preserves the selected device and has a finite retry count',async()=>{
 const calls=[];await requestCameraStream({getSupportedConstraints:()=>({resizeMode:true}),async getUserMedia(c){
  calls.push(c);if(calls.length<3)throw Object.assign(new Error(),{name:'OverconstrainedError'});return {getTracks:()=>[]};
 }},{aspect:'4:3',deviceId:'usb-camera'});
 assert.equal(calls.length,3);assert.deepEqual(calls[2],{audio:false,video:{deviceId:{exact:'usb-camera'}}});
});
test('cancellation between constraint attempts does not reopen a camera',async()=>{
 let current=true,calls=0;
 await assert.rejects(requestCameraStream({async getUserMedia(){calls++;current=false;throw Object.assign(new Error(),{name:'OverconstrainedError'});}},{isCurrent:()=>current}),{name:'AbortError'});
 assert.equal(calls,1);
});
test('actual frame reporting detects unsupported ratios and rotated or unusual formats',()=>{
 assert.equal(cameraFrameInfo(1280,960,'4:3').matches,true);
 assert.deepEqual(cameraFrameInfo(1920,1080,'4:3'),{actual:'16:9',matches:false,width:1920,height:1080});
 assert.equal(cameraFrameInfo(640,480,'4:3').actual,'4:3');
 assert.equal(cameraFrameInfo(960,1280,'4:3').actual,'3:4');
 assert.equal(cameraFrameInfo(1280,1024,'4:3').actual,'1280×1024');
 assert.equal(cameraFrameInfo(0,0,'4:3'),null);
});
test('video startup waits for real frame dimensions, not just a stream handle',async()=>{
 class Video extends EventTarget{constructor(){super();this.videoWidth=0;this.readyState=0;}setAttribute(){}play(){return Promise.resolve();}}
 const v=new Video();let done=false;const p=attachCameraVideo(v,{}, {timeoutMs:100}).then(()=>done=true);await Promise.resolve();assert.equal(done,false);v.videoWidth=1280;v.readyState=2;v.dispatchEvent(new Event('loadeddata'));await p;assert.ok(v.muted&&v.playsInline&&done);
});
