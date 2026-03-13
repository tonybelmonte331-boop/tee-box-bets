window.wolfGame = {

state:{
wolfIndex:0
},

reset(){
this.state.wolfIndex = 0;
},

getState(){
return this.state;
},

setState(s){
this.state = s;
},

nextWolf(players){
this.state.wolfIndex++;
if(this.state.wolfIndex >= players.length){
this.state.wolfIndex = 0;
}
return players[this.state.wolfIndex];
}

};