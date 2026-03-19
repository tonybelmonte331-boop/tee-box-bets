const baseballGame = window.baseballGame = (()=>{

// 9 innings, each stored as { away: runs, home: runs } or null if not yet played
let innings = Array(9).fill(null).map(() => ({ away: null, home: null }));

function reset(){
innings = Array(9).fill(null).map(() => ({ away: null, home: null }));
}

/*
  hole  = 1-18 (1-indexed)
  odd holes  = top of inning   (Away bats)
  even holes = bottom of inning (Home bats)

  1v1:  scoreA/scoreB = individual strokes
  2v2:  scoreA/scoreB = combined team strokes (passed in already summed from ui.js)

  Only the BATTING team can score runs.
  Runs = opponent score - batting team score  (if positive, else 0)
  Birdie = runs × 2
*/
function recordHole(hole, scoreA, scoreB, birdie, wager, teams, ledger){

const inning  = Math.ceil(hole / 2) - 1; // 0-indexed
const isTop   = hole % 2 === 1;           // odd = Away bats

let runs = 0;

if(isTop){
// Away is batting — Away scores if their strokes < Home strokes
runs = Math.max(scoreB - scoreA, 0);
if(birdie && runs > 0) runs *= 2;
innings[inning].away = runs;

if(runs > 0){
teams.A.forEach(p => ledger[p] += runs * wager);
teams.B.forEach(p => ledger[p] -= runs * wager);
}

} else {
// Home is batting — Home scores if their strokes < Away strokes
runs = Math.max(scoreA - scoreB, 0);
if(birdie && runs > 0) runs *= 2;
innings[inning].home = runs;

if(runs > 0){
teams.B.forEach(p => ledger[p] += runs * wager);
teams.A.forEach(p => ledger[p] -= runs * wager);
}
}
}

function getScoreboard(){
return innings;
}

function getState(){
return { innings: JSON.parse(JSON.stringify(innings)) };
}

function setState(state){
innings = JSON.parse(JSON.stringify(state.innings));
}

return {
reset,
recordHole,
getScoreboard,
getState,
setState
};

})();

registerGame("baseball", baseballGame);
