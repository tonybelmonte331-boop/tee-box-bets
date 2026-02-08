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
this.carry += 1; // add ONE hole only
this.multiplier = 1; // reset after carry
},

winPlayer(p, players, ledger, wager){

const pot = wager * this.carry * this.multiplier;

players.forEach(x=>{
if(x === p) ledger[x] += pot;
else ledger[x] -= wager * this.carry;
});

this.carry = 1;
this.multiplier = 1;
},

winTeam(t, teams, ledger, wager){

const pot = wager * this.carry * this.multiplier;

teams[t==="A"?"B":"A"].forEach(p=>{
ledger[p] -= wager * this.carry;
});

teams[t].forEach(p=>{
ledger[p] += pot / teams[t].length;
});

this.carry = 1;
this.multiplier = 1;
}

};