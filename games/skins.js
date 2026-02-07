window.skinsGame = {

carry:1,
multiplier:1,

reset(){
this.carry=1;
this.multiplier=1;
},

applyMultiplier(m,mode){
if(mode==="hole") this.multiplier=m;
if(mode==="pot") this.carry*=m;
},

currentPot(w){
return w*this.carry*this.multiplier;
},

tie(){
this.carry*=this.multiplier;
this.multiplier=1;
this.carry++;
},

winPlayer(p,players,ledger,w){
this.carry*=this.multiplier;
this.multiplier=1;

const pot=w*this.carry*(players.length-1);

players.forEach(x=>{
if(x===p) ledger[x]+=pot;
else ledger[x]-=w*this.carry;
});

this.carry=1;
},

winTeam(t,teams,ledger,w){
this.carry*=this.multiplier;
this.multiplier=1;

teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=w*this.carry);
teams[t].forEach(p=>ledger[p]+=w*this.carry);

this.carry=1;
}
};