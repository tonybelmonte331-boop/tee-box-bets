const wolfGame = {

wolfIndex:0,
partner:null,
lone:false,

reset(){
this.wolfIndex=0;
this.partner=null;
this.lone=false;
},

choosePartner(player){
this.partner=player;
this.lone=false;
},

chooseLone(){
this.lone=true;
this.partner=null;
},

resolve(scores,players,wager,ledger){

const wolf = players[(this.wolfIndex) % players.length];

let wolfTeam=[wolf];
let oppTeam=[];

if(this.lone){

oppTeam = players.filter(p=>p!==wolf);

}else{

wolfTeam.push(this.partner);

oppTeam = players.filter(p=>!wolfTeam.includes(p));

}

const wolfScore = Math.min(...wolfTeam.map(p=>scores[p]));
const oppScore = Math.min(...oppTeam.map(p=>scores[p]));

if(wolfScore < oppScore){

const mult = this.lone ? 2 : 1;

oppTeam.forEach(p=>ledger[p]-=wager*mult);
wolfTeam.forEach(p=>ledger[p]+=wager*mult);

}

if(oppScore < wolfScore){

const mult = this.lone ? 2 : 1;

wolfTeam.forEach(p=>ledger[p]-=wager*mult);
oppTeam.forEach(p=>ledger[p]+=wager*mult);

}

this.wolfIndex++;

this.partner=null;
this.lone=false;

},

getState(){
return{
wolfIndex:this.wolfIndex,
partner:this.partner,
lone:this.lone
};
},

setState(state){
this.wolfIndex=state.wolfIndex;
this.partner=state.partner;
this.lone=state.lone;
}

};

registerGame("wolf", wolfGame);