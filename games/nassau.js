const nassauGame = (()=>{

let front = 0;
let back = 0;
let total = 0;

function reset(){
 front = 0;
 back = 0;
 total = 0;
}

function scoreHole(winner, players, ledger, wager, hole){

 players.forEach(p=>{
 if(p === winner){
 ledger[p] += wager * (players.length - 1);
 } else {
 ledger[p] -= wager;
 }
 });

 if(hole <= 9) front++;
 else back++;

 total++;
}

function status(){
 return {
 front,
 back,
 total
 };
}

return {
 reset,
 scoreHole,
 status
};

})();