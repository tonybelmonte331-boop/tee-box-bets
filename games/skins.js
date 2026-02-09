const skinsGame = (()=>{

let base = 0;
let carryCount = 0;
let bonus = 0;

function reset(wager){
base = wager;
carryCount = 0;
bonus = 0;
}

function currentPot(){
return (carryCount + 1) * base + bonus;
}

function applyBonus(type, wager){
if(type === "birdie") bonus = wager;
if(type === "eagle") bonus = wager * 2;
}

function clearBonus(){
bonus = 0;
}

function tie(){
carryCount++;
bonus = 0;
}

function winPlayer(player, players, ledger){
const pot = currentPot();

players.forEach(p=>{
if(p === player) ledger[p] += pot;
else ledger[p] -= base;
});

carryCount = 0;
bonus = 0;
}

function winTeam(team, teams, ledger){
const pot = currentPot();

const winners = teams[team];
const losers = team === "A" ? teams.B : teams.A;

winners.forEach(p=> ledger[p] += pot);
losers.forEach(p=> ledger[p] -= base);

carryCount = 0;
bonus = 0;
}

return {
reset,
currentPot,
applyBonus,
clearBonus,
tie,
winPlayer,
winTeam
};

})();

