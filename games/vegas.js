window.vegasGame = {

reset(){},

calculate(a1,a2,b1,b2,wager,flip){

let teamA = Number(`${a1}${a2}`);
let teamB = Number(`${b1}${b2}`);

if(teamA === teamB) return 0;

if(flip){
if(teamA > teamB) teamA = Number(`${a2}${a1}`);
else teamB = Number(`${b2}${b1}`);
}

return Math.abs(teamA - teamB) * wager;
},

winner(a1,a2,b1,b2){

let teamA = Number(`${a1}${a2}`);
let teamB = Number(`${b1}${b2}`);

return teamA < teamB ? "A" : "B";
}

};
