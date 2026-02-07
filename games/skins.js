window.skinsGame={
type:"skins",
carry:1,
multiplier:1,

applyMultiplier(m,mode){
if(mode==="hole") this.multiplier=m;
if(mode==="pot") this.carry*=m;
},

play(result,players,ledger,wager){

if(result==="tie"){
this.carry*=this.multiplier;
this.multiplier=1;
this.carry++;
return;
}

this.carry*=this.multiplier;
this.multiplier=1;

const pot=wager*this.carry*(players.length-1);

players.forEach(p=>{
if(p===result) ledger[p]+=pot;
else ledger[p]-=wager*this.carry;
});

this.carry=1;
}
};