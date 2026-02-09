window.skinsGame = {

carryCount: 1,
multiplier: 1,

reset(){
this.carryCount = 1;
this.multiplier = 1;
},

currentPot(wager){
return wager * this.carryCount * this.multiplier;
},

applyMultiplier(m){
this.multiplier = m;
},

tie(){
this.carryCount += 1; // only add one wager each tie
},

winPlayer(player, players, ledger, wager){

const potPerPlayer = wager * this.carryCount * this.multiplier;

players.forEach(p=>{
if(p === player) ledger[p] += potPerPlayer;
else ledger[p] -= wager * this.carryCount;
});

this.reset();
},

winTeam(team, teams, ledger, wager){

const losers = teams[team === "A" ? "B" : "A"];
const winners = teams[team];

const potPerPlayer = wager * this.carryCount * this.multiplier;

losers.forEach(p => ledger[p] -= wager * this.carryCount);
winners.forEach(p => ledger[p] += potPerPlayer);

this.reset();
}

};