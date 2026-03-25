const skinsGame = window.skinsGame = (()=>{

let base  = 0;
let carry = 0; // total dollars carried over (not units)
let bonus = 0; // extra dollars added by birdie/eagle this hole

function reset(wager){
base  = wager || base;
carry = 0;
bonus = 0;
}

function currentPot(){
// base wager per player + all carried dollars + any bonus this hole
return base + carry + bonus;
}

function applyBonus(type){
if(type === "birdie") bonus = base;      // +1× base
if(type === "eagle")  bonus = base * 2;  // +2× base
}

function clearBonus(){
bonus = 0;
}

function tie(){
// The entire current pot carries forward
carry = currentPot();
bonus = 0; // bonus is now baked into carry
}

function winTeam(team, teams, ledger){
const pot = currentPot();
const winners = teams[team];
const losers  = team === "A" ? teams.B : teams.A;
winners.forEach(p => ledger[p] += pot);
losers.forEach(p  => ledger[p] -= pot);
carry = 0;
bonus = 0;
}

function winPlayer(player, players, ledger){
const pot    = currentPot();
const losers = players.length - 1;
ledger[player] += pot * losers;
players.forEach(p => {
if(p !== player) ledger[p] -= pot;
});
carry = 0;
bonus = 0;
}

function getState(){
return { base, carry, bonus };
}

function setState(state){
base  = state.base;
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

registerGame("skins", skinsGame);