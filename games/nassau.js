const nassauGame = (()=>{

let frontA = 0;
let frontB = 0;
let backA = 0;
let backB = 0;

let frontPaid = false;
let backPaid = false;
let overallPaid = false;

function reset(){
 frontA = 0;
 frontB = 0;
 backA = 0;
 backB = 0;

 frontPaid = false;
 backPaid = false;
 overallPaid = false;
}

function recordHole(team, hole){
 if(hole <= 9){
 if(team === "A") frontA++;
 if(team === "B") frontB++;
 } else {
 if(team === "A") backA++;
 if(team === "B") backB++;
 }
}

function getStatus(){
 return {
 frontA,
 frontB,
 backA,
 backB,
 totalA: frontA + backA,
 totalB: frontB + backB
 };
}

function settleFront(wager, teams, ledger){
 if(frontPaid) return;

 if(frontA > frontB){
 payout("A", wager, teams, ledger);
 } else if(frontB > frontA){
 payout("B", wager, teams, ledger);
 }

 frontPaid = true;
}

function settleBack(wager, teams, ledger){
 if(backPaid) return;

 if(backA > backB){
 payout("A", wager, teams, ledger);
 } else if(backB > backA){
 payout("B", wager, teams, ledger);
 }

 backPaid = true;
}

function settleOverall(wager, teams, ledger){
 if(overallPaid) return;

 const totalA = frontA + backA;
 const totalB = frontB + backB;

 if(totalA > totalB){
 payout("A", wager, teams, ledger);
 } else if(totalB > totalA){
 payout("B", wager, teams, ledger);
 }

 overallPaid = true;
}

function payout(team, wager, teams, ledger){
 const winners = teams[team];
 const losers = team === "A" ? teams.B : teams.A;

 winners.forEach(p => ledger[p] += wager);
 losers.forEach(p => ledger[p] -= wager);
}

return {
 reset,
 recordHole,
 getStatus,
 settleFront,
 settleBack,
 settleOverall
};

})();