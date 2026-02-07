export const type="skins";

let carry=1;

export function play(result,players,ledger,wager){

if(result==="tie"){
carry++;
return;
}

const pot=wager*carry*(players.length-1);

players.forEach(p=>{
if(p===result) ledger[p]+=pot;
else ledger[p]-=wager*carry;
});

carry=1;
}
