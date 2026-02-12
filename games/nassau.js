const nassauGame = (()=>{

let frontA=0, frontB=0;
let backA=0, backB=0;
let totalA=0, totalB=0;

function reset(){
frontA=frontB=backA=backB=totalA=totalB=0;
}

function recordHole(team, hole){
if(hole<=9){
if(team==="A") frontA++;
if(team==="B") frontB++;
} else {
if(team==="A") backA++;
if(team==="B") backB++;
}

if(team==="A") totalA++;
if(team==="B") totalB++;
}

function settleFront(wager, teams, ledger){
if(frontA===frontB) return;
const win = frontA>frontB?"A":"B";
const lose = win==="A"?"B":"A";
teams[lose].forEach(p=>ledger[p]-=wager);
teams[win].forEach(p=>ledger[p]+=wager);
}

function settleBack(wager, teams, ledger){
if(backA===backB) return;
const win = backA>backB?"A":"B";
const lose = win==="A"?"B":"A";
teams[lose].forEach(p=>ledger[p]-=wager);
teams[win].forEach(p=>ledger[p]+=wager);
}

function settleOverall(wager, teams, ledger){
if(totalA===totalB) return;
const win = totalA>totalB?"A":"B";
const lose = win==="A"?"B":"A";
teams[lose].forEach(p=>ledger[p]-=wager);
teams[win].forEach(p=>ledger[p]+=wager);
}

function getStatus(){
return { frontA,frontB,backA,backB,totalA,totalB };
}

function getState(){
return { frontA,frontB,backA,backB,totalA,totalB };
}

function setState(state){
frontA=state.frontA;
frontB=state.frontB;
backA=state.backA;
backB=state.backB;
totalA=state.totalA;
totalB=state.totalB;
}

return {
reset,
recordHole,
settleFront,
settleBack,
settleOverall,
getStatus,
getState,
setState
};

})();
