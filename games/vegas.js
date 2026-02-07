window.vegasGame = {

reset(){},

applyMultiplier(){},

currentPot(){ return ""; },

tie(){},

winPlayer(){},

winTeam(){},

playHole(a,b,teams,ledger,w){

const aLow=Math.min(...a);
const aHigh=Math.max(...a);
const bLow=Math.min(...b);
const bHigh=Math.max(...b);

const teamA=Number(`${aLow}${aHigh}`);
const teamB=Number(`${bLow}${bHigh}`);

if(teamA===teamB) return;

const diff=Math.abs(teamA-teamB)*w;

const win=teamA<teamB?"A":"B";
const lose=win==="A"?"B":"A";

teams[lose].forEach(p=>ledger[p]-=diff);
teams[win].forEach(p=>ledger[p]+=diff);
}
};
