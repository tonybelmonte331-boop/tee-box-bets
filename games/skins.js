window.skinsGame = {

carry: 1,
multiplier: 1,

reset(){
this.carry = 1;
this.multiplier = 1;
},

currentPot(wager){
return wager * this.carry * this.multiplier;
},

applyMultiplier(m){
this.multiplier = m;
},

tie(){
this.carry += 1; // keep stacking
},

winPlayer(player, players, ledger, wager){

const pot = wager * this.carry * this.multiplier;

players.forEach(p=>{
if(p === player) ledger[p] += pot;
else ledger[p] -= wager;
});

this.reset(); // reset ONLY after win
},

winTeam(team, teams, ledger, wager){

const losers = teams[team==="A"?"B":"A"];
const winners = teams[team];

const pot = wager * this.carry * this.multiplier;

losers.forEach(p => ledger[p] -= wager);
winners.forEach(p => ledger[p] += wager);

this.reset(); // reset ONLY after win
}

};