// Screen-space pose definitions drive both the reference image and scoring.
// These are game similarity scores, not calibrated biomechanical measurements.
export const REQUIRED=[11,12,13,14,15,16,23,24,25,26,27,28];
export const CONNECTIONS=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const makePose=(id,name,category,instruction,limbs)=>{
  const points=Array.from({length:33},()=>null);
  const source={0:[0,-1.18],11:[-.36,-.72],12:[.36,-.72],23:[-.25,.25],24:[.25,.25],...limbs};
  for(const [i,[x,y]] of Object.entries(source))points[i]={x,y,visibility:1};
  return {id,name,category,instruction,points};
};
export const POSES=[
  makePose('star','슈퍼스타','몸을 크게 펼쳐 보세요','두 팔을 대각선 위로, 두 발은 어깨보다 넓게 벌려 주세요.',{13:[-.91,-1.16],14:[.91,-1.16],15:[-1.4,-1.58],16:[1.4,-1.58],25:[-.5,.94],26:[.5,.94],27:[-.76,1.63],28:[.76,1.63]}),
  makePose('wings','비행기','수평으로 쭉 펼치세요','팔을 양옆으로 곧게 펴고, 두 발을 가깝게 모아 주세요.',{13:[-.98,-.72],14:[.98,-.72],15:[-1.61,-.72],16:[1.61,-.72],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]}),
  makePose('goal','골인!','팔꿈치를 직각으로','양팔을 옆으로 들고 팔꿈치를 90도로 구부려 손을 위로 올리세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-1.37],25:[-.4,.95],26:[.4,.95],27:[-.57,1.65],28:[.57,1.65]}),
  makePose('lightning','번개 포즈','그림과 같은 방향으로','화면 왼쪽 팔은 위로, 오른쪽 팔은 옆으로 쭉 펴 주세요.',{13:[-.47,-1.38],14:[1,-.72],15:[-.57,-2.03],16:[1.63,-.72],25:[-.35,.97],26:[.35,.97],27:[-.46,1.69],28:[.46,1.69]}),
  makePose('disco','디스코 타임','위아래로 쭉 뻗으세요','화면 왼쪽 팔은 대각선 위로, 오른쪽 팔은 대각선 아래로 펴 주세요.',{13:[-.89,-1.2],14:[.89,-.24],15:[-1.4,-1.67],16:[1.4,.24],25:[-.48,.94],26:[.48,.94],27:[-.73,1.63],28:[.73,1.63]}),
  makePose('cheer','만세!','두 손을 머리 위로','두 팔을 머리 위로 곧게 올리고, 발을 가깝게 모아 주세요.',{13:[-.43,-1.38],14:[.43,-1.38],15:[-.5,-2.03],16:[.5,-2.03],25:[-.2,.97],26:[.2,.97],27:[-.15,1.69],28:[.15,1.69]}),
  makePose('robot','로봇 포즈','팔꿈치 아래로 직각','양팔을 옆으로 들고 팔꿈치를 구부려 두 손이 아래를 향하게 하세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-.07],16:[1,-.07],25:[-.3,.97],26:[.3,.97],27:[-.36,1.69],28:[.36,1.69]}),
  makePose('hero','히어로','두 손은 허리에','두 손을 허리에 대고 팔꿈치는 옆으로 벌리세요. 두 발도 넓게 벌려 주세요.',{13:[-.87,-.22],14:[.87,-.22],15:[-.35,.2],16:[.35,.2],25:[-.49,.94],26:[.49,.94],27:[-.75,1.63],28:[.75,1.63]}),
  makePose('balance','외발 비행기','무릎을 살짝 들어 보세요','팔을 양옆으로 펴고 화면 오른쪽 무릎을 들어 주세요. 몸은 똑바로 세우세요.',{13:[-.98,-.72],14:[.98,-.72],15:[-1.61,-.72],16:[1.61,-.72],25:[-.3,.97],26:[.92,.42],27:[-.35,1.69],28:[.92,1.12]}),
  makePose('hello','안녕 포즈','한 손으로 인사해요','화면 왼쪽 팔꿈치를 구부려 손을 위로 올리고, 오른팔은 아래로 내려 주세요.',{13:[-.97,-.85],14:[.43,-.05],15:[-1.1,-1.49],16:[.5,.61],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]})
];
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const magnitude=a=>Math.hypot(a.x,a.y);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function vectorAngle(a,b){const den=magnitude(a)*magnitude(b);return den<1e-7?Math.PI:Math.acos(clamp((a.x*b.x+a.y*b.y)/den,-1,1));}
function jointAngle(p,a,b,c){return vectorAngle(sub(p[a],p[b]),sub(p[c],p[b]));}
export function usablePose(points){return !!points&&REQUIRED.every(i=>{const p=points[i];return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.visibility??1)>=.5;});}
export function scorePose(points,target){
  if(!usablePose(points))return null;
  const t=target.points||target;
  const edges=[[11,13,1.5],[13,15,1.5],[12,14,1.5],[14,16,1.5],[23,25,1],[25,27,1],[24,26,1],[26,28,1],[11,12,.4],[11,23,.6],[12,24,.6]];
  let total=0,weights=0;
  for(const [a,b,w] of edges){const angle=vectorAngle(sub(points[b],points[a]),sub(t[b],t[a]));total+=Math.pow(clamp(1-angle/(Math.PI/2),0,1),1.3)*w;weights+=w;}
  let joints=0;for(const [a,b,c] of [[11,13,15],[12,14,16],[23,25,27],[24,26,28]]){const error=Math.abs(jointAngle(points,a,b,c)-jointAngle(t,a,b,c));joints+=clamp(1-error/(Math.PI*.6),0,1);}
  return Math.round(clamp((total/weights*.78+joints/4*.22)*100,0,100)*10)/10;
}
export function screenLandmarks(raw,width,height){return raw.map(p=>p?{...p,x:(1-p.x)*width,y:p.y*height}:null);}
export function poseVisibleInFrame(raw){return usablePose(raw)&&REQUIRED.every(i=>raw[i].x>.005&&raw[i].x<.995&&raw[i].y>.005&&raw[i].y<.995);}
export function assignPlayers(poses,width,height,playerCount=2){
  if(playerCount===1){
    // Practice accepts a full body anywhere, including the center divider.
    const candidates=poses.filter(raw=>raw[23]&&raw[24]&&raw[11]&&raw[12]).map(raw=>({raw,points:screenLandmarks(raw,width,height),confidence:REQUIRED.reduce((s,i)=>s+(raw[i]?.visibility||0),0)/REQUIRED.length,complete:poseVisibleInFrame(raw)}));
    candidates.sort((a,b)=>Number(b.complete)-Number(a.complete)||b.confidence-a.confidence);
    return [candidates[0]||null];
  }
  const out=[null,null];
  // Fixed halves prevent IDs and scores swapping when detections reorder.
  for(const raw of poses){if(!raw[23]||!raw[24]||!raw[11]||!raw[12])continue;
    const cx=1-(raw[23].x+raw[24].x)/2;const side=cx<.5?0:1;
    if(Math.abs(cx-.5)<.04)continue;
    const confidence=REQUIRED.reduce((s,i)=>s+(raw[i]?.visibility||0),0)/REQUIRED.length;
    if(!out[side]||confidence>out[side].confidence)out[side]={raw,points:screenLandmarks(raw,width,height),confidence,complete:poseVisibleInFrame(raw)};
  }return out;
}
export class ScoreWindow{
  constructor(){this.reset();}
  reset(){this.samples=[];this.best=null;this.last=-Infinity;}
  add(score,time){
    if(!Number.isFinite(score)){this.samples=[];this.last=-Infinity;return this.best;}
    if(time-this.last>400)this.samples=[];
    this.last=time;this.samples.push({score,time});this.samples=this.samples.filter(p=>time-p.time<=650);
    if(this.samples.length>=3&&time-this.samples[0].time>=350){const mean=this.samples.reduce((s,p)=>s+p.score,0)/this.samples.length;this.best=Math.max(this.best??0,Math.round(mean*10)/10);}
    return this.best;
  }
}
export function roundWinner(scores){return Math.abs(scores[0]-scores[1])<.05?null:scores[0]>scores[1]?0:1;}
export function matchResult(rounds){
  const wins=[0,0],sums=[0,0];for(const r of rounds){const w=roundWinner(r.scores);if(w!==null)wins[w]++;sums[0]+=r.scores[0];sums[1]+=r.scores[1];}
  const averages=sums.map(x=>rounds.length?Math.round(x/rounds.length*10)/10:0);
  const tiedWins=wins[0]===wins[1];const winner=tiedWins?roundWinner(averages):wins[0]>wins[1]?0:1;
  return {wins,averages,winner,tiedWins};
}
export function practiceResult(rounds){
  const scores=rounds.map(r=>r.scores[0]);
  return {average:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:0,best:scores.length?Math.max(...scores):null,completed:rounds.length};
}
export class MatchEngine{
  constructor({random=Math.random,...options}={}){this.random=random;this.playerCount=2;this.totalRounds=5;this.poseOffset=null;this.reset(options);}
  reset({playerCount=this.playerCount,totalRounds=this.totalRounds,poseOffset=this.poseOffset}={}){
    if(![1,2].includes(playerCount)||![1,3,5].includes(totalRounds)||(poseOffset!==null&&(!Number.isInteger(poseOffset)||poseOffset<0||poseOffset>=POSES.length)))throw new RangeError('Invalid game settings');
    this.playerCount=playerCount;this.totalRounds=totalRounds;this.poseOffset=poseOffset;
    this.poseOrder=POSES.map((_,i)=>i).filter(i=>i!==poseOffset);
    for(let i=this.poseOrder.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.poseOrder[i],this.poseOrder[j]]=[this.poseOrder[j],this.poseOrder[i]];}
    if(poseOffset!==null)this.poseOrder.unshift(poseOffset);
    this.rounds=[];this.phase='ready';this.index=0;this.end=0;this.windows=Array.from({length:playerCount},()=>new ScoreWindow());
  }
  get poseIndex(){return this.poseOrder[this.index];}
  prepare(now){if(!['ready','result','retry'].includes(this.phase))return false;if(this.rounds.length>=this.totalRounds)return false;this.index=this.rounds.length;this.phase='prepare';this.end=now+3000;this.windows.forEach(w=>w.reset());return true;}
  advance(now,{allReady=false,visible=true,notBefore=0}={}){
    const recognized=allReady&&visible;
    if(recognized&&now>=notBefore&&['ready','retry','result'].includes(this.phase)&&this.prepare(now))return 'prepare';
    return this.tick(now,recognized);
  }
  tick(now,allReady=true){
    if(this.phase==='prepare'&&!allReady){this.phase=this.rounds.length?'retry':'ready';this.end=0;return 'waiting';}
    if(this.phase==='prepare'&&now>=this.end){this.phase='playing';this.end=now+5000;return 'playing';}
    if(this.phase==='playing'&&now>=this.end){
      const scores=this.windows.map(w=>w.best);
      if(scores.some(s=>s===null)){this.phase='retry';return 'retry';}
      this.rounds.push({pose:POSES[this.poseIndex].id,scores});this.phase=this.rounds.length===this.totalRounds?'finished':'result';return this.phase;
    }return null;
  }
  sample(scores,now){if(this.phase!=='playing'||now>=this.end)return; this.windows.forEach((w,i)=>w.add(scores[i],now));}
}
export function poseSVG(pose){
  const p=pose.points;const xy=i=>({x:150+p[i].x*68,y:151+p[i].y*68});
  let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 285" aria-hidden="true">';
  s+='<g stroke="#243512" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none">';
  for(const [a,b] of CONNECTIONS){const A=xy(a),B=xy(b);s+=`<path d="M${A.x} ${A.y}L${B.x} ${B.y}"/>`;}
  const n=xy(0);s+=`<path d="M150 ${xy(11).y}L${n.x} ${n.y+15}"/></g><circle cx="${n.x}" cy="${n.y-2}" r="18" fill="#243512"/>`;
  for(const i of REQUIRED){const a=xy(i);s+=`<circle cx="${a.x}" cy="${a.y}" r="4.3" fill="#d9ff58" stroke="#243512" stroke-width="1.5"/>`;}
  return s+'</svg>';
}
