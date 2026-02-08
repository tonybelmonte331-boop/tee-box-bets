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
this.carry += 1;
this.multiplier = 1;
},

winPlayer(player, players, ledger, wager){
const pot = wager * this.carry * this.multiplier;

players.forEach(p=>{
if(p === player) ledger[p] += pot;
else ledger[p] -= wager * this.carry;
});

this.reset();
},

winTeam(team, teams, ledger, wager){
const pot = wager * this.carry * this.multiplier;

teams[team === "A" ? "B" : "A"].forEach(p=>{
ledger[p] -= wager * this.carry;
});

teams[team].forEach(p=>{
ledger[p] += pot / teams[team].length;
});

this.reset();
}
};