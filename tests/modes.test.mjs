import test from 'node:test';
import assert from 'node:assert/strict';
import {POSES,assignPlayers,MatchEngine,practiceResult,matchResult} from '../dist/game-core.mjs';

function completeRound(game,now,scores){
  assert.equal(game.prepare(now),true);
  assert.equal(game.tick(now+2999),null);
  assert.equal(game.tick(now+3000),'playing');
  for(const t of [3100,3280,3460])game.sample(scores,now+t);
  assert.equal(game.tick(now+7999),null);
  return game.tick(now+8000);
}
for(const playerCount of [1,2])for(const totalRounds of [1,3,5]){
  test(`${playerCount} players complete exactly ${totalRounds} rounds`,()=>{
    const game=new MatchEngine({playerCount,totalRounds});
    for(let i=0;i<totalRounds;i++){
      const scores=playerCount===1?[90-i]:[90-i,60];
      assert.equal(completeRound(game,i*9000,scores),i===totalRounds-1?'finished':'result');
      assert.equal(game.rounds[i].scores.length,playerCount);
    }
    assert.equal(game.rounds.length,totalRounds);
    assert.equal(game.prepare(totalRounds*9000),false);
    if(playerCount===1)assert.deepEqual(practiceResult(game.rounds),{average:90-(totalRounds-1)/2,best:90,completed:totalRounds});
    else assert.deepEqual(matchResult(game.rounds).wins,[totalRounds,0]);
    game.reset();assert.equal(game.totalRounds,totalRounds);assert.equal(game.playerCount,playerCount);assert.equal(game.rounds.length,0);assert.equal(game.windows.length,playerCount);
  });
}
test('practice accepts a centered or off-center body without an opponent',()=>{
  for(const cx of [320,640,960]){
    const raw=POSES[0].points.map(p=>p?{...p,x:1-(p.x*70+cx)/1280,y:(p.y*70+330)/720}:null);
    const slots=assignPlayers([raw],1280,720,1);assert.equal(slots.length,1);assert.equal(slots[0].complete,true);
  }
  assert.deepEqual(assignPlayers([],1280,720,1),[null]);
});
test('practice missing tracking retries and cannot record a score from a single frame',()=>{
  const g=new MatchEngine({playerCount:1,totalRounds:1});g.prepare(0);g.tick(3000);g.sample([99],3100);g.sample([],3400);assert.equal(g.tick(8000),'retry');assert.equal(g.rounds.length,0);
  assert.equal(completeRound(g,9000,[83]),'finished');assert.equal(practiceResult(g.rounds).best,83);
});
test('chosen start pose is followed by random distinct poses and reset clears old results',()=>{
  const g=new MatchEngine({playerCount:1,totalRounds:3,poseOffset:9,random:()=>0});
  for(let i=0;i<3;i++)completeRound(g,i*9000,[75]);
  assert.deepEqual(g.rounds.map(r=>r.pose),[POSES[9].id,POSES[1].id,POSES[2].id]);
  g.reset({playerCount:2,totalRounds:1,poseOffset:0});assert.equal(g.index,0);assert.equal(g.poseOffset,0);assert.ok(g.poseIndex>=0&&g.poseIndex<POSES.length);assert.equal(g.phase,'ready');assert.equal(g.windows.length,2);assert.ok(g.windows.every(w=>w.best===null));assert.deepEqual(g.rounds,[]);
});
for(const playerCount of [1,2])test(`${playerCount}-player defaults to random and can select or restore a random start`,()=>{
  let randomValue=0;
  const g=new MatchEngine({playerCount,random:()=>randomValue});
  assert.equal(g.poseOffset,null);assert.equal(g.poseIndex,1);
  assert.equal(new Set(g.poseOrder).size,POSES.length);
  const previous=[...g.poseOrder];randomValue=.999;g.reset();
  assert.equal(g.poseOffset,null);assert.notDeepEqual(g.poseOrder,previous);
  for(let poseOffset=0;poseOffset<POSES.length;poseOffset++){
    g.reset({poseOffset});assert.equal(g.poseIndex,poseOffset);
    assert.equal(new Set(g.poseOrder).size,POSES.length);
  }
  g.reset({poseOffset:null});assert.equal(g.poseOffset,null);assert.equal(g.poseIndex,0);
  g.reset({playerCount:playerCount===1?2:1});assert.equal(g.poseOffset,null);
});
test('unsupported configurations are rejected',()=>{
  for(const options of [{playerCount:0},{playerCount:3},{totalRounds:2},{poseOffset:POSES.length}])assert.throws(()=>new MatchEngine(options),RangeError);
});
