const nassauGame = (()=>{

let frontA = 0;
let frontB = 0;
let backA = 0;
let backB = 0;
let totalA = 0;
let totalB = 0;

function reset(){
frontA = frontB = backA = backB = totalA = totalB = 0;
}

function recordHole(team, hole){

// Front 9
if(hole <= 9){
if(team === "A") frontA++;
if(team === "B") frontB++;
}

// Back 9
if(hole > 9){
if(team === "A") backA++;
if(team === "B") backB++;
}

// Overall
if(team === "A") totalA++;
if(team === "B") totalB++;
}

// Tie = do nothing (hole simply passes)

function settleFront(wager, teams, ledger){
if(frontA === frontB) return;

const win = frontA > frontB ? "A" : "B";
const lose = win === "A" ? "B" : "A";

teams[lose].forEach(p=>ledger[p]-=wager);
teams[win].forEach(p=>ledger[p]+=wager);
}

function settleBack(wager, teams, ledger){
if(backA === backB) return;

const win = backA > backB ? "A" : "B";
const lose = win === "A" ? "B" : "A";

teams[lose].forEach(p=>ledger[p]-=wager);
teams[win].forEach(p=>ledger[p]+=wager);
}

function settleOverall(wager, teams, ledger){
if(totalA === totalB) return;

const win = totalA > totalB ? "A" : "B";
const lose = win === "A" ? "B" : "A";

teams[lose].forEach(p=>ledger[p]-=wager);
teams[win].forEach(p=>ledger[p]+=wager);
}

function getStatus(){
return {
frontA, frontB,
backA, backB,
totalA, totalB
};
}

return {
reset,
recordHole,
settleFront,
settleBack,
settleOverall,
getStatus
};

})();
