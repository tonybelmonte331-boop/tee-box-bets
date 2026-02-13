const sideBets = (()=>{

let amount = 0;
let mode = "player";

function setAmount(val){
amount = Number(val);
}

function setMode(m){
mode = m;
}

function applyPlayer(winner, players, ledger){
players.forEach(p=>{
if(p === winner){
ledger[p] += amount * (players.length - 1);
}else{
ledger[p] -= amount;
}
});
}

function applyTeam(team, teams, ledger){
const winners = teams[team];
const losers = team === "A" ? teams.B : teams.A;

losers.forEach(p=> ledger[p] -= amount);
winners.forEach(p=> ledger[p] += amount);
}

return {
setAmount,
setMode,
applyPlayer,
applyTeam
};

})();