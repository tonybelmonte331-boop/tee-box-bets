const dotsGame = window.dotsGame = (()=>{

let dots      = {};   // { playerName: totalDots }
let activeDots = [];  // array of { key, label, value, custom? }
let wager     = 0;

function reset(){
dots   = {};
}

function setWager(w){
wager = w;
}

function setActiveDots(list){
activeDots = list;
}

function getActiveDots(){
return activeDots;
}

function initPlayers(players){
players.forEach(p => dots[p] = 0);
}

// Award dotValue dots to winner, collect from all others
function awardDot(winner, players, dotValue, ledger){
if(!winner || !dotValue) return;
dots[winner] = (dots[winner] || 0) + dotValue;
}

// Called at end of round — settle net dots between every pair
function settleAll(players, ledger){
for(let i = 0; i < players.length; i++){
for(let j = i + 1; j < players.length; j++){
const a = players[i];
const b = players[j];
const net = (dots[a] || 0) - (dots[b] || 0);
if(net > 0){
ledger[a] += net * wager;
ledger[b] -= net * wager;
} else if(net < 0){
ledger[b] += Math.abs(net) * wager;
ledger[a] -= Math.abs(net) * wager;
}
}
}
}

function getDots(){
return { ...dots };
}

function getState(){
return {
dots: { ...dots },
activeDots: [...activeDots],
wager
};
}

function setState(state){
dots      = { ...state.dots };
activeDots = [...state.activeDots];
wager     = state.wager;
}

return {
reset,
setWager,
setActiveDots,
getActiveDots,
initPlayers,
awardDot,
settleAll,
getDots,
getState,
setState
};

})();

registerGame("dots", dotsGame);