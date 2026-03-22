const battleGame = window.battleGame = (()=>{

let playerHandicaps = {};
let courseHandicaps = {};
let holeHandicaps   = [];
let grossScores     = {};
let netScores       = {};
let payoutMode      = "flat";
let isNineHole      = false;
let halfForNine     = false; // when true, halves handicap for 9-hole rounds
let teamMode        = false; // 2v2 team mode

function reset(){
playerHandicaps = {};
courseHandicaps = {};
holeHandicaps   = [];
grossScores     = {};
netScores       = {};
}

function setPlayers(players, handicaps, nineHole){
isNineHole = !!nineHole;
players.forEach(p => {
playerHandicaps[p] = handicaps[p] || 0;
grossScores[p]     = [];
netScores[p]       = 0;
});
}

function setTeamMode(enabled){ teamMode = enabled; }
function getTeamMode(){ return teamMode; }

function setHalfForNine(val){ halfForNine = !!val; }

function setCourseHandicaps(rating, slope){
Object.keys(playerHandicaps).forEach(p => {
let idx = playerHandicaps[p];
if(isNineHole && halfForNine) idx = idx / 2;
courseHandicaps[p] = Math.round(idx * slope / 113);
});
}

function setHoleHandicaps(holes){
holeHandicaps = holes.map(h => (typeof h === "object" ? h.handicap : h) || 0);
}

function strokesForHole(player, holeIndex){
const ch        = courseHandicaps[player] || 0;
const numHoles  = isNineHole ? 9 : 18;

if(!holeHandicaps.length){
// Even distribution
// First pass: holes 0..(numHoles-1) each get 1 stroke if holeIndex < ch
// Second pass: if ch > numHoles, hardest holes (lowest index) get a 2nd stroke
const firstPass  = holeIndex < Math.min(ch, numHoles) ? 1 : 0;
const secondPass = ch > numHoles && holeIndex < (ch - numHoles) ? 1 : 0;
return firstPass + secondPass;
} else {
// Difficulty-based distribution
const difficulty = holeHandicaps[holeIndex] || (holeIndex + 1);
const firstPass  = difficulty <= Math.min(ch, numHoles) ? 1 : 0;
const secondPass = ch > numHoles && difficulty <= (ch - numHoles) ? 1 : 0;
return firstPass + secondPass;
}
}

function recordHole(holeIndex, scores){
Object.keys(scores).forEach(p => {
grossScores[p].push(scores[p]);
const strokes = strokesForHole(p, holeIndex);
netScores[p] = (netScores[p] || 0) + (scores[p] - strokes);
});
}

function settle(players, wager, ledger, teams){
if(teamMode && teams){
// Team net = sum of both players' net scores
const netA = (netScores[teams.A[0]]||0) + (netScores[teams.A[1]]||0);
const netB = (netScores[teams.B[0]]||0) + (netScores[teams.B[1]]||0);
const diff = netA - netB;
if(diff < 0){
// A wins
if(payoutMode === "flat"){
teams.A.forEach(p => ledger[p] += wager);
teams.B.forEach(p => ledger[p] -= wager);
} else {
teams.A.forEach(p => ledger[p] += Math.abs(diff) * wager);
teams.B.forEach(p => ledger[p] -= Math.abs(diff) * wager);
}
} else if(diff > 0){
if(payoutMode === "flat"){
teams.B.forEach(p => ledger[p] += wager);
teams.A.forEach(p => ledger[p] -= wager);
} else {
teams.B.forEach(p => ledger[p] += Math.abs(diff) * wager);
teams.A.forEach(p => ledger[p] -= Math.abs(diff) * wager);
}
}
} else {
// FFA — each pair settles
if(payoutMode === "flat"){
// Find lowest net score
const minNet = Math.min(...players.map(p => netScores[p]));
const winners = players.filter(p => netScores[p] === minNet);
const losers  = players.filter(p => netScores[p] !== minNet);

if(winners.length === players.length){
// Everyone tied — no money moves
} else {
const totalPot   = wager * losers.length;
const splitShare = totalPot / winners.length;
winners.forEach(p => ledger[p] += splitShare);
losers.forEach(p  => ledger[p] -= wager);
}
} else {
for(let i = 0; i < players.length; i++){
for(let j = i+1; j < players.length; j++){
const a = players[i], b = players[j];
const diff = netScores[a] - netScores[b];
if(diff < 0){
ledger[a] += Math.abs(diff) * wager;
ledger[b] -= Math.abs(diff) * wager;
} else if(diff > 0){
ledger[b] += Math.abs(diff) * wager;
ledger[a] -= Math.abs(diff) * wager;
}
}
}
}
}
}

function getNetScores(){ return { ...netScores }; }
function getCourseHandicaps(){ return { ...courseHandicaps }; }
function setPayoutMode(mode){ payoutMode = mode; }
function getPayoutMode(){ return payoutMode; }

function getState(){
return { playerHandicaps:{...playerHandicaps}, courseHandicaps:{...courseHandicaps},
holeHandicaps:[...holeHandicaps], grossScores:{...grossScores},
netScores:{...netScores}, payoutMode, isNineHole, teamMode };
}
function setState(state){
playerHandicaps = {...state.playerHandicaps};
courseHandicaps = {...state.courseHandicaps};
holeHandicaps   = [...(state.holeHandicaps||[])];
grossScores     = {...state.grossScores};
netScores       = {...state.netScores};
payoutMode      = state.payoutMode;
isNineHole      = state.isNineHole;
teamMode        = state.teamMode || false;
}

return { reset, setPlayers, setCourseHandicaps, setHoleHandicaps, setHalfForNine,
strokesForHole, recordHole, settle, getNetScores, getCourseHandicaps,
setPayoutMode, getPayoutMode, setTeamMode, getTeamMode,
getState, setState };

})();

registerGame("battle", battleGame);