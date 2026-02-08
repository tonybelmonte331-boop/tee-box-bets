window.skinsGame = {

carryPlayers: 0,
multiplier: 1,

reset(){
this.carryPlayers = 0;
this.multiplier = 1;
},

currentPot(wager){
return wager * (this.carryPlayers + this.multiplier);
},

applyMultiplier(m, mode){
if(mode === "hole") this.multiplier = m;
},

tie(){
// add one hole worth of losing players (2 players in team game)
this.carryPlayers += 2;
this.multiplier = 1;
},

winTeam(t, teams, ledger, wager){

const losers = teams[t === "A" ? "B" : "A"];

const pot = wager * (this.carryPlayers + this.multiplier);

losers.forEach(p => ledger[p] -= wager);
teams[t].forEach(p => ledger[p] += pot / teams[t].length);

this.carryPlayers = 0;
this.multiplier = 1;
}

};  