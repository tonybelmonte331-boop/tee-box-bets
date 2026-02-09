window.skinsGame = {

carryAmount: 0,
bonus: 0,

reset(baseWager){
this.carryAmount = baseWager;
this.bonus = 0;
},

currentPot(){
return this.carryAmount + this.bonus;
},

applyBonus(type, baseWager){
if(type === "birdie") this.bonus = baseWager;
if(type === "eagle") this.bonus = baseWager * 2;
},

clearBonus(){
this.bonus = 0;
},

tie(){
this.carryAmount = this.currentPot();
this.clearBonus();
},

winPlayer(player, players, ledger){

const holeValue = this.currentPot();

players.forEach(p=>{
if(p === player) ledger[p] += holeValue;
else ledger[p] -= holeValue;
});

this.reset(holeValue ? holeValue : 0);
},

winTeam(team, teams, ledger){

const winners = teams[team];
const losers = teams[team === "A" ? "B" : "A"];

const holeValue = this.currentPot();

winners.forEach(p => ledger[p] += holeValue);
losers.forEach(p => ledger[p] -= holeValue);

this.reset(holeValue ? holeValue : 0);
}

};
