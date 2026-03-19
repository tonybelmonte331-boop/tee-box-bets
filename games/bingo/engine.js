const bingoGame = window.bingoGame = (()=>{

let points = {};

// reset() is called by startRound with baseWager — just clear points
// players are initialized in ui.js build()
function reset(){
points = {};
}

function initPlayers(players){
players.forEach(p => points[p] = 0);
}

function awardPoint(winner, players, wager, ledger){
const opponents = players.filter(p => p !== winner);
opponents.forEach(p => ledger[p] -= wager);
ledger[winner] += wager * opponents.length;
points[winner] = (points[winner] || 0) + 1;
}

function getPoints(){
return { ...points };
}

function getState(){
return { points: { ...points } };
}

function setState(state){
points = { ...state.points };
}

return {
reset,
initPlayers,
awardPoint,
getPoints,
getState,
setState
};

})();

registerGame("bingo", bingoGame);