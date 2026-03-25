window.vegasGame = {

reset(){},

calculate(a1, a2, b1, b2, wager, flip){

// Each team's number = lowest score first (e.g. 3&4 → 34, not 43)
let tA1 = Math.min(a1, a2);
let tA2 = Math.max(a1, a2);
let tB1 = Math.min(b1, b2);
let tB2 = Math.max(b1, b2);

let teamA = Number(`${tA1}${tA2}`);
let teamB = Number(`${tB1}${tB2}`);

if(teamA === teamB) return 0;

// Birdie flip: LOSING team flipped to worst (highest) combo
if(flip){
if(teamA < teamB){
teamB = Number(`${tB2}${tB1}`);
} else {
teamA = Number(`${tA2}${tA1}`);
}
}

return Math.abs(teamA - teamB) * wager;
},

winner(a1, a2, b1, b2){
const teamA = Number(`${Math.min(a1,a2)}${Math.max(a1,a2)}`);
const teamB = Number(`${Math.min(b1,b2)}${Math.max(b1,b2)}`);
return teamA <= teamB ? "A" : "B";
}

};
