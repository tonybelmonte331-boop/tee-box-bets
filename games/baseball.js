window.baseballGame = {

state:{
runsA:0,
runsB:0
},

reset(){
this.state.runsA = 0;
this.state.runsB = 0;
},

getState(){
return this.state;
},

setState(s){
this.state = s;
},

scoreRun(team, runs){

if(team === "A"){
this.state.runsA += runs;
}

if(team === "B"){
this.state.runsB += runs;
}

}

};