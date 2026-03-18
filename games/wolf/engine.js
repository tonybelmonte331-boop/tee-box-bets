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

if (wolfScore < oppScore) {

if (this.lone) {

// each opponent loses DOUBLE
oppTeam.forEach(p => {
ledger[p] -= wager * 2;
});

// wolf gets EXACTLY what others lost (no extra multiply)
const total = oppTeam.length * wager * 2;

ledger[wolf] += total;
} else {

// normal play
oppTeam.forEach(p => ledger[p] -= wager);
wolfTeam.forEach(p => ledger[p] += wager);

}

}

if (oppScore < wolfScore) {

if (this.lone) {

// wolf loses double to each opponent
const totalLoss = oppTeam.length * wager * 2;

ledger[wolf] -= totalLoss;

oppTeam.forEach(p => {
ledger[p] += wager * 2;
});

} else {

wolfTeam.forEach(p => ledger[p] -= wager);
oppTeam.forEach(p => ledger[p] += wager);

}

}

this.wolfIndex = (this.wolfIndex + 1) % players.length;

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
},

};

registerGame("wolf", wolfGame);