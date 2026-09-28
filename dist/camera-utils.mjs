export function cameraPreflight({secure,available,embedded,policyAllowed,protocol}){
  if(embedded&&policyAllowed===false)return {code:'EMBEDDED_CAMERA_BLOCKED',message:'이 미리보기 화면에서는 카메라가 차단되어 있습니다. 파일을 내려받아 Chrome 또는 Edge에서 직접 열어 주세요.'};
  if(!secure)return {code:'INSECURE_CONTEXT',message:protocol==='content:'?'휴대폰의 파일 미리보기에서는 카메라를 사용할 수 없습니다. PC의 Chrome·Edge에서 실행하거나 HTTPS 게임 주소로 접속해 주세요.':'현재 실행 화면에서는 카메라를 사용할 수 없습니다. 내려받은 HTML을 PC의 Chrome·Edge에서 직접 열거나, 프로젝트의 실행 파일을 이용해 주세요.'};
  if(!available)return {code:'CAMERA_API_UNAVAILABLE',message:'현재 앱에서는 카메라 연결을 지원하지 않습니다. 앱 내부 미리보기 대신 PC의 Chrome 또는 Edge에서 열어 주세요.'};
  return null;
}
export function cameraFrameInfo(width,height,requestedAspect='16:9'){
  if(!(width>0&&height>0))return null;
  const ratio=width/height,expected=requestedAspect==='4:3'?4/3:16/9;
  const known=[['16:9',16/9],['4:3',4/3],['9:16',9/16],['3:4',3/4]];
  const actual=known.find(([,r])=>Math.abs(ratio/r-1)<.02)?.[0]||`${width}×${height}`;
  return {actual,matches:Math.abs(ratio/expected-1)<.02,width,height};
}
export function requestCameraStream(mediaDevices,{deviceId='',aspect='16:9',timeoutMs=30000,isCurrent=()=>true}={}){
  let expired=false,timer;
  const full=aspect==='4:3',identity=deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'user'}};
  const native=mediaDevices.getSupportedConstraints?.().resizeMode?{resizeMode:{exact:'none'}}:{};
  const attempts=[{...identity,width:{ideal:1280},height:{ideal:full?960:720},aspectRatio:{exact:full?4/3:16/9},...native}];
  // If this ratio is unavailable, preserve the device's native frame before
  // trying a legacy connection. Never synthesize a ratio by cropping it here.
  if(native.resizeMode)attempts.push({...identity,...native});
  attempts.push(deviceId?{deviceId:{exact:deviceId}}:true);
  const abort=()=>Object.assign(new Error('카메라 연결 요청이 취소되었습니다.'),{name:'AbortError'});
  const open=async()=>{
    for(let i=0;i<attempts.length;i++){
      if(expired||!isCurrent())throw abort();
      let stream;
      try{stream=await mediaDevices.getUserMedia({audio:false,video:attempts[i]});}
      catch(e){if(expired||!isCurrent())throw abort();if(e.name==='OverconstrainedError'&&i<attempts.length-1)continue;throw e;}
      if(expired||!isCurrent()){stream.getTracks().forEach(t=>t.stop());throw abort();}return stream;
    }
  };
  // The media request is issued synchronously, before audio or model loading.
  const attempt=open();
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Object.assign(new Error('카메라 권한 응답 대기 시간이 지났습니다.'),{name:'CameraPermissionTimeout'}));},timeoutMs);});
  return Promise.race([attempt,timeout]).finally(()=>clearTimeout(timer));
}
export async function attachCameraVideo(video,stream,{timeoutMs=15000}={}){
  video.muted=true;video.playsInline=true;video.autoplay=true;
  video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
  let timer,loaded,error;
  const frame=new Promise((resolve,reject)=>{loaded=()=>{if(video.videoWidth>0&&video.readyState>=2)resolve();};error=()=>reject(Object.assign(new Error('카메라 영상 재생 실패'),{name:'VideoPlaybackError'}));video.addEventListener('loadeddata',loaded);video.addEventListener('error',error);});
  try{
    video.srcObject=stream;
    const playback=video.play();loaded();
    await Promise.race([Promise.all([playback,frame]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('카메라에서 영상 프레임을 받지 못했습니다.'),{name:'VideoFrameTimeout'})),timeoutMs);})]);
  }finally{clearTimeout(timer);video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',error);}
}
export function cameraErrorMessage(error,{embedded=false}={}){
  switch(error?.name){
    case 'NotAllowedError':case 'SecurityError':return embedded?'앱 내부 미리보기에서 카메라가 차단되었습니다. 파일을 다운로드한 뒤 Chrome 또는 Edge에서 직접 열어 주세요.':'카메라 사용이 거부되었습니다. 브라우저 주소창의 사이트 권한과 기기의 카메라 권한을 허용한 뒤 다시 시도해 주세요.';
    case 'NotFoundError':return '사용 가능한 카메라를 찾지 못했습니다. 웹캠 연결과 기기의 카메라 설정을 확인해 주세요.';
    case 'NotReadableError':case 'AbortError':return '카메라를 열지 못했습니다. Zoom·Teams 등 카메라를 사용하는 앱을 닫고 다시 연결해 주세요.';
    case 'CameraPermissionTimeout':return '카메라 허용 창의 응답을 기다리다 중단되었습니다. 주소창의 카메라 권한을 확인한 뒤 다시 눌러 주세요.';
    case 'VideoFrameTimeout':case 'VideoPlaybackError':return '카메라가 열렸지만 영상을 받지 못했습니다. 가상 카메라 사용 여부를 확인하고 다른 앱을 닫은 뒤 다시 연결해 주세요.';
    default:return '카메라를 준비하지 못했습니다. Chrome 또는 Edge에서 다시 열어 주세요.';
  }
}
