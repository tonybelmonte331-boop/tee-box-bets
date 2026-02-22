const skinsGame = (()=>{

let base = 0;
let carry = 0;
let bonus = 0;

function reset(wager){
base = wager;
carry = 0;
bonus = 0;
}

function currentPot(){
return (carry + 1) * base + bonus;
}

function applyBonus(type){
if(type === "birdie") bonus = base;
if(type === "eagle") bonus = base * 2;
}

function clearBonus(){
bonus = 0;
}

function tie(){
carry++;
if(bonus > 0){
carry += bonus / base;
bonus = 0;
}
}

function winTeam(team, teams, ledger){
const pot = currentPot();
const winners = teams[team];
const losers = team === "A" ? teams.B : teams.A;

winners.forEach(p => ledger[p] += pot);
losers.forEach(p => ledger[p] -= pot);

carry = 0;
bonus = 0;
}

function winPlayer(player, players, ledger){
const pot = currentPot();

players.forEach(p=>{
if(p === player){
ledger[p] += pot;
}else{
ledger[p] -= pot;
}
});

carry = 0;
bonus = 0;
}

function getState(){
return { base, carry, bonus };
}

function setState(state){
base = state.base;
carry = state.carry;
bonus = state.bonus;
}

return {
reset,
currentPot,
applyBonus,
clearBonus,
tie,
winTeam,
winPlayer,
getState,
setState
};

})();