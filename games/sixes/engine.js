const sixesGame = window.sixesGame = (()=>{

/*
  4 players: A, B, C, D (index 0-3)
  18 holes: segments of 6 holes, 3 rotations
  9 holes:  segments of 3 holes, 3 rotations

  Rotation (player indices):
  Seg 1: [0,1] vs [2,3]
  Seg 2: [0,2] vs [1,3]
  Seg 3: [0,3] vs [1,2]
*/

let segmentLength = 6; // 6 for 18 holes, 3 for 9 holes
let segmentScores = [0, 0, 0]; // points per segment for team A vs B
// segmentScores[seg] > 0 means team A won that segment
// segmentScores[seg] < 0 means team B won that segment
let holeScores    = {}; // { hole: { teamA: score, teamB: score } }

function reset(holes){
segmentLength  = holes === 18 ? 6 : 3;
segmentScores  = [0, 0, 0];
holeScores     = {};
}

// Get current teams for a given hole (1-indexed)
function getTeams(hole, players){
const seg = Math.ceil(hole / segmentLength) - 1; // 0, 1, or 2
const rotations = [
[[0,1],[2,3]],
[[0,2],[1,3]],
[[0,3],[1,2]]
];
const rot = rotations[seg] || rotations[0];
return {
teamA: [players[rot[0][0]], players[rot[0][1]]],
teamB: [players[rot[1][0]], players[rot[1][1]]],
segment: seg + 1
};
}

// Record hole result — bestball per team
// Returns { winner: "A"|"B"|"tie", segmentDone: bool, segWinner: "A"|"B"|"tie"|null }
function recordHole(hole, scoreA, scoreB, players, wager, ledger){
const seg = Math.ceil(hole / segmentLength) - 1;

if(scoreA < scoreB){
segmentScores[seg]++;
} else if(scoreB < scoreA){
segmentScores[seg]--;
}

holeScores[hole] = { teamA: scoreA, teamB: scoreB };

const segmentDone = (hole % segmentLength === 0);
let segWinner = null;

if(segmentDone){
const { teamA, teamB } = getTeams(hole, players);
const s = segmentScores[seg];

if(s > 0){
// Team A wins segment
teamA.forEach(p => ledger[p] += wager);
teamB.forEach(p => ledger[p] -= wager);
segWinner = "A";
} else if(s < 0){
// Team B wins segment
teamB.forEach(p => ledger[p] += wager);
teamA.forEach(p => ledger[p] -= wager);
segWinner = "B";
} else {
segWinner = "tie";
}
}

return { segmentDone, segWinner };
}

function getState(){
return { segmentLength, segmentScores: [...segmentScores], holeScores: {...holeScores} };
}

function setState(state){
segmentLength  = state.segmentLength;
segmentScores  = [...state.segmentScores];
holeScores     = {...state.holeScores};
}

return { reset, getTeams, recordHole, getState, setState };

})();

registerGame("sixes", sixesGame);