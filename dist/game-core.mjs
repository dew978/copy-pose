// Screen-space pose definitions drive both the reference image and scoring.
// These are game similarity scores, not calibrated biomechanical measurements.
export const REQUIRED=[11,12,13,14,15,16,23,24,25,26,27,28];
export const CONNECTIONS=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
export const DIFFICULTIES={easy:"하",medium:"중",hard:"상",expert:"최상"};
const makePose=(id,name,category,instruction,limbs,difficulty="easy")=>{
  const points=Array.from({length:33},()=>null);
  const source={0:[0,-1.18],11:[-.36,-.72],12:[.36,-.72],23:[-.25,.25],24:[.25,.25],...limbs};
  for(const [i,[x,y]] of Object.entries(source))points[i]={x,y,visibility:1};
  return {id,name,category,instruction,points,difficulty};
};
export const POSES=[
  makePose('star','슈퍼스타','몸을 크게 펼쳐 보세요','두 팔을 대각선 위로, 두 발은 어깨보다 넓게 벌려 주세요.',{13:[-.91,-1.16],14:[.91,-1.16],15:[-1.4,-1.58],16:[1.4,-1.58],25:[-.5,.94],26:[.5,.94],27:[-.76,1.63],28:[.76,1.63]}),
  makePose('wings','비행기','수평으로 쭉 펼치세요','팔을 양옆으로 곧게 펴고, 두 발을 가깝게 모아 주세요.',{13:[-.98,-.72],14:[.98,-.72],15:[-1.61,-.72],16:[1.61,-.72],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]}),
  makePose('goal','골인!','팔꿈치를 직각으로','양팔을 옆으로 들고 팔꿈치를 90도로 구부려 손을 위로 올리세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-1.37],25:[-.4,.95],26:[.4,.95],27:[-.57,1.65],28:[.57,1.65]}),
  makePose('lightning','번개 포즈','그림과 같은 방향으로','화면 왼쪽 팔은 위로, 오른쪽 팔은 옆으로 쭉 펴 주세요.',{13:[-.47,-1.38],14:[1,-.72],15:[-.57,-2.03],16:[1.63,-.72],25:[-.35,.97],26:[.35,.97],27:[-.46,1.69],28:[.46,1.69]},'medium'),
  makePose('disco','디스코 타임','위아래로 쭉 뻗으세요','화면 왼쪽 팔은 대각선 위로, 오른쪽 팔은 대각선 아래로 펴 주세요.',{13:[-.89,-1.2],14:[.89,-.24],15:[-1.4,-1.67],16:[1.4,.24],25:[-.48,.94],26:[.48,.94],27:[-.73,1.63],28:[.73,1.63]},'medium'),
  makePose('cheer','만세!','두 손을 머리 위로','두 팔을 머리 위로 곧게 올리고, 발을 가깝게 모아 주세요.',{13:[-.43,-1.38],14:[.43,-1.38],15:[-.5,-2.03],16:[.5,-2.03],25:[-.2,.97],26:[.2,.97],27:[-.15,1.69],28:[.15,1.69]}),
  makePose('robot','로봇 포즈','팔꿈치 아래로 직각','양팔을 옆으로 들고 팔꿈치를 구부려 두 손이 아래를 향하게 하세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-.07],16:[1,-.07],25:[-.3,.97],26:[.3,.97],27:[-.36,1.69],28:[.36,1.69]}),
  makePose('hero','히어로','두 손은 허리에','두 손을 허리에 대고 팔꿈치는 옆으로 벌리세요. 두 발도 넓게 벌려 주세요.',{13:[-.87,-.22],14:[.87,-.22],15:[-.35,.2],16:[.35,.2],25:[-.49,.94],26:[.49,.94],27:[-.75,1.63],28:[.75,1.63]}),
  makePose('balance','외발 비행기','무릎을 살짝 들어 보세요','팔을 양옆으로 펴고 화면 오른쪽 무릎을 들어 주세요. 몸은 똑바로 세우세요.',{13:[-.98,-.72],14:[.98,-.72],15:[-1.61,-.72],16:[1.61,-.72],25:[-.3,.97],26:[.92,.42],27:[-.35,1.69],28:[.92,1.12]},'hard'),
  makePose('hello','안녕 포즈','한 손으로 인사해요','화면 왼쪽 팔꿈치를 구부려 손을 위로 올리고, 오른팔은 아래로 내려 주세요.',{13:[-.97,-.85],14:[.43,-.05],15:[-1.1,-1.49],16:[.5,.61],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]}),
  makePose('ready','차렷','팔을 편하게 내려요','양팔을 몸 옆으로 내리고 두 발을 모아 주세요.',{13:[-.43,-.05],14:[.43,-.05],15:[-.5,.61],16:[.5,.61],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]}),
  makePose('low-wings','아래로 날개','양팔을 아래로 펼쳐요','양팔을 대각선 아래로 펴고 두 발을 어깨너비로 벌려 주세요.',{13:[-.89,-.24],14:[.89,-.24],15:[-1.4,.24],16:[1.4,.24],25:[-.35,.97],26:[.35,.97],27:[-.46,1.69],28:[.46,1.69]}),
  makePose('shrug','으쓱으쓱','손바닥을 위로','팔꿈치를 몸 옆에서 벌리고 양손을 바깥쪽 위로 들어 주세요.',{13:[-.67,-.12],14:[.67,-.12],15:[-1.13,-.59],16:[1.13,-.59],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]}),
  makePose('one-reach','슈퍼 히어로','한 팔은 위로','화면 왼팔을 위로 뻗고 오른손은 허리에 대세요. 발은 넓게 벌려 주세요.',{13:[-.43,-1.38],14:[.87,-.22],15:[-.5,-2.03],16:[.35,.2],25:[-.49,.94],26:[.49,.94],27:[-.75,1.63],28:[.75,1.63]},'medium'),
  makePose('side-stop','옆으로 멈춰','한 팔만 옆으로','화면 오른팔은 옆으로 뻗고 왼팔은 아래로 내려 주세요. 발은 가깝게 모으세요.',{13:[-.43,-.05],14:[.98,-.72],15:[-.5,.61],16:[1.61,-.72],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]},'medium'),
  makePose('side-lunge','사이드 런지','한쪽 무릎 굽히기','두 팔을 옆으로 펴고 화면 왼쪽 무릎을 굽혀 몸을 낮추세요. 오른다리는 옆으로 뻗으세요.',{13:[-.98,-.72],14:[.98,-.72],15:[-1.61,-.72],16:[1.61,-.72],25:[-.85,.65],26:[.7,.81],27:[-.84,1.37],28:[1.15,1.37]},'medium'),
  makePose('wide-squat','넓은 스쿼트','양 무릎 굽히기','두 손은 허리에 대고 발을 넓게 벌린 뒤 양 무릎을 바깥쪽으로 굽혀 주세요.',{13:[-.87,-.22],14:[.87,-.22],15:[-.35,.2],16:[.35,.2],25:[-.86,.64],26:[.86,.64],27:[-.86,1.36],28:[.86,1.36]},'medium'),
  makePose('archer','궁수','한 팔 뻗고 한 팔 접기','화면 왼팔은 옆으로 곧게 펴고 오른팔은 팔꿈치를 벌려 손이 어깨 가까이 오도록 접으세요.',{13:[-.98,-.72],14:[.96,-.43],15:[-1.61,-.72],16:[.42,-.94],25:[-.49,.94],26:[.49,.94],27:[-.75,1.63],28:[.75,1.63]},'medium'),
  makePose('side-bend','옆으로 기울기','몸통을 옆으로','발을 벌리고 몸통을 화면 왼쪽으로 기울이세요. 오른팔은 머리 위로, 왼손은 허리에 대세요.',{0:[-.52,-1.07],11:[-.66,-.57],12:[.02,-.82],13:[-.82,.09],14:[-.08,-1.47],15:[-.26,.37],16:[-.58,-1.9],25:[-.4,.95],26:[.4,.95],27:[-.57,1.65],28:[.57,1.65]},'medium'),
  makePose('one-stretch','한쪽 기지개','위아래로 길게','화면 오른팔을 머리 위로 뻗고 왼팔은 아래로 내리세요. 발은 가깝게 모으세요.',{13:[-.43,-.05],14:[.43,-1.38],15:[-.5,.61],16:[.5,-2.03],25:[-.2,.97],26:[.2,.97],27:[-.16,1.69],28:[.16,1.69]},'medium'),
  makePose('seagull','갈매기','팔꿈치를 높이','팔꿈치를 양옆 위로 들고 손은 바깥쪽 아래로 내려 날개를 접은 모양을 만드세요.',{13:[-.96,-1.01],14:[.96,-1.01],15:[-1.47,-.58],16:[1.47,-.58],25:[-.4,.95],26:[.4,.95],27:[-.57,1.65],28:[.57,1.65]},'medium'),
  makePose('crane','학다리 골인','한 발로 균형','양팔을 골인 자세로 들고 화면 왼쪽 무릎을 옆으로 올려 한 발로 서세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-1.37],25:[-.92,.42],26:[.3,.97],27:[-.92,1.12],28:[.35,1.69]},'hard'),
  makePose('one-cheer','외발 만세','한 발로 만세','양팔을 머리 위로 뻗고 화면 오른쪽 무릎을 옆으로 올려 한 발로 서세요.',{13:[-.43,-1.38],14:[.43,-1.38],15:[-.5,-2.03],16:[.5,-2.03],25:[-.3,.97],26:[.92,.42],27:[-.35,1.69],28:[.92,1.12]},'hard'),
  makePose('star-balance','별 균형','다리도 옆으로','양팔을 대각선 위로 펴고 화면 왼다리를 곧게 옆으로 들어 주세요.',{13:[-.91,-1.16],14:[.91,-1.16],15:[-1.4,-1.58],16:[1.4,-1.58],25:[-.82,.7],26:[.3,.97],27:[-1.39,1.15],28:[.35,1.69]},'hard'),
  makePose('one-robot','외발 로봇','로봇 균형 잡기','양팔을 옆으로 들고 손을 아래로 접으세요. 화면 오른쪽 무릎을 옆으로 올리세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-.07],16:[1,-.07],25:[-.3,.97],26:[.92,.42],27:[-.35,1.69],28:[.92,1.12]},'hard'),
  makePose('lunge-lightning','런지 번개','낮게 번개 자세','화면 왼쪽 무릎을 굽히고 오른다리는 옆으로 뻗으세요. 왼팔은 위로, 오른팔은 옆으로 펴세요.',{13:[-.43,-1.38],14:[.98,-.72],15:[-.5,-2.03],16:[1.61,-.72],25:[-.9,.56],26:[.753,.765],27:[-.9,1.28],28:[1.256,1.28]},'hard'),
  makePose('low-keeper','낮은 골키퍼','낮게 앉아 골인','발을 넓게 벌리고 무릎을 바깥으로 굽혀 몸을 낮추세요. 양팔은 골인 자세를 만드세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-1.37],25:[-.94,.47],26:[.94,.47],27:[-.94,1.19],28:[.94,1.19]},'hard'),
  makePose('tilted-wings','기울어진 날개','몸과 팔을 기울여요','다리를 벌리고 몸통을 화면 왼쪽으로 기울이세요. 왼팔은 아래 대각선, 오른팔은 위 대각선으로 펴세요.',{0:[-.64,-1.02],11:[-.73,-.51],12:[-.05,-.82],13:[-1.32,-.22],14:[.56,-1.1],15:[-1.9,.07],16:[1.16,-1.38],25:[-.6,.88],26:[.6,.88],27:[-.95,1.51],28:[.95,1.51]},'hard'),
  makePose('tree','나무 균형','발을 안쪽으로','양팔을 대각선 위로 펴세요. 화면 오른쪽 무릎을 옆으로 벌리고 오른발을 왼쪽 무릎 안쪽 가까이 들어 주세요.',{13:[-.91,-1.16],14:[.91,-1.16],15:[-1.4,-1.58],16:[1.4,-1.58],25:[-.3,.97],26:[.86,.64],27:[-.35,1.69],28:[.2,.94]},'hard'),
  makePose('zigzag-balance','지그재그 균형','팔과 다리를 다르게','화면 왼손은 위로 접고 오른손은 아래로 접으세요. 화면 왼쪽 무릎을 옆으로 올려 균형을 잡으세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-.07],25:[-.92,.42],26:[.3,.97],27:[-.92,1.12],28:[.35,1.69]},'hard'),
  makePose('side-kick-hold','사이드 킥 홀드','다리를 수평으로','화면 왼다리를 무릎을 편 채 골반 높이로 들어 옆으로 뻗으세요. 양팔은 팔꿈치를 벌려 위로 접으세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-1.37],25:[-.97,.25],26:[.3,.97],27:[-1.69,.25],28:[.35,1.69]},'expert'),
  makePose('high-knee-lightning','하이니 번개','무릎을 골반 위로','화면 오른쪽 무릎을 골반보다 높게 옆으로 들어 주세요. 왼팔은 위로, 오른팔은 옆으로 펴세요.',{13:[-.43,-1.38],14:[.98,-.72],15:[-.5,-2.03],16:[1.61,-.72],25:[-.3,.97],26:[.90,-.06],27:[-.35,1.69],28:[1.05,.64]},'expert'),
  makePose('low-crane','로우 크레인','지지하는 무릎도 굽히기','화면 왼쪽 무릎을 옆으로 들고, 지지하는 오른쪽 무릎도 굽혀 몸을 낮추세요. 양팔은 옆으로 펴세요.',{13:[-.98,-.72],14:[.98,-.72],15:[-1.61,-.72],16:[1.61,-.72],25:[-.94,.05],26:[.82,.69],27:[-1.08,.76],28:[.30,1.20]},'expert'),
  makePose('deep-side-lunge','딥 사이드 런지','골반을 더 낮게','화면 왼쪽 무릎을 깊게 굽히고 오른다리는 길게 옆으로 펴세요. 왼손은 허리에, 오른팔은 머리 위로 올리세요.',{13:[-.87,-.22],14:[.43,-1.38],15:[-.35,.2],16:[.5,-2.03],25:[-.97,.25],26:[.874,.61],27:[-.97,.97],28:[1.498,.97]},'expert'),
  makePose('deep-squat-reach','딥 스쿼트 만세','낮은 자세와 높은 팔','발을 넓게 벌려 골반이 무릎 높이 가까이 오도록 낮추세요. 양팔은 머리 위로 뻗으세요.',{13:[-.43,-1.38],14:[.43,-1.38],15:[-.5,-2.03],16:[.5,-2.03],25:[-.97,.33],26:[.97,.33],27:[-.97,1.05],28:[.97,1.05]},'expert'),
  makePose('tilted-crane','사선 크레인','기울인 채 한 발로','몸통을 화면 왼쪽으로 기울이고 오른쪽 무릎을 옆으로 드세요. 왼팔은 아래 대각선, 오른팔은 위 대각선으로 펴세요.',{0:[-.64,-1.02],11:[-.73,-.51],12:[-.05,-.82],13:[-1.32,-.22],14:[.56,-1.1],15:[-1.9,.07],16:[1.16,-1.38],25:[-.3,.97],26:[.94,.05],27:[-.35,1.69],28:[1.08,.76]},'expert'),
  makePose('y-balance','Y자 균형','다리를 높게 옆으로','양팔을 머리 위로 뻗고 화면 오른다리를 곧게 옆으로 높이 들어 주세요.',{13:[-.43,-1.38],14:[.43,-1.38],15:[-.5,-2.03],16:[.5,-2.03],25:[-.3,.97],26:[.95,.42],27:[-.35,1.69],28:[1.65,.59]},'expert'),
  makePose('half-moon','반달 균형','몸통과 다리로 균형','왼발로 서서 몸통을 화면 왼쪽으로 크게 기울이고 오른다리는 옆으로 곧게 드세요. 왼팔은 아래로, 오른팔은 위로 펴세요.',{0:[-1.01,-.76],11:[-.941,-.181],12:[-.431,-.691],23:[-.177,.427],24:[.177,.073],13:[-.86,.48],14:[-.30,-1.35],15:[-.78,1.14],16:[-.17,-2.01],25:[-.30,1.137],26:[.89,.17],27:[-.42,1.847],28:[1.61,.27]},'expert'),
  makePose('high-passe','하이 파세','높게 접은 다리','화면 오른쪽 무릎을 옆으로 높게 들고 발을 골반 아래 가까이 접으세요. 왼팔은 옆으로, 오른팔은 머리 위로 뻗으세요.',{13:[-.98,-.72],14:[.43,-1.38],15:[-1.61,-.72],16:[.5,-2.03],25:[-.3,.97],26:[.94,.05],27:[-.35,1.69],28:[.35,.46]},'expert'),
  makePose('low-side-kick','로우 사이드 킥','낮게 앉아 다리 뻗기','화면 오른쪽 무릎을 굽혀 몸을 낮추고 왼다리는 골반 높이에서 옆으로 곧게 드세요. 왼손은 위로, 오른손은 아래로 접으세요.',{13:[-1,-.72],14:[1,-.72],15:[-1,-1.37],16:[1,-.07],25:[-.97,.25],26:[.82,.69],27:[-1.69,.25],28:[.30,1.20]},'expert')
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
  constructor({random=Math.random,...options}={}){this.random=random;this.playerCount=2;this.totalRounds=5;this.poseOffset=null;this.difficulty="all";this.reset(options);}
  reset({playerCount=this.playerCount,totalRounds=this.totalRounds,poseOffset=this.poseOffset,difficulty=this.difficulty}={}){
    if(!['all',...Object.keys(DIFFICULTIES)].includes(difficulty)||![1,2].includes(playerCount)||![1,3,5].includes(totalRounds)||(poseOffset!==null&&(!Number.isInteger(poseOffset)||poseOffset<0||poseOffset>=POSES.length)))throw new RangeError('Invalid game settings');
    if(poseOffset!==null&&difficulty!=='all'&&POSES[poseOffset].difficulty!==difficulty)throw new RangeError('Starting pose is outside selected difficulty');
    this.playerCount=playerCount;this.totalRounds=totalRounds;this.poseOffset=poseOffset;this.difficulty=difficulty;
    this.poseOrder=POSES.map((_,i)=>i).filter(i=>i!==poseOffset&&(difficulty==='all'||POSES[i].difficulty===difficulty));
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
  const n=xy(0);s+=`<path d="M${(xy(11).x+xy(12).x)/2} ${(xy(11).y+xy(12).y)/2}L${n.x} ${n.y+15}"/></g><circle cx="${n.x}" cy="${n.y-2}" r="18" fill="#243512"/>`;
  for(const i of REQUIRED){const a=xy(i);s+=`<circle cx="${a.x}" cy="${a.y}" r="4.3" fill="#d9ff58" stroke="#243512" stroke-width="1.5"/>`;}
  return s+'</svg>';
}
