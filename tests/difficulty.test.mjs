import test from 'node:test';
import assert from 'node:assert/strict';
import {POSES,DIFFICULTIES,MatchEngine,REQUIRED,scorePose} from '../dist/game-core.mjs';

test('each tier contains ten distinct, drawable and scoreable poses',()=>{
  assert.equal(POSES.length,40);
  for(const difficulty of Object.keys(DIFFICULTIES)){
    const poses=POSES.filter(p=>p.difficulty===difficulty);
    assert.equal(poses.length,10);assert.equal(new Set(poses.map(p=>p.id)).size,10);
    for(const p of poses){
      assert.equal(scorePose(p.points,p),100);
      for(const i of REQUIRED)assert.ok(p.points[i]&&Number.isFinite(p.points[i].x)&&Number.isFinite(p.points[i].y));
      if(['side-lunge','lunge-lightning','wide-squat','low-keeper'].includes(p.id))assert.equal(p.points[27].y,p.points[28].y,'grounded poses keep both feet on the floor');
      // Limbs must stay human-proportioned and cannot collapse to zero-length edges.
      for(const [a,b] of [[11,13],[13,15],[12,14],[14,16],[23,25],[25,27],[24,26],[26,28]]){
        const length=Math.hypot(p.points[a].x-p.points[b].x,p.points[a].y-p.points[b].y);
        assert.ok(length>.5&&length<.85,`${p.id}: ${a}-${b} length ${length}`);
      }
    }
  }
});
for(const playerCount of [1,2])for(const difficulty of ['all','expert','hard','medium','easy']){
  test(`${playerCount}-player ${difficulty} random completes five distinct poses from only that pool`,()=>{
    const g=new MatchEngine({playerCount,difficulty,random:()=>.37});
    assert.equal(g.poseOffset,null);assert.equal(g.poseOrder.length,difficulty==='all'?40:10);
    assert.equal(new Set(g.poseOrder).size,g.poseOrder.length);
    const pool=POSES.map((p,i)=>({p,i})).filter(({p})=>difficulty==='all'||p.difficulty===difficulty).map(({i})=>i);
    assert.deepEqual([...g.poseOrder].sort((a,b)=>a-b),pool);
    for(let n=0;n<5;n++){
      const now=n*9000;assert.equal(g.advance(now,{allReady:true}),'prepare');
      const target=g.poseIndex;
      assert.ok(pool.includes(target));
      assert.equal(g.advance(now+3000,{allReady:true}),'playing');
      for(const offset of [3100,3300,3500])g.sample(Array(playerCount).fill(95),now+offset);
      assert.equal(g.tick(now+8000),n===4?'finished':'result');
    }
    assert.equal(new Set(g.rounds.map(r=>r.pose)).size,5);
    g.reset();assert.equal(g.difficulty,difficulty);assert.equal(g.phase,'ready');
    g.reset({playerCount:playerCount===1?2:1,totalRounds:3});assert.equal(g.difficulty,difficulty);
  });
}
test('difficulty selection resets previous rounds and allows returning to all random',()=>{
  const g=new MatchEngine({poseOffset:0});
  g.reset({poseOffset:null,difficulty:'hard'});
  assert.ok(g.poseOrder.every(i=>POSES[i].difficulty==='hard'));
  const current=g.poseIndex;g.advance(0,{allReady:true});g.advance(3000,{allReady:true});
  assert.equal(g.tick(8000),'retry');g.advance(9000,{allReady:true});assert.equal(g.poseIndex,current);
  g.reset({poseOffset:null,difficulty:'all'});assert.equal(g.poseOrder.length,40);
  g.reset({poseOffset:29,difficulty:'all'});assert.equal(g.poseIndex,29);
  assert.throws(()=>g.reset({poseOffset:0,difficulty:'hard'}),RangeError);
  assert.throws(()=>g.reset({difficulty:'unknown'}),RangeError);
});
