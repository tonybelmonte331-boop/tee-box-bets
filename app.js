const SAVE_KEY = "teeboxbets_save";

let gameType=null;
let playStyle="ffa";

let players=[];
let teams={A:[],B:[]};
let ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;
let carryCount=1;

let history=[];

/* ---------- VISIBILITY ---------- */

function hideAllScreens(){
  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}
function showScreen(id){
  hideAllScreens();
  document.getElementById(id).classList.remove("hidden");
}
function closeModals(){
  document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}

/* ---------- GAME SELECT ---------- */

function selectGame(type){
  gameType=type;
  showScreen("setup-screen");
}

/* ---------- SETUP ---------- */

const playersDiv=document.getElementById("players");

document.getElementById("addPlayerBtn").onclick=()=>{
  if(playersDiv.children.length>=8) return;

  const input=document.createElement("input");
  input.placeholder="Player Name";
  input.oninput=buildTeamAssign;

  playersDiv.appendChild(input);
  buildTeamAssign();
};

function toggleTeams(){
  playStyle=document.getElementById("playStyle").value;
  document.getElementById("teamAssign")
    .classList.toggle("hidden",playStyle!=="teams");
  buildTeamAssign();
}

function buildTeamAssign(){
  if(playStyle!=="teams") return;

  const list=document.getElementById("teamList");
  list.innerHTML="";

  [...playersDiv.children].forEach(input=>{
    const row=document.createElement("div");
    row.innerHTML=`
      ${input.value||"Player"}
      <select>
        <option value="A">Team A</option>
        <option value="B">Team B</option>
      </select>`;
    list.appendChild(row);
  });
}

document.getElementById("startGameBtn").onclick=()=>{
  players=[];
  ledger={};
  teams={A:[],B:[]};
  history=[];
  hole=1;
  carryCount=1;

  [...playersDiv.children].forEach(i=>{
    if(i.value.trim()){
      players.push(i.value.trim());
      ledger[i.value.trim()]=0;
    }
  });

  if(players.length<2) return alert("Add players");

  baseWager=parseFloat(document.getElementById("baseWager").value);
  holeLimit=parseInt(document.getElementById("holeLimit").value);

  if(!baseWager) return alert("Enter wager");

  if(playStyle==="teams"){
    const selects=document.querySelectorAll("#teamList select");
    selects.forEach((s,i)=>teams[s.value].push(players[i]));
  }

  document.getElementById("gameTitle").textContent=
    document.getElementById("gameName").value||"Tee Box Bets";

  buildWinnerButtons();
  updateUI();
  showScreen("game-screen");
};

/* ---------- BUTTONS ---------- */

function buildWinnerButtons(){
  const wrap=document.getElementById("winnerButtons");
  wrap.innerHTML="";

  if(playStyle==="ffa"){
    players.forEach(p=>{
      wrap.innerHTML+=`<button onclick="playerWin('${p}')">${p}</button>`;
    });
  }else{
    wrap.innerHTML+=`
      <button onclick="teamWin('A')">Team A Wins</button>
      <button onclick="teamWin('B')">Team B Wins</button>`;
  }
}

/* ---------- GAME LOGIC ---------- */

function log(text){
  history.push(`Hole ${hole}: ${text}`);
}

function playerWin(p){
  const total=baseWager*(players.length-1)*carryCount;
  players.forEach(x=>{
    if(x===p) ledger[x]+=total;
    else ledger[x]-=baseWager*carryCount;
  });
  log(`${p} won`);
  carryCount=1;
  nextHole();
}

function teamWin(t){
  const winners=teams[t];
  const losers=teams[t==="A"?"B":"A"];

  losers.forEach(p=>ledger[p]-=baseWager*carryCount);
  winners.forEach(p=>ledger[p]+=baseWager*carryCount*losers.length/winners.length);

  log(`Team ${t} won`);
  carryCount=1;
  nextHole();
}

function tieHole(){
  carryCount++;
  log("Tie");
  nextHole(false);
}

function nextHole(reset=true){
  if(hole>=holeLimit){
    showLeaderboard("Finish Round");
    return;
  }
  hole++;
  if(reset) carryCount=1;
  updateUI();
}

/* ---------- UI ---------- */

function updateUI(){
  document.getElementById("holeDisplay").textContent=
    `Hole ${hole} of ${holeLimit}`;

  document.getElementById("potDisplay").textContent=
    `$${baseWager*carryCount}/player`;

  const l=document.getElementById("ledger");
  l.innerHTML="";
  players.forEach(p=>{
    l.innerHTML+=`
      <div class="ledger-row">
        <span>${p}</span>
        <span>$${ledger[p]}</span>
      </div>`;
  });
}

/* ---------- SIDE BET ---------- */

function openSideBet(){
  closeModals();
  const wrap=document.getElementById("sideWinners");
  wrap.innerHTML="";
  players.forEach(p=>{
    wrap.innerHTML+=`<button onclick="sideWin('${p}')">${p}</button>`;
  });
  document.getElementById("sideBetModal").classList.remove("hidden");
}

function sideWin(p){
  const amt=parseFloat(document.getElementById("sideAmount").value);
  if(!amt) return alert("Enter wager");

  players.forEach(x=>{
    if(x===p) ledger[x]+=amt*(players.length-1);
    else ledger[x]-=amt;
  });

  log(`${p} side bet`);
  closeModals();
  updateUI();
}

/* ---------- HISTORY ---------- */

function openHistory(){
  closeModals();
  const list=document.getElementById("historyList");
  list.innerHTML=history.map(h=>`<div>${h}</div>`).join("")||"No holes yet";
  document.getElementById("historyModal").classList.remove("hidden");
}

function closeHistory(){ closeModals(); }

/* ---------- LEADERBOARD ---------- */

function showLeaderboard(text){
  closeModals();
  const b=document.getElementById("leaderboard");
  b.innerHTML=[...players]
    .sort((a,b)=>ledger[b]-ledger[a])
    .map(p=>`
      <div class="leader-row">
        <span>${p}</span>
        <span>$${ledger[p]}</span>
      </div>`).join("");

  document.getElementById("continueBtn").textContent=text;
  document.getElementById("leaderboardModal").classList.remove("hidden");
}
