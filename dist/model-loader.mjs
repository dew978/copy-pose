export async function createPoseModel(onProgress=()=>{}){
  let PoseLandmarker,files,modelBase;
  if(typeof window!=='undefined'&&window.copyPoseAssets){
    onProgress('파일에 포함된 자세 인식을 준비하고 있습니다…');
    const assets=await window.copyPoseAssets();
    ({PoseLandmarker}=await import(assets.visionURL));
    files={wasmLoaderPath:assets.wasmLoaderURL,wasmBinaryPath:assets.wasmBinaryURL};
    modelBase={modelAssetBuffer:assets.modelBuffer};
  }else{
    onProgress('자세 인식을 준비하고 있습니다…');
    const vision=await import('./assets/vision_bundle.mjs');PoseLandmarker=vision.PoseLandmarker;
    files=await vision.FilesetResolver.forVisionTasks(new URL('./assets/wasm',import.meta.url).href);
    modelBase={modelAssetPath:new URL('./assets/pose_landmarker_full.task',import.meta.url).href};
  }
  const options={baseOptions:{...modelBase,delegate:'GPU'},runningMode:'VIDEO',numPoses:2,minPoseDetectionConfidence:.45,minPosePresenceConfidence:.45,minTrackingConfidence:.45};
  try{return await PoseLandmarker.createFromOptions(files,options);}catch{
    onProgress('이 기기에 맞는 자세 인식 방식을 준비하고 있습니다…');options.baseOptions.delegate='CPU';return await PoseLandmarker.createFromOptions(files,options);
  }
}
