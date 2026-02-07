window.skinsGame = {

carry: 1,
multiplier: 1,

reset(){
this.carry=1;
this.multiplier=1;
},

applyMultiplier(m,mode){
if(mode==="hole") this.multiplier=m;
if(mode==="pot") this.carry*=m;
},

currentPot(wager){
return wager*this.carry*this.multiplier;
},

tie(){
this.carry*=this.multiplier;
this.multiplier=1;
this.carry++;
},

winPlayer(p,players,ledger,wager){
this.carry*=this.multiplier;
this.multiplier=1;

const pot=wager*this.carry*(players.length-1);

players.forEach(x=>{
if(x===p) ledger[x]+=pot;
else ledger[x]-=wager*this.carry;
});

this.carry=1;
},

winTeam(t,teams,ledger,wager){
this.carry*=this.multiplier;
this.multiplier=1;

const winners=teams[t];
const losers=teams[t==="A"?"B":"A"];

losers.forEach(p=>ledger[p]-=wager*this.carry);
winners.forEach(p=>ledger[p]+=wager*this.carry*losers.length/winners.length);

this.carry=1;
}
};