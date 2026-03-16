const baseballGame = {

awayRuns:[0,0,0,0,0,0,0,0,0],
homeRuns:[0,0,0,0,0,0,0,0,0],

reset(){
this.awayRuns=[0,0,0,0,0,0,0,0,0];
this.homeRuns=[0,0,0,0,0,0,0,0,0];
},

recordHole(hole,scoreA,scoreB,birdie,wager,teams,ledger){

const inning=Math.ceil(hole/2);
const isTop=hole%2===1;

let runs=0;

if(isTop){
if(scoreA<scoreB){
runs=Math.abs(scoreB-scoreA);
}
}else{
if(scoreB<scoreA){
runs=Math.abs(scoreA-scoreB);
}
}

if(birdie) runs*=2;

if(runs===0) return;

if(isTop){

this.awayRuns[inning-1]=runs;

teams.B.forEach(p=>ledger[p]-=runs*wager);
teams.A.forEach(p=>ledger[p]+=runs*wager);

}else{

this.homeRuns[inning-1]=runs;

teams.A.forEach(p=>ledger[p]-=runs*wager);
teams.B.forEach(p=>ledger[p]+=runs*wager);

}

},

getScoreboard(){
return{
away:this.awayRuns,
home:this.homeRuns
};
},

getState(){
return{
awayRuns:[...this.awayRuns],
homeRuns:[...this.homeRuns]
};
},

setState(state){
this.awayRuns=[...state.awayRuns];
this.homeRuns=[...state.homeRuns];
}

};

registerGame("baseball",baseballGame);