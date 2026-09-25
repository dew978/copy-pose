let model;
async function setup(){
  let library,remote=false;
  try{library=await import('./assets/vision_bundle.mjs');}catch{remote=true;library=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');}
  const {FilesetResolver,PoseLandmarker}=library;
  const vision=await FilesetResolver.forVisionTasks(remote?'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm':new URL('./assets/wasm',self.location.href).href);
  const options={baseOptions:{modelAssetPath:remote?'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task':new URL('./assets/pose_landmarker_full.task',self.location.href).href,delegate:'GPU'},runningMode:'VIDEO',numPoses:2,minPoseDetectionConfidence:.45,minPosePresenceConfidence:.45,minTrackingConfidence:.45,outputSegmentationMasks:false};
  try{model=await PoseLandmarker.createFromOptions(vision,options);}catch{options.baseOptions.delegate='CPU';model=await PoseLandmarker.createFromOptions(vision,options);}
  postMessage({type:'ready'});
}
self.onmessage=async({data})=>{
  if(data.type==='init'){try{await setup();}catch(e){postMessage({type:'error',message:String(e.message||e)});}return;}
  if(data.type==='frame'){
    try{const r=model.detectForVideo(data.bitmap,data.timestamp);postMessage({type:'poses',landmarks:r.landmarks,timestamp:data.timestamp,cycle:data.cycle,roundToken:data.roundToken});}
    catch(e){postMessage({type:'frame-error',message:String(e.message||e),cycle:data.cycle});}
    finally{data.bitmap.close();}
  }
};
