const sideBets = (()=>{

let amount = 0;
let mode = "player";

function setAmount(val){
amount = Number(val) || 0;
}

function setMode(m){
mode = m;
}

function applyPlayer(winner, players, ledger){
const wager = amount;

if(!wager) return;

players.forEach(p=>{
if(p === winner){
ledger[p] += wager * (players.length - 1);
} else {
ledger[p] -= wager;
}
});
}

function applyTeam(team, teams, ledger){
const wager = amount;

if(!wager) return;

const winners = teams[team];
const losers = team === "A" ? teams.B : teams.A;

losers.forEach(p => ledger[p] -= wager);
winners.forEach(p => ledger[p] += wager);
}

return {
setAmount,
setMode,
applyPlayer,
applyTeam
};

})();

