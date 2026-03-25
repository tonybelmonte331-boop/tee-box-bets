const nineGame = window.nineGame = (()=>{

let points = {}; // { playerName: totalPoints }

function reset(){
points = {};
}

function initPlayers(players){
players.forEach(p => points[p] = 0);
}

/*
  Award points for one hole to 3 players based on scores.
  Handles all tie cases with split points.
  Distribution: 1st=5, 2nd=3, 3rd=1 (total always = 9)
*/
function awardHole(scores, players){
// scores = { playerName: grossScore }
const sorted = [...players].sort((a,b) => scores[a] - scores[b]);
const s = players.map(p => scores[p]);
const vals = [5, 3, 1];
const awarded = {};

// 3-way tie
if(scores[sorted[0]] === scores[sorted[1]] && scores[sorted[1]] === scores[sorted[2]]){
players.forEach(p => {
awarded[p] = 3; // (5+3+1)/3
points[p] += 3;
});
return awarded;
}

// 2-way tie for 1st
if(scores[sorted[0]] === scores[sorted[1]]){
[sorted[0], sorted[1]].forEach(p => {
awarded[p] = 4; // (5+3)/2
points[p] += 4;
});
awarded[sorted[2]] = 1;
points[sorted[2]] += 1;
return awarded;
}

// 2-way tie for 2nd
if(scores[sorted[1]] === scores[sorted[2]]){
awarded[sorted[0]] = 5;
points[sorted[0]] += 5;
[sorted[1], sorted[2]].forEach(p => {
awarded[p] = 2; // (3+1)/2
points[p] += 2;
});
return awarded;
}

// No ties
sorted.forEach((p, i) => {
awarded[p] = vals[i];
points[p] += vals[i];
});
return awarded;
}

// End of round: settle ledger based on point differences
function settle(players, wager, ledger){
for(let i = 0; i < players.length; i++){
for(let j = i + 1; j < players.length; j++){
const a = players[i], b = players[j];
const diff = (points[a] || 0) - (points[b] || 0);
if(diff > 0){
ledger[a] += diff * wager;
ledger[b] -= diff * wager;
} else if(diff < 0){
ledger[b] += Math.abs(diff) * wager;
ledger[a] -= Math.abs(diff) * wager;
}
}
}
}

function getPoints(){ return { ...points }; }

function getState(){ return { points: { ...points } }; }

function setState(state){ points = { ...state.points }; }

return { reset, initPlayers, awardHole, settle, getPoints, getState, setState };

})();

registerGame("nine", nineGame);