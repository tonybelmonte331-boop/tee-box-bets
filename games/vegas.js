window.vegasGame = {

carryPot: 0,
multiplier: 1,

reset(){
 this.carryPot = 0;
 this.multiplier = 1;
},

applyMultiplier(){},

currentPot(wager){
 return wager;
},

tie(){
 // tie only carries if enabled via rules in UI
},

/* ------------ MAIN HOLE CALC ------------ */

playHole(scores, teams, ledger, wager, rules){

 let aScores = scores.teamA;
 let bScores = scores.teamB;

 let aLow = Math.min(...aScores);
 let aHigh = Math.max(...aScores);
 let bLow = Math.min(...bScores);
 let bHigh = Math.max(...bScores);

 let teamA = Number(`${aLow}${aHigh}`);
 let teamB = Number(`${bLow}${bHigh}`);

 /* Birdie flip rule */
 if (rules.flip) {
 teamA = Number(`${aHigh}${aLow}`);
 teamB = Number(`${bHigh}${bLow}`);
 }

 let diff = Math.abs(teamA - teamB);

 /* Eagle double swing */
 if (rules.double) diff *= 2;

 let swing = diff * wager + this.carryPot;

 if (teamA === teamB) {
 if (rules.carry) this.carryPot += diff * wager;
 return;
 }

 this.carryPot = 0;

 const winTeam = teamA < teamB ? "A" : "B";
 const loseTeam = winTeam === "A" ? "B" : "A";

 const winners = teams[winTeam];
 const losers = teams[loseTeam];

 losers.forEach(p => ledger[p] -= swing);
 winners.forEach(p => ledger[p] += swing * losers.length / winners.length);
},

/* ------------ UI HOOKS ------------ */

winTeam(){},
winPlayer(){}

};