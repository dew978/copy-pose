import {POSES,REQUIRED,CONNECTIONS,assignPlayers,scorePose,MatchEngine,matchResult,practiceResult,roundWinner,poseSVG} from './game-core.mjs?v=5';
import {cameraPreflight,requestCameraStream,attachCameraVideo,cameraErrorMessage} from './camera-utils.mjs';
import {createPoseModel} from './model-loader.mjs';
const $=id=>document.getElementById(id);
const ui={video:$('camera'),arena:$('arena'),tracking:$('tracking-canvas'),fx:$('fx-canvas'),cameraButton:$('camera-button'),play:$('play-button'),stop:$('stop-button'),message:$('game-message')};
const engine=new MatchEngine();
const solo=()=>engine.playerCount===1;
const readyPrompt=()=>solo()?'전신이 보이도록 서 계시면 3초 뒤 자동으로 시작합니다. 시작 버튼을 누르러 오지 않으셔도 됩니다.':'두 분의 전신이 모두 보이면 3초 뒤 자동으로 시작합니다. 화면 왼쪽이 Player 1, 오른쪽이 Player 2입니다.';
const startLabel=()=>solo()?'연습 자동 시작 대기':'대결 자동 시작 대기';
const findingLabel=()=>solo()?'전신을 찾는 중…':'두 명의 전신을 찾는 중…';
function settingsLocked(){return !['ready','finished'].includes(engine.phase);}
function updateSettingLock(){
  const locked=settingsLocked();$('mode-settings').disabled=locked;$('round-settings').disabled=locked;$('practice-pose').disabled=locked;
  const selection=engine.poseOffset===null?'10종 중 중복 없이 랜덤 출제합니다.':`첫 자세: ${POSES[engine.poseOffset].name}.${engine.totalRounds>1?' 이후 자세는 중복 없이 랜덤 출제합니다.':''}`;
  $('settings-hint').textContent=locked?'진행 중에는 설정이 고정됩니다. 바꾸려면 그만하기를 눌러 주세요.':`${engine.totalRounds}판 ${solo()?'연습':'대결'} · ${selection} 라운드마다 5초!`;
}
function renderSettings(){
  document.body.classList.toggle('solo-mode',solo());
  document.querySelectorAll('[data-players]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.players)===engine.playerCount));
  document.querySelectorAll('[data-rounds]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.rounds)===engine.totalRounds));
  $('practice-pose').value=engine.poseOffset===null?'random':String(engine.poseOffset);
  $('round-steps').innerHTML=Array.from({length:engine.totalRounds},(_,i)=>`<li>${String(i+1).padStart(2,'0')}</li>`).join('');
  $('round-steps').setAttribute('aria-label',`총 ${engine.totalRounds}라운드`);
  $('round-history').style.gridTemplateColumns=`repeat(${engine.totalRounds},minmax(0,1fr))`;
  $('start-badge').textContent=`${engine.totalRounds} ${engine.totalRounds===1?'ROUND':'ROUNDS'} · 5 SECONDS`;
  $('start-title').innerHTML=solo()?'나만의 연습,<br><em>더 높은 점수.</em>':'같은 자세,<br><em>다른 점수.</em>';
  $('start-instruction').textContent=readyPrompt();
  document.querySelector('.header-tag').textContent=solo()?'ONE PLAYER. YOUR PACE.':'TWO PLAYERS. ONE POSE.';
  document.querySelector('.zone-left').innerHTML=solo()?'<span class="player-dot p1"></span>PRACTICE':'<span class="player-dot p1"></span>PLAYER 1';
  document.querySelector('#position-guides>div:first-child p').textContent=solo()?'전신이 보이게 서 주세요':'왼쪽에 서 주세요';
  document.querySelector('.player-one h2').textContent=solo()?'MY SCORE':'PLAYER 1';
  ui.arena.setAttribute('aria-label',solo()?'1인 연습 카메라 화면':'두 명의 카메라 플레이 화면');
  $('round-kicker').textContent=solo()?'PRACTICE MODE':'READY TO PLAY';
  $('round-title').textContent=solo()?'혼자 연습하고, 기록을 높이세요':'몸으로 하는 한판 승부';
  $('tracking-status').textContent=solo()?'혼자 화면 전체에서 연습하세요':'카메라 한 대로 함께 플레이하세요';
  setTarget(engine.poseIndex);updateSteps();updateScores(true);updateSettingLock();
  message(solo()?`${engine.totalRounds}판 연습 · 5초 안에 자세를 따라 하고 점수를 확인하세요.`:`${engine.totalRounds}판 대결 · 5초 안에 자세를 따라 하고 더 많은 라운드에서 승리하세요!`);
}
function changeSettings(options){
  if(settingsLocked())return;
  engine.reset(options);roundToken++;players=Array(engine.playerCount).fill(null);seenAt=[0,0];liveScores=[null,null];winner=null;celebrateUntil=0;particles=[];autoNextAt=0;
  show('result-overlay',false);show('round-history',false);show('countdown',false);show('position-guides');
  $('time-label').innerHTML='5.0 <small>SEC</small>';$('time-fill').style.transform='scaleX(1)';$('phase-label').textContent='준비되셨나요?';$('timer-caption').textContent='5초 안에 자세 완성';
  if(ready){show(ui.play);ui.play.disabled=true;ui.play.textContent=findingLabel();}
  renderSettings();
}

let stream=null,worker=null,mainModel=null,ready=false,loading=false,busy=false;
let modelEpoch=0,pendingWorker=null,selectedCamera='';
let generation=0,roundToken=0,lastFrameTime=-1,lastCapture=0,modelErrors=0,frameSentAt=0;
let players=[null,null],seenAt=[0,0],liveScores=[null,null],winner=null,celebrateUntil=0;
let audio=null,sound=true,previousCount=-1,phaseWas='',particles=[],lastBurst=0,lastRender=0,autoNextAt=0;
let W=1,H=1,dpr=1,pausedPhase=null;
const colors=['#6fe5ed','#ff9470'];
const ctx=ui.tracking.getContext('2d'),fx=ui.fx.getContext('2d');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(el,visible=true){(typeof el==='string'?$(el):el).classList.toggle('hidden',!visible);}
function message(text){ui.message.textContent=text;}
function beep(freq=600,duration=.1,volume=.07,delay=0){
  if(!sound||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='sine';o.frequency.value=freq;const t=audio.currentTime+delay;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.start(t);o.stop(t+duration+.01);}catch{}
}
function victorySound(){[523,659,784,1047].forEach((f,i)=>beep(f,.28,.07,i*.12));}
function setTarget(index){const pose=POSES[index];$('target-diagram').innerHTML=poseSVG(pose);$('target-diagram').setAttribute('aria-label',pose.name+'：'+pose.instruction);$('pose-name').textContent=pose.name;$('pose-category').textContent=pose.category;$('pose-instruction').textContent=pose.instruction;$('pose-number').textContent=String(engine.index+1).padStart(2,'0')+' / '+String(engine.totalRounds).padStart(2,'0');}
function resize(){const r=ui.arena.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);for(const c of [ui.tracking,ui.fx]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);fx.setTransform(dpr,0,0,dpr,0,0);}
new ResizeObserver(resize).observe(ui.arena);resize();
function cameraState(text,live=false){$('camera-state').textContent=text;$('camera-state').classList.toggle('live',live);}
function connectionNotice(title,detail,code='',error=false){show('connection-panel');$('connection-title').textContent=title;$('connection-detail').textContent=detail;$('connection-code').textContent=code;$('connection-panel').classList.toggle('error',error);}
function cameraEnvironment(){let policyAllowed=true;try{const policy=document.permissionsPolicy||document.featurePolicy;if(policy?.allowsFeature)policyAllowed=policy.allowsFeature('camera');}catch{}return {secure:window.isSecureContext,available:!!navigator.mediaDevices?.getUserMedia,embedded:window.self!==window.top,policyAllowed,protocol:location.protocol};}
function createMainModel(gen=generation,epoch=modelEpoch){return createPoseModel(detail=>{if(gen===generation&&epoch===modelEpoch&&stream)connectionNotice('카메라 연결 완료 · 자세 인식 준비 중',detail);});}
async function initializeModel(gen,epoch){
  if(!window.copyPoseAssets&&location.protocol!=='file:'&&'Worker' in window&&'createImageBitmap' in window&&'OffscreenCanvas' in window){
    let w;
    try{w=new Worker(new URL('./pose-worker.js',import.meta.url));pendingWorker=w;await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('모델 준비 시간 초과')),20000);w.onerror=e=>{clearTimeout(timeout);reject(new Error(e.message));};w.onmessage=({data})=>{if(data.type==='ready'){clearTimeout(timeout);resolve();}else if(data.type==='error'){clearTimeout(timeout);reject(new Error(data.message));}};w.postMessage({type:'init'});});
      if(gen!==generation||epoch!==modelEpoch){w.terminate();return;}
      pendingWorker=null;
      worker=w;w.onerror=()=>runtimeFailure();w.onmessage=({data})=>{
        if(data.cycle!==generation)return;
        busy=false;
        if(data.type==='poses'){modelErrors=0;processPoses(data.landmarks,data.timestamp,data.roundToken);}
        else if(data.type==='frame-error'){modelErrors++;if(modelErrors>=3)runtimeFailure();}
      };return;
    }catch{w?.terminate();if(pendingWorker===w)pendingWorker=null;if(gen!==generation||epoch!==modelEpoch)return;message('이 기기에 맞는 자세 인식 방식을 준비하고 있습니다.');}
  }
  const m=await createMainModel();if(gen!==generation||epoch!==modelEpoch){m.close();return;}mainModel=m;
}
async function refreshCameraPicker(gen){try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');if(gen!==generation)return;const select=$('camera-picker');select.replaceChildren();devices.forEach((d,i)=>{const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||`카메라 ${i+1}`;select.append(o);});select.value=stream?.getVideoTracks()[0]?.getSettings().deviceId||selectedCamera;show('camera-picker-label',devices.length>1);}catch{}}
async function preparePose(gen=generation){
  if(!stream||loading)return;loading=true;ready=false;const epoch=++modelEpoch;let timer;
  show('retry-model-button',false);show(ui.play,false);connectionNotice('카메라 연결 완료 · 자세 인식 준비 중','카메라 영상이 보이면 연결은 정상입니다. 잠시만 기다려 주세요.');
  try{
    await Promise.race([initializeModel(gen,epoch),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('자세 인식 준비 시간 초과'),{name:'ModelLoadTimeout'})),60000);})]);
    if(gen!==generation||epoch!==modelEpoch)return;
    ready=true;loading=false;busy=false;lastFrameTime=-1;frameSentAt=0;cameraState('CAMERA ON',true);show('connection-panel',false);show(ui.play);ui.play.disabled=true;ui.play.textContent=findingLabel();
    message(readyPrompt());
  }catch(e){if(gen!==generation||epoch!==modelEpoch)return;modelEpoch++;pendingWorker?.terminate();pendingWorker=null;loading=false;ready=false;cameraState('CAMERA ON',true);show('retry-model-button');connectionNotice('카메라는 연결되었습니다 · 자세 인식 준비 실패','카메라 영상은 계속 표시됩니다. 아래 버튼으로 자세 인식만 다시 준비해 주세요. 파일 버전은 최신 Chrome·Edge에서 실행해 주세요.',`MODEL: ${e?.name||'Error'} — ${String(e?.message||e).slice(0,220)}`,true);message('카메라 연결과 자세 인식 준비는 별도로 처리됩니다.');}
  finally{clearTimeout(timer);}
}
async function startCamera(){
  if(loading||ready)return;
  const env=cameraEnvironment(),problem=cameraPreflight(env);
  if(problem){connectionNotice('현재 화면에서는 카메라를 열 수 없습니다',problem.message,problem.code,true);message(problem.message);return;}
  const gen=++generation;loading=true;ui.cameraButton.disabled=true;ui.cameraButton.textContent='카메라 권한 확인 중…';show(ui.stop);cameraState('CONNECTING');connectionNotice('카메라 연결 중','브라우저의 카메라 사용 요청을 허용해 주세요.');message('카메라를 허용해 주세요.');
  try{
    const pending=requestCameraStream(navigator.mediaDevices,{deviceId:selectedCamera,isCurrent:()=>gen===generation});
    // Audio must never delay or prevent the user's camera permission prompt.
    try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();}void audio.resume().catch(()=>{});}catch{}
    const s=await pending;
    if(gen!==generation){s.getTracks().forEach(t=>t.stop());return;}
    stream=s;await attachCameraVideo(ui.video,s);if(gen!==generation)return;ui.video.style.display='block';show('start-overlay',false);show('position-guides');cameraState('CAMERA ON',true);loading=false;refreshCameraPicker(gen);
    stream.getVideoTracks()[0].addEventListener('ended',()=>{if(gen===generation){stopCamera();message('카메라 연결이 종료되었습니다. 다시 연결해 주세요.');}});
    await preparePose(gen);
  }catch(e){if(gen!==generation)return;const reason=cameraErrorMessage(e,env);stopCamera();connectionNotice('카메라 연결을 확인해 주세요',reason,`CAMERA: ${e?.name||'Error'}`,true);message(reason);ui.cameraButton.textContent='카메라 다시 연결 ↗';}
}
function stopCamera(){
  generation++;modelEpoch++;ready=false;loading=false;busy=false;worker?.terminate();worker=null;pendingWorker?.terminate();pendingWorker=null;mainModel?.close();mainModel=null;show('connection-panel',false);show('retry-model-button',false);show('camera-picker-label',false);
  stream?.getTracks().forEach(t=>t.stop());stream=null;ui.video.srcObject=null;ui.video.style.display='none';players=[null,null];seenAt=[0,0];winner=null;particles=[];celebrateUntil=0;autoNextAt=0;pausedPhase=null;
  engine.reset();roundToken++;liveScores=[null,null];show('start-overlay');show('position-guides');show('countdown',false);show('result-overlay',false);show('round-history',false);show(ui.play,false);show(ui.stop,false);cameraState('CAMERA OFF');ui.cameraButton.disabled=false;ui.cameraButton.innerHTML='카메라 켜고 시작 <span aria-hidden="true">↗</span>';
  $('round-kicker').textContent='READY TO PLAY';$('round-title').textContent='몸으로 하는 한판 승부';setTarget(0);updateScores(true);updateSteps();$('time-label').innerHTML='5.0 <small>SEC</small>';$('phase-label').textContent='준비되셨나요?';$('time-fill').style.transform='scaleX(1)';$('tracking-status').textContent='카메라 한 대로 함께 플레이하세요';$('timer-caption').textContent='5초 안에 자세 완성';renderSettings();
}
let recovering=false;
async function runtimeFailure(){
  if(recovering)return;recovering=true;const gen=generation;ready=false;busy=false;
  if(['playing','prepare'].includes(engine.phase)){engine.phase='retry';roundToken++;show('countdown',false);show('result-overlay',false);}
  worker?.terminate();worker=null;mainModel?.close();mainModel=null;message('인식을 다시 연결하고 있습니다. 진행 중이던 라운드는 다시 시작합니다.');cameraState('RECONNECTING');
  try{const m=await createMainModel();if(gen!==generation){m.close();return;}mainModel=m;ready=true;cameraState('CAMERA ON',true);show(ui.play);ui.play.textContent=engine.phase==='retry'?'이 라운드 다시 도전':startLabel();}
  catch(e){if(gen===generation){ready=false;loading=false;show('retry-model-button');connectionNotice('카메라 연결 유지 · 자세 인식 재연결 필요','카메라는 정상 연결되어 있습니다. 자세 인식 다시 준비를 눌러 주세요.',`MODEL: ${e?.name||'Error'}`,true);}}
  finally{recovering=false;}
}
function processPoses(landmarks,timestamp,token){
  const now=performance.now();
  if(now-timestamp>=750){players=Array(engine.playerCount).fill(null);liveScores=[null,null];return;}
  players=assignPlayers(landmarks,ui.video.videoWidth,ui.video.videoHeight,engine.playerCount);
  const scores=players.map((p,i)=>{if(!p?.complete){liveScores[i]=null;return null;}seenAt[i]=timestamp;const n=scorePose(p.points,POSES[engine.poseIndex]);liveScores[i]=n;return n;});
  if(token===roundToken&&now-timestamp<900)engine.sample(scores,timestamp);
}
function fullyReady(now){return !document.hidden&&players.length===engine.playerCount&&players.every((p,i)=>p?.complete&&now-seenAt[i]<750);}
function startRound(){
  if(!ready||!['ready','retry','result','finished'].includes(engine.phase))return false;
  // Replay can be armed up close; full-body recognition is checked after stepping back.
  if(engine.phase==='finished')changeSettings({});
  autoNextAt=0;show('result-overlay',false);message(readyPrompt());
  ui.play.disabled=true;ui.play.textContent=startLabel();
  return true;
}
function showRoundPreparation(){
  roundToken++;winner=null;celebrateUntil=0;autoNextAt=0;liveScores=[null,null];previousCount=-1;
  show('result-overlay',false);show(ui.play,false);show('position-guides',false);show('countdown');
  $('countdown').classList.remove('active');$('countdown-caption').textContent='전신 인식 완료 · 자동 시작';
  setTarget(engine.poseIndex);updateSettingLock();$('round-kicker').textContent=solo()?'PRACTICE IN PROGRESS':'MATCH IN PROGRESS';
  $('round-title').textContent=`Round ${engine.index+1} / ${engine.totalRounds}`;$('phase-label').textContent='3초 뒤 자동 시작';
  message('전신 인식 완료! 그대로 서 계시면 3초 뒤 시작합니다.');updateSteps();updateScores(true);
}
function waitForPlayers(){
  roundToken++;previousCount=-1;autoNextAt=0;show('countdown',false);show('result-overlay',false);show('position-guides');show(ui.play);
  ui.play.disabled=true;ui.play.textContent=findingLabel();$('phase-label').textContent='전신 인식 대기';$('timer-caption').textContent='전신 인식 후 3초 자동 시작';
  updateSettingLock();message('전신 인식이 끊겨 카운트다운을 멈췄습니다. 모두 다시 보이면 3초부터 자동으로 시작합니다.');
}
function updateSteps(){[...$('round-steps').children].forEach((li,i)=>{li.classList.toggle('done',i<engine.rounds.length);li.classList.toggle('current',i===engine.rounds.length&&engine.phase!=='finished');li.setAttribute('aria-label',`Round ${i+1}${i<engine.rounds.length?' 완료':''}`);});}
function updateScores(reset=false){
  const practice=solo()?practiceResult(engine.rounds):null;
  const result=solo()?{wins:[0],averages:[practice.average]}:matchResult(engine.rounds);
  for(let i=0;i<engine.playerCount;i++){
    let value=null;
    if(engine.phase==='playing')value=engine.windows[i].best??liveScores[i];
    else if(['result','finished'].includes(engine.phase))value=engine.rounds.at(-1)?.scores[i];
    $('p'+(i+1)+'-score').textContent=value==null?'—':value.toFixed(1);
    $('p'+(i+1)+'-wins').textContent=result.wins[i];
    const status=$('p'+(i+1)+'-status');
    if(engine.phase==='finished')status.textContent=`최종 평균 ${result.averages[i].toFixed(1)}%`;
    else if(engine.phase==='result')status.textContent='이번 라운드 최고 유지 점수';
    else if(engine.phase==='playing')status.textContent=players[i]?.complete?'최고 유지 점수':'전신을 화면 안에 넣어 주세요';
    else status.textContent=reset?solo()?'내 자세 점수':i===0?'왼쪽 플레이어':'오른쪽 플레이어':players[i]?.complete?'전신 인식 완료':'발끝까지 보이게 서 주세요';
  }
}
function renderHistory(){
  const history=$('round-history');history.replaceChildren();
  engine.rounds.forEach((r,i)=>{const item=document.createElement('div');item.className='history-item';
    const score=r.scores[0].toFixed(1),rw=solo()?null:roundWinner(r.scores);
    item.innerHTML=solo()?`<span>ROUND ${i+1}</span><p><b>${score}%</b></p><small>${POSES.find(p=>p.id===r.pose).name}</small>`:`<span>ROUND ${i+1}</span><p><b>${score}%</b><b>${r.scores[1].toFixed(1)}%</b></p><small>${rw===null?'무승부':`P${rw+1} 승리`}</small>`;
    history.appendChild(item);
  });show(history);
}
function finishRound(state,now){
  show('countdown',false);show('result-overlay');$('result-overlay').classList.remove('final');$('time-fill').style.transform='scaleX(0)';$('time-label').innerHTML='0.0 <small>SEC</small>';show(ui.play);ui.play.disabled=false;
  if(state==='retry'){
    $('result-kicker').textContent='TRY AGAIN';$('result-title').textContent='한 번 더!';$('result-detail').textContent=solo()?'전신 인식이 충분하지 않았어요.':'두 명의 전신 인식이 충분하지 않았어요.';$('phase-label').textContent='같은 라운드 재도전';ui.play.disabled=true;ui.play.textContent='전신 인식 후 자동 재도전';autoNextAt=now+2500;message('전신이 보이면 3초 뒤 자동 재도전합니다. 약 0.4초 이상 자세를 유지하면 점수가 기록됩니다.');return;
  }
  updateSettingLock();
  if(solo()){
    const score=engine.rounds.at(-1).scores[0],result=practiceResult(engine.rounds);
    winner=0;celebrateUntil=now+3200;renderHistory();updateScores();updateSteps();victorySound();
    $('result-kicker').textContent=`ROUND ${engine.index+1} · PRACTICE`;$('result-title').textContent=`${score.toFixed(1)}%`;
    $('result-detail').textContent='자세 유사도 · 최고 유지 점수';
    if(state==='finished'){
      $('result-overlay').classList.add('final');celebrateUntil=now+5000;
      $('result-kicker').textContent='PRACTICE COMPLETE';$('result-title').textContent=`${result.average.toFixed(1)}%`;
      $('result-detail').textContent=`전체 평균 · 최고 ${result.best.toFixed(1)}%`;
      $('round-kicker').textContent='PRACTICE COMPLETE';$('round-title').textContent=`${engine.totalRounds}판 연습 · 최종 기록`;
      $('phase-label').textContent='연습 완료';ui.play.textContent='다시 연습하기 ↗';
      message(`연습 완료! 평균 ${result.average.toFixed(1)}%, 최고 ${result.best.toFixed(1)}%입니다. 시작 자세를 바꿔 다시 도전해 보세요.`);
    }else{autoNextAt=now+5000;ui.play.textContent='다음 자세 →';$('phase-label').textContent='연습 결과';message('잠시 후 다음 자세 연습이 시작됩니다.');}
    return;
  }
  const scores=engine.rounds.at(-1).scores;winner=roundWinner(scores);celebrateUntil=now+3200;renderHistory();updateScores();updateSteps();victorySound();
  $('result-kicker').textContent=`ROUND ${engine.index+1} RESULT`;$('result-title').textContent=winner===null?'DRAW':`PLAYER ${winner+1} WINS`;$('result-detail').textContent=`${scores[0].toFixed(1)}%  :  ${scores[1].toFixed(1)}%`;
  if(state==='finished'){
    const result=matchResult(engine.rounds);winner=result.winner;celebrateUntil=Infinity;$('result-overlay').classList.add('final');$('result-kicker').textContent=winner===null?'BOTH PLAYERS':`PLAYER ${winner+1}`;$('result-title').textContent=winner===null?'DOUBLE VICTORY':'VICTORY';$('result-detail').textContent=winner===null?'완벽한 무승부! 두 분 모두 승리!':`${result.wins[winner]} ROUND WINS · 평균 ${result.averages[winner].toFixed(1)}%`;
    $('round-kicker').textContent='MATCH COMPLETE';$('round-title').textContent=`${engine.totalRounds}라운드 · 최종 결과`;$('phase-label').textContent='대결 완료';ui.play.textContent='다시 대결하기 ↗';
    message(result.tiedWins?(winner===null?'승수와 평균 점수가 같아 공동 승리입니다!':'승수가 같아 전체 라운드 평균 점수로 최종 승자를 가렸습니다.'):`Player ${winner+1} 승리! ${engine.totalRounds}라운드 대결을 마쳤습니다.`);
  }else{autoNextAt=now+5000;ui.play.textContent='다음 라운드 →';$('phase-label').textContent='라운드 결과';message('잠시 후 다음 라운드가 시작됩니다. 같은 자리를 유지해 주세요.');}
}
function mapPoint(p){const vw=ui.video.videoWidth||1280,vh=ui.video.videoHeight||720;const scale=Math.min(W/vw,H/vh);return{x:(W-vw*scale)/2+p.x*scale,y:(H-vh*scale)/2+p.y*scale};}
function drawSkeleton(player,i,now){
  if(!player||now-seenAt[i]>850)return;const p=player.points;ctx.save();ctx.strokeStyle=colors[i];ctx.fillStyle=colors[i];ctx.lineWidth=3;ctx.lineCap='round';ctx.shadowColor='#0008';ctx.shadowBlur=4;
  for(const[a,b]of CONNECTIONS){if((p[a]?.visibility||0)<.45||(p[b]?.visibility||0)<.45)continue;const A=mapPoint(p[a]),B=mapPoint(p[b]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}
  for(const i of REQUIRED){if((p[i]?.visibility||0)<.5)continue;const a=mapPoint(p[i]);ctx.beginPath();ctx.arc(a.x,a.y,4,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function convexHull(points){const p=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);if(p.length<3)return p;const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);const lower=[],upper=[];for(const x of p){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),x)<=0)lower.pop();lower.push(x);}for(const x of [...p].reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),x)<=0)upper.pop();upper.push(x);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
function drawAura(player,i,now){
  if(!player||now-seenAt[i]>1200)return;const pts=player.points.filter(p=>p&&(p.visibility??0)>.55).map(mapPoint);if(pts.length<5)return;
  const center={x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};
  const expanded=pts.map(p=>{const dx=p.x-center.x,dy=p.y-center.y,len=Math.max(1,Math.hypot(dx,dy));return{x:p.x+dx/len*25,y:p.y+dy/len*25};});const hull=convexHull(expanded);
  ctx.save();ctx.beginPath();hull.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.lineJoin='round';ctx.lineWidth=reducedMotion?5:6+Math.sin(now/190)*2;ctx.strokeStyle='#d9ff58';ctx.shadowColor='#d9ff58';ctx.shadowBlur=22;ctx.fillStyle='#d9ff5813';ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.lineWidth=1.5;ctx.strokeStyle='#fff8';ctx.stroke();
  if(!reducedMotion){for(let j=0;j<10;j++){const t=(now/1400+j/10)%1,at=t*hull.length,k=Math.floor(at),f=at-k,a=hull[k],b=hull[(k+1)%hull.length];ctx.fillStyle=j%2?'#fff':'#d9ff58';ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,3,0,Math.PI*2);ctx.fill();}}ctx.restore();
}
function burst(x,y){const count=reducedMotion?12:52;for(let n=0;n<count;n++){const a=Math.random()*Math.PI*2,v=1.4+Math.random()*3.8;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:1,color:['#d9ff58','#6fe5ed','#ff9470','#fff2af'][n%4],size:2+Math.random()*3,rotation:Math.random()*Math.PI});}}
function drawEffects(now,delta){
  fx.clearRect(0,0,W,H);
  if(now<celebrateUntil){for(let i=0;i<2;i++)if(winner===null||winner===i)drawAura(players[i],i,now);if(now-lastBurst>(reducedMotion?1400:650)){burst(W*(.1+Math.random()*.8),H*(.18+Math.random()*.45));lastBurst=now;}}
  const dt=Math.min(delta/16.67,3);particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.028*dt;p.life-=.012*dt;p.rotation+=.06*dt;fx.save();fx.translate(p.x,p.y);fx.rotate(p.rotation);fx.globalAlpha=Math.max(0,p.life);fx.fillStyle=p.color;fx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.65);fx.restore();}
}
async function capture(now){
  if(!ready||busy||document.hidden||ui.video.readyState<2||ui.video.currentTime===lastFrameTime||now-lastCapture<(worker?65:100))return;
  busy=true;lastCapture=now;lastFrameTime=ui.video.currentTime;frameSentAt=now;const gen=generation,token=roundToken;
  try{
    if(worker){const ratio=ui.video.videoHeight/ui.video.videoWidth;const bitmap=await createImageBitmap(ui.video,{resizeWidth:960,resizeHeight:Math.round(960*ratio),resizeQuality:'low'});if(gen!==generation||!worker){bitmap.close();busy=false;return;}worker.postMessage({type:'frame',bitmap,timestamp:now,cycle:gen,roundToken:token},[bitmap]);}
    else if(mainModel){const r=mainModel.detectForVideo(ui.video,now);busy=false;processPoses(r.landmarks,now,token);}
  }catch{busy=false;modelErrors++;if(modelErrors>=3)runtimeFailure();}
}
function loop(now){
  const delta=lastRender?now-lastRender:16.67;lastRender=now;
  ctx.clearRect(0,0,W,H);
  if(ready){players.forEach((p,i)=>drawSkeleton(p,i,now));
    const both=fullyReady(now);
    if(['ready','retry','result','finished'].includes(engine.phase)){
      ui.play.disabled=engine.phase==='ready'||engine.phase==='retry';
      if(engine.phase==='ready'||engine.phase==='retry')ui.play.textContent=both?'3초 뒤 자동 시작':findingLabel();
    }
    if(engine.phase==='ready'||engine.phase==='retry'){$('tracking-status').textContent=both?'전신 인식 완료 · 자동 시작 준비':'머리부터 발끝까지 화면 안에 넣어 주세요';show('position-guides',!both);}
    else $('tracking-status').textContent=both?(solo()?'1 PLAYER TRACKED':'2 PLAYERS TRACKED'):'전신이 가려지지 않게 해 주세요';
    const change=engine.advance(now,{allReady:both,visible:!document.hidden,notBefore:autoNextAt});
    if(change==='prepare')showRoundPreparation();
    if(change==='waiting')waitForPlayers();
    if(change==='playing'){roundToken++;previousCount=-1;$('countdown').classList.add('active');$('phase-label').textContent='자세를 유지하세요';message('그림과 같은 방향으로 따라 하세요. 5초 안에 가장 잘 유지한 자세가 기록됩니다.');beep(1000,.15);}
    if(['result','finished','retry'].includes(change))finishRound(change,now);
    if(engine.phase==='prepare'||engine.phase==='playing'){
      const left=Math.max(0,(engine.end-now)/1000),count=Math.ceil(left);$('countdown-number').textContent=count;
      if(count!==previousCount){previousCount=count;beep(engine.phase==='prepare'?440:660,.08);}
      $('time-label').innerHTML=(engine.phase==='prepare'?'5.0':left.toFixed(1))+' <small>SEC</small>';$('time-fill').style.transform=`scaleX(${engine.phase==='prepare'?1:left/5})`;$('timer-caption').textContent=engine.phase==='prepare'?`${count}초 뒤 자동 시작`:`${left.toFixed(1)}초 남음`;
    }
    if(busy&&frameSentAt&&now-frameSentAt>20000)runtimeFailure();
    capture(now);updateScores();
  }
  drawEffects(now,delta);requestAnimationFrame(loop);
}
ui.cameraButton.addEventListener('click',startCamera);ui.play.addEventListener('click',startRound);ui.stop.addEventListener('click',stopCamera);
$('retry-model-button').addEventListener('click',()=>preparePose());
$('camera-picker').addEventListener('change',e=>{selectedCamera=e.target.value;stopCamera();startCamera();});
$('sound-button').addEventListener('click',async()=>{sound=!sound;$('sound-button').textContent=sound?'♫':'♪';$('sound-button').setAttribute('aria-label',sound?'소리 끄기':'소리 켜기');$('sound-button').title=sound?'소리 끄기':'소리 켜기';$('sound-button').style.opacity=sound?'1':'.5';if(sound)try{await audio?.resume();}catch{}});
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message('이 브라우저에서는 전체 화면 전환을 지원하지 않습니다. 가로 모드로 플레이하시면 더 넓게 보입니다.');}});
$('rules-button').addEventListener('click',()=>$('rules-dialog').showModal());$('close-rules').addEventListener('click',()=>$('rules-dialog').close());$('rules-dialog').addEventListener('click',e=>{if(e.target===$('rules-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){players=Array(engine.playerCount).fill(null);seenAt=[0,0];if(['playing','prepare'].includes(engine.phase)){engine.phase='retry';roundToken++;autoNextAt=0;show('countdown',false);show('result-overlay',false);show(ui.play);ui.play.disabled=true;ui.play.textContent='전신 인식 후 자동 재도전';message('화면을 벗어나 게임을 멈췄습니다. 돌아와 전신이 보이면 다시 3초 뒤 시작합니다.');}}
});
window.addEventListener('pagehide',()=>{generation++;stream?.getTracks().forEach(t=>t.stop());worker?.terminate();mainModel?.close();});
// Optional, progressive enhancement for browsers implementing WebMCP.
if(document.modelContext?.registerTool){const controller=new AbortController();const read=()=>({phase:engine.phase,round:engine.index+1,totalRounds:engine.totalRounds,playerCount:engine.playerCount,mode:solo()?'practice':'duel',cameraReady:ready,automaticStart:true,poseCount:POSES.length,playersDetected:players.map(p=>!!p?.complete),rounds:engine.rounds,...(solo()?practiceResult(engine.rounds):matchResult(engine.rounds))});for(const tool of [{name:'get_copy_pose_match',description:'Read the current Copy Pose match, scores, and camera readiness.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object');return read();}},{name:'start_copy_pose_round',description:'Arm the next round or a replay. It starts automatically after all required players are visible for 3 seconds. Camera permission must be granted using the visible button.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object');if(!startRound())throw new Error('Camera must be ready and no round may be active.');return read();}}]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',()=>controller.abort(),{once:true});}
document.querySelectorAll('[data-players]').forEach(b=>b.addEventListener('click',()=>changeSettings({playerCount:Number(b.dataset.players)})));
document.querySelectorAll('[data-rounds]').forEach(b=>b.addEventListener('click',()=>changeSettings({totalRounds:Number(b.dataset.rounds)})));
$('practice-pose').addEventListener('change',e=>changeSettings({poseOffset:e.target.value==='random'?null:Number(e.target.value)}));
renderSettings();requestAnimationFrame(loop);
const initialProblem=cameraPreflight(cameraEnvironment());if(initialProblem)connectionNotice('카메라 실행 환경을 확인해 주세요',initialProblem.message,initialProblem.code,true);
