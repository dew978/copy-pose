import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine,POSES,assignPlayers,scorePose,poseSVG,REQUIRED} from '../dist/game-core.mjs';

for(const playerCount of [1,2])test(`${playerCount}-player mode starts after exactly one three-second countdown`,()=>{
  const g=new MatchEngine({playerCount,totalRounds:1});
  assert.equal(g.advance(0,{allReady:false}),null);
  assert.equal(g.phase,'ready');
  assert.equal(g.advance(100,{allReady:true}),'prepare');
  assert.equal(g.advance(3099,{allReady:true}),null);
  assert.equal(g.advance(3100,{allReady:true}),'playing');
  assert.equal(g.end,8100);
  for(const t of [3200,3400,3600])g.sample(Array(playerCount).fill(91),t);
  assert.equal(g.advance(8100,{allReady:true}),'finished');
  assert.equal(g.advance(20000,{allReady:true}),null);
  assert.equal(g.phase,'finished'); // Never erase a final result by auto-restarting.
});
test('two-player countdown waits for both actual full-body detections',()=>{
  const raw=cx=>POSES[0].points.map(p=>p?{...p,x:1-(p.x*70+cx)/1280,y:(p.y*70+330)/720}:null);
  const g=new MatchEngine({playerCount:2,totalRounds:1});
  const detected=poses=>assignPlayers(poses,1280,720,2).every(p=>p?.complete);
  assert.equal(g.advance(0,{allReady:detected([raw(320)])}),null);
  assert.equal(g.advance(100,{allReady:detected([raw(320),raw(960)])}),'prepare');
  assert.equal(g.advance(1100,{allReady:detected([raw(320)])}),'waiting');
  assert.equal(g.advance(2100,{allReady:detected([raw(320),raw(960)])}),'prepare');
  assert.equal(g.advance(5100,{allReady:true}),'playing');
});
test('lost recognition at the deadline cancels; returning restarts all three seconds',()=>{
  const g=new MatchEngine({playerCount:1});
  g.advance(0,{allReady:true});
  const target=g.poseIndex;
  assert.equal(g.advance(3000,{allReady:false}),'waiting');
  assert.equal(g.rounds.length,0);
  assert.equal(g.advance(3200,{allReady:true}),'prepare');
  assert.equal(g.poseIndex,target);
  assert.equal(g.advance(6199,{allReady:true}),null);
  assert.equal(g.advance(6200,{allReady:true}),'playing');
});
test('background tab cannot start and cannot finish a preparation countdown',()=>{
  const g=new MatchEngine();
  assert.equal(g.advance(0,{allReady:true,visible:false}),null);
  assert.equal(g.advance(10,{allReady:true,visible:true}),'prepare');
  assert.equal(g.advance(3010,{allReady:true,visible:false}),'waiting');
  assert.equal(g.phase,'ready');
});
test('results hold, then next round automatically prepares without duplicate starts',()=>{
  const g=new MatchEngine({totalRounds:3});
  g.advance(0,{allReady:true});g.advance(3000,{allReady:true});
  for(const t of [3100,3300,3500])g.sample([90,70],t);
  assert.equal(g.advance(8000,{allReady:true}),'result');
  assert.equal(g.advance(12999,{allReady:true,notBefore:13000}),null);
  assert.equal(g.advance(13000,{allReady:true,notBefore:13000}),'prepare');
  assert.equal(g.index,1);assert.equal(g.rounds.length,1);
  assert.equal(g.advance(13001,{allReady:true}),null);
  assert.equal(g.end,16000);
});
test('an invalid round automatically retries the same pose with clean scores',()=>{
  const g=new MatchEngine({playerCount:1,totalRounds:1});
  g.advance(0,{allReady:true});g.advance(3000,{allReady:true});g.sample([99],3200);
  assert.equal(g.advance(8000,{allReady:true}),'retry');const pose=g.poseIndex;
  assert.equal(g.advance(10500,{allReady:true,notBefore:10500}),'prepare');
  assert.equal(g.poseIndex,pose);assert.equal(g.windows[0].best,null);assert.equal(g.rounds.length,0);
});
test('ten drawable distinct targets cover all joints and score exactly 100',()=>{
  assert.equal(POSES.length,10);assert.equal(new Set(POSES.map(p=>p.id)).size,10);
  assert.equal(new Set(POSES.map(p=>JSON.stringify(p.points))).size,10);
  for(const pose of POSES){
    assert.equal(scorePose(pose.points,pose),100);
    for(const i of REQUIRED){assert.ok(pose.points[i]);const {x,y}=pose.points[i];assert.ok(150+x*68>6&&150+x*68<294);assert.ok(151+y*68>6&&151+y*68<279);}
    assert.ok(!/NaN|undefined/.test(poseSVG(pose)));
  }
});
test('duel uses all ten pose candidates without repeats; practice can select all ten',()=>{
  const g=new MatchEngine({random:()=>0,totalRounds:5});
  assert.equal(g.poseOrder.length,10);assert.equal(new Set(g.poseOrder).size,10);
  assert.ok(g.poseOrder.slice(0,5).some(i=>i>=5));
  assert.notDeepEqual(g.poseOrder,POSES.map((_,i)=>i));
  for(let offset=0;offset<10;offset++){
    const practice=new MatchEngine({playerCount:1,poseOffset:offset});assert.equal(practice.poseIndex,offset);
    assert.equal(new Set(practice.poseOrder).size,10);
  }
});
