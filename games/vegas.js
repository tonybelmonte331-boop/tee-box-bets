window.vegasGame = {

reset(){},

applyMultiplier(){},

currentPot(){ return ""; },

tie(){},

winPlayer(){},

winTeam(){},

playHole(teamAScores,teamBScores,teams,ledger,wager){

const aLow=Math.min(...teamAScores);
const aHigh=Math.max(...teamAScores);
const bLow=Math.min(...teamBScores);
const bHigh=Math.max(...teamBScores);

const teamA=Number(`${aLow}${aHigh}`);
const teamB=Number(`${bLow}${bHigh}`);

if(teamA===teamB) return;

const diff=Math.abs(teamA-teamB)*wager;

const winTeam=teamA<teamB?"A":"B";
const loseTeam=winTeam==="A"?"B":"A";

teams[loseTeam].forEach(p=>ledger[p]-=diff);
teams[winTeam].forEach(p=>ledger[p]+=diff);
}
};
