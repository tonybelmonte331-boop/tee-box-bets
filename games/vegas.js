window.vegasGame={
type:"vegas",
carryPot:0,

play(scores,players,ledger,wager,rules){

let a1=scores.a1;
let a2=scores.a2;
let b1=scores.b1;
let b2=scores.b2;

let teamA=Number(`${a1}${a2}`);
let teamB=Number(`${b1}${b2}`);

if(rules.flip){
if(a1<a2) teamA=Number(`${a2}${a1}`);
if(b1<b2) teamB=Number(`${b2}${b1}`);
}

let multiplier=rules.double?2:1;

if(teamA===teamB){
if(rules.carry) this.carryPot+=wager*Math.abs(teamA-teamB);
return;
}

let diff=Math.abs(teamA-teamB)*wager*multiplier + this.carryPot;
this.carryPot=0;

if(teamA<teamB){
ledger[players[0]]+=diff;
ledger[players[1]]+=diff;
ledger[players[2]]-=diff;
ledger[players[3]]-=diff;
}else{
ledger[players[2]]+=diff;
ledger[players[3]]+=diff;
ledger[players[0]]-=diff;
ledger[players[1]]-=diff;
}
}
};
