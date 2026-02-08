let currentGame;
let wagerMode;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};
let hole=1, holeLimit=9, baseWager=0;

/* ---------- NAV ---------- */

function show(id){
 document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
}

window.goGameSelect=()=>show("step-game");

/* ---------- SETUP ---------- */

window.selectGame=(game,mode)=>{
 currentGame=game;
 wagerMode=mode;
 document.getElementById("wagerLabel").textContent =
 mode==="player"?"Wager per player":"Wager per point";
 show("step-style");
};

window.nextTeams=()=>{
 playStyle=document.getElementById("playStyle").value;
 playerCount=parseInt(document.getElementById("playerCount").value);

 playStyle==="teams" ? show("step-teams") : buildPlayers();
};

window.nextPlayers=()=>{
 teamAName=document.getElementById("teamAName").value||"Team 1";
 teamBName=document.getElementById("teamBName").value||"Team 2";
 buildPlayers();
};

function buildPlayers(){
 const aBox=document.getElementById("teamAInputs");
 const bBox=document.getElementById("teamBInputs");

 aBox.innerHTML=""; bBox.innerHTML="";
 teamALabel.textContent=playStyle==="teams"?teamAName:"Players";
 teamBLabel.textContent=playStyle==="teams"?teamBName:"";

 if(playStyle==="teams"){
 for(let i=0;i<playerCount/2;i++){
 aBox.innerHTML+=`<input>`;
 bBox.innerHTML+=`<input>`;
 }
 } else {
 for(let i=0;i<playerCount;i++) aBox.innerHTML+=`<input>`;
 }

 show("step-players");
}

window.nextSettings=()=>show("step-settings");

/* ---------- START ---------- */

window.startRound=()=>{
 players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value); ledger[i.value]=0;
 if(playStyle==="teams") teams.A.push(i.value);
 });

 if(playStyle==="teams"){
 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 players.push(i.value); ledger[i.value]=0; teams.B.push(i.value);
 });
 }

 baseWager=parseFloat(baseWager.value);
 holeLimit=parseInt(holeLimit.value);

 skinsGame.reset();

 show("game-screen");

 skinsBox.classList.toggle("hidden",currentGame==="vegas");
 vegasBox.classList.toggle("hidden",currentGame!=="vegas");

 teamABox.textContent=teamAName;
 teamBBox.textContent=teamBName;

 buildWinnerButtons();
 updateUI();
};

/* ---------- SKINS ---------- */

function buildWinnerButtons(){
 const box=document.getElementById("winnerButtons");
 box.innerHTML="";

 if(playStyle==="teams"){
 box.innerHTML+=`<button onclick="winTeam('A')">${teamAName}</button>`;
 box.innerHTML+=`<button onclick="winTeam('B')">${teamBName}</button>`;
 } else {
 players.forEach(p=>{
 box.innerHTML+=`<button onclick="winPlayer('${p}')">${p}</button>`;
 });
 }
}

window.winPlayer=p=>{
 skinsGame.winPlayer(p,players,ledger,baseWager);
 nextHole();
};

window.winTeam=t=>{
 skinsGame.winTeam(t,teams,ledger,baseWager);
 nextHole();
};

window.tieHole=()=>{
 skinsGame.tie();
 nextHole();
};

window.openMultiplier=m=>{
 skinsGame.applyMultiplier(m);
};

/* ---------- VEGAS ---------- */

window.finishVegasHole=()=>{
 let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
 let b=[+b1.value,+b2.value].sort((x,y)=>x-y);

 const swing=vegasGame.calculate(a[0],a[1],b[0],b[1],baseWager,false);

 if(swing){
 const win=vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose=win==="A"?"B":"A";
 teams[lose].forEach(p=>ledger[p]-=swing);
 teams[win].forEach(p=>ledger[p]+=swing);
 }

 nextHole();
};

/* ---------- ROUND FLOW ---------- */

function nextHole(){
 updateUI();
 if(hole>=holeLimit) return finishRound();
 hole++;
 updateUI();
}

function updateUI(){
 holeDisplay.textContent=`Hole ${hole}`;
 potDisplay.textContent=
 currentGame==="skins" ? `$${skinsGame.currentPot(baseWager)}/player` : "";

 leaderboard.innerHTML="";
 players.forEach(p=>{
 leaderboard.innerHTML+=`${p}: $${ledger[p]}<br>`;
 });
}

window.finishRound=()=>{
 alert("Round Complete");
 show("step-home");
};