import test from 'node:test';
import assert from 'node:assert/strict';
import {POSES,scorePose,assignPlayers,ScoreWindow,MatchEngine,matchResult,poseSVG} from '../dist/game-core.mjs';

test('all ten reference diagrams score exactly 100 against themselves',()=>{
  assert.equal(POSES.length,10);
  for(const p of POSES){assert.equal(scorePose(p.points,p),100);assert.match(poseSVG(p),/^<svg/);}
});
test('score is invariant to body scale and screen translation',()=>{
  for(const pose of POSES){const moved=pose.points.map(p=>p?{...p,x:p.x*97+632,y:p.y*97+340}:null);assert.equal(scorePose(moved,pose),100);}
});
test('different poses and opposite asymmetric poses are penalized',()=>{
  assert.ok(scorePose(POSES[1].points,POSES[2])<85);
  const p=POSES[3];const reversed=p.points.map(a=>a?{...a,x:-a.x}:null);
  assert.ok(scorePose(reversed,p)<70);
});
test('low-confidence or missing limbs never receive a fabricated score',()=>{
  const p=structuredClone(POSES[0].points);p[27].visibility=.2;assert.equal(scorePose(p,POSES[0]),null);p[27]=null;assert.equal(scorePose(p,POSES[0]),null);
});
test('screen mirroring and aspect correction preserve score and slot identity',()=>{
  const width=1280,height=720;
  const rawFor=(pose,cx)=>pose.points.map(p=>p?{...p,x:1-(p.x*90+cx)/width,y:(p.y*90+330)/height}:null);
  const left=rawFor(POSES[3],320),right=rawFor(POSES[3],960);
  for(const inputs of [[left,right],[right,left]]){
    const slots=assignPlayers(inputs,width,height);assert.ok(slots.every(s=>s.complete));assert.equal(scorePose(slots[0].points,POSES[3]),100);assert.equal(scorePose(slots[1].points,POSES[3]),100);assert.ok(slots[0].points[23].x<640);assert.ok(slots[1].points[23].x>640);
  }
  assert.equal(assignPlayers([rawFor(POSES[0],640)],width,height).filter(Boolean).length,0);
});
test('a single lucky frame cannot win: require sustained average',()=>{
  const w=new ScoreWindow();w.add(100,0);assert.equal(w.best,null);w.add(30,180);assert.equal(w.best,null);w.add(30,360);assert.equal(w.best,53.3);w.add(null,400);w.add(100,1000);assert.equal(w.best,53.3);
});
test('tracking gaps reset the averaging window',()=>{
  const w=new ScoreWindow();w.add(100,0);w.add(100,180);w.add(100,900);assert.equal(w.best,null);w.add(100,1080);w.add(100,1260);assert.equal(w.best,100);
});
test('match runs every one of five rounds, even after three wins',()=>{
  const g=new MatchEngine();let now=0;
  for(let i=0;i<5;i++){
    assert.ok(g.prepare(now));assert.equal(g.index,i);assert.equal(g.tick(now+2999),null);assert.equal(g.tick(now+3000),'playing');
    g.sample([91,70],now+3100);g.sample([91,70],now+3280);g.sample([91,70],now+3460);
    assert.equal(g.tick(now+7999),null);assert.equal(g.tick(now+8000),i===4?'finished':'result');now+=9000;
  }
  assert.equal(g.rounds.length,5);assert.equal(g.prepare(now),false);assert.deepEqual(matchResult(g.rounds).wins,[5,0]);
});
test('tracking failure repeats current round and resets previous samples',()=>{
  const g=new MatchEngine();g.prepare(0);g.tick(3000);[3100,3300,3500].forEach(t=>g.sample([85,null],t));assert.equal(g.tick(8000),'retry');assert.equal(g.rounds.length,0);g.prepare(9000);assert.equal(g.index,0);assert.equal(g.windows[0].best,null);
});
test('late samples cannot alter an expired round',()=>{
  const g=new MatchEngine();g.prepare(0);g.tick(3000);g.sample([100,100],8001);assert.equal(g.windows[0].best,null);
});
test('tied round wins use mean score, then share victory on an exact tie',()=>{
  const make=scores=>({scores});
  const result=matchResult([[100,50],[51,70],[90,50],[51,60],[80,80]].map(make));assert.deepEqual(result.wins,[2,2]);assert.equal(result.winner,0);assert.equal(result.tiedWins,true);
  assert.equal(matchResult([[90,80],[80,90],[90,80],[80,90],[80,80]].map(make)).winner,null);
});
