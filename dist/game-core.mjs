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
  makePose('disco','디스코 타임','마지막 자세까지 정확하게','화면 왼쪽 팔은 대각선 위로, 오른쪽 팔은 대각선 아래로 펴 주세요.',{13:[-.89,-1.2],14:[.89,-.24],15:[-1.4,-1.67],16:[1.4,.24],25:[-.48,.94],26:[.48,.94],27:[-.73,1.63],28:[.73,1.63]})
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
export function assignPlayers(poses,width,height){
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
export class MatchEngine{
  constructor(){this.reset();}
  reset(){this.rounds=[];this.phase='ready';this.index=0;this.end=0;this.windows=[new ScoreWindow(),new ScoreWindow()];}
  prepare(now){if(!['ready','result','retry'].includes(this.phase))return false;if(this.rounds.length>=5)return false;this.index=this.rounds.length;this.phase='prepare';this.end=now+3000;this.windows.forEach(w=>w.reset());return true;}
  tick(now){
    if(this.phase==='prepare'&&now>=this.end){this.phase='playing';this.end=now+5000;return 'playing';}
    if(this.phase==='playing'&&now>=this.end){
      const scores=this.windows.map(w=>w.best);
      if(scores.some(s=>s===null)){this.phase='retry';return 'retry';}
      this.rounds.push({pose:POSES[this.index].id,scores});this.phase=this.rounds.length===5?'finished':'result';return this.phase;
    }return null;
  }
  sample(scores,now){if(this.phase!=='playing'||now>=this.end)return; scores.forEach((s,i)=>this.windows[i].add(s,now));}
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
