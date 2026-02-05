const SAVE_KEY = "teeboxbets_save";

let gameType = null;
let playStyle = "ffa";

let players = [];
let teams = { A: [], B: [] };

let ledger = {};
let hole = 1;
let holeLimit = 9;
let baseWager = 0;
let carryCount = 1;

let history = [];

let nassau = {
  front: {},
  back: {},
  overall: {}
};

/* ---------------- GAME SELECT ---------------- */

function selectGame(type) {
  gameType = type;
  show("setup-screen");
}

/* ---------------- UI HELPERS ---------------- */

function show(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function qs(id) {
  return document.getElementById(id);
}

/* ---------------- SETUP ---------------- */

qs("addPlayerBtn").onclick = () => {
  if (qs("players").children.length >= 8) return;
  qs("players").innerHTML += `<input placeholder="Player Name">`;
};

function toggleTeams() {
  playStyle = qs("playStyle").value;
  qs("teamAssign").classList.toggle("hidden", playStyle !== "teams");
  buildTeamAssign();
}

function buildTeamAssign() {
  const list = qs("teamList");
  list.innerHTML = "";
  [...qs("players").children].forEach((input, i) => {
    list.innerHTML += `
      <div>
        ${input.value || "Player"}
        <select>
          <option value="A">Team A</option>
          <option value="B">Team B</option>
        </select>
      </div>`;
  });
}

qs("startGameBtn").onclick = () => {
  players = [];
  ledger = {};
  teams = { A: [], B: [] };
  history = [];
  hole = 1;
  carryCount = 1;

  [...qs("players").children].forEach(i => {
    if (i.value.trim()) {
      players.push(i.value.trim());
      ledger[i.value.trim()] = 0;

      nassau.front[i.value.trim()] = 0;
      nassau.back[i.value.trim()] = 0;
      nassau.overall[i.value.trim()] = 0;
    }
  });

  if (players.length < 2) return alert("Add players");

  baseWager = parseFloat(qs("baseWager").value);
  holeLimit = parseInt(qs("holeLimit").value);

  if (!baseWager) return alert("Enter wager");

  if (playStyle === "teams") {
    const assigns = qs("teamList").querySelectorAll("select");
    assigns.forEach((s, idx) => teams[s.value].push(players[idx]));
  }

  show("game-screen");
  qs("gameTitle").textContent = qs("gameName").value || "Tee Box Bets";

  buildWinnerButtons();
  updateUI();
  saveGame();
};

/* ---------------- BUTTONS ---------------- */

function buildWinnerButtons() {
  const wrap = qs("winnerButtons");
  wrap.innerHTML = "";

  if (playStyle === "ffa") {
    players.forEach(p => {
      wrap.innerHTML += `<button onclick="playerWin('${p}')">${p}</button>`;
    });
  } else {
    wrap.innerHTML += `
      <button onclick="teamWin('A')">Team A Wins</button>
      <button onclick="teamWin('B')">Team B Wins</button>`;
  }
}

/* ---------------- CORE GAME ---------------- */

function log(text) {
  history.push(`Hole ${hole}: ${text}`);
}

function playerWin(player) {
  if (gameType === "skins") {
    const total = baseWager * (players.length - 1) * carryCount;

    players.forEach(p => {
      if (p === player) ledger[p] += total;
      else ledger[p] -= baseWager * carryCount;
    });

    log(`${player} won $${baseWager * carryCount}/player`);
    carryCount = 1;
    nextHole();
  } else {
    nassauPoint(player);
  }
}

function teamWin(team) {
  const winners = teams[team];
  const losers = teams[team === "A" ? "B" : "A"];

  losers.forEach(p => ledger[p] -= baseWager * carryCount);
  winners.forEach(p => ledger[p] += (baseWager * carryCount * losers.length) / winners.length);

  log(`Team ${team} won $${baseWager * carryCount}/player`);
  carryCount = 1;
  nextHole();
}

function tieHole() {
  carryCount++;
  log("Tie — carry");
  nextHole(false);
}

/* ---------------- NASSAU ---------------- */

function nassauPoint(player) {
  nassau.overall[player]++;
  if (hole <= 9) nassau.front[player]++;
  else nassau.back[player]++;
  nextHole();
}

function settle(section) {
  const scores = nassau[section];
  const max = Math.max(...Object.values(scores));
  const winners = players.filter(p => scores[p] === max);

  if (winners.length !== 1) return;

  const win = winners[0];
  players.forEach(p => {
    if (p === win) ledger[p] += baseWager * (players.length - 1);
    else ledger[p] -= baseWager;
  });
}

/* ---------------- HOLE FLOW ---------------- */

function nextHole(reset = true) {

  if (gameType === "nassau") {
    if (hole === 9) {
      settle("front");
      showLeaderboard("Continue to Back 9");
      return;
    }
    if (hole === 18) {
      settle("back");
      settle("overall");
      showLeaderboard("Finish Round");
      return;
    }
  }

  if (gameType === "skins") {
    if (hole === 9 && holeLimit === 18) {
      showLeaderboard("Continue to Back 9");
      return;
    }
    if (hole >= holeLimit) {
      showLeaderboard("Finish Round");
      return;
    }
  }

  hole++;
  if (reset) carryCount = 1;
  updateUI();
  saveGame();
}

/* ---------------- UI ---------------- */

function updateUI() {
  qs("holeDisplay").textContent = `Hole ${hole} of ${holeLimit}`;
  qs("potDisplay").textContent = `$${(baseWager * carryCount).toFixed(2)} / player`;

  const l = qs("ledger");
  l.innerHTML = "";

  players.forEach(p => {
    l.innerHTML += `
      <div class="ledger-row">
        <span>${p}</span>
        <span>$${ledger[p].toFixed(2)}</span>
      </div>`;
  });
}

/* ---------------- SIDE BET ---------------- */

let sideWinner = null;

function openSideBet() {
  qs("sideBetModal").classList.remove("hidden");
  const wrap = qs("sideWinners");
  wrap.innerHTML = "";

  if (playStyle === "ffa") {
    players.forEach(p => {
      wrap.innerHTML += `<button onclick="sideWinner='${p}'">${p}</button>`;
    });
  } else {
    wrap.innerHTML += `
      <button onclick="sideWinner='A'">Team A</button>
      <button onclick="sideWinner='B'">Team B</button>`;
  }
}

function confirmSideBet() {
  const amt = parseFloat(qs("sideAmount").value);
  if (!amt || !sideWinner) return alert("Select winner & amount");

  if (playStyle === "ffa") {
    players.forEach(p => {
      if (p === sideWinner) ledger[p] += amt * (players.length - 1);
      else ledger[p] -= amt;
    });
    log(`${sideWinner} won side bet $${amt}/player`);
  } else {
    const winners = teams[sideWinner];
    const losers = teams[sideWinner === "A" ? "B" : "A"];

    losers.forEach(p => ledger[p] -= amt);
    winners.forEach(p => ledger[p] += (amt * losers.length) / winners.length);

    log(`Team ${sideWinner} won side bet $${amt}/player`);
  }

  closeSideBet();
  updateUI();
  saveGame();
}

function closeSideBet() {
  qs("sideBetModal").classList.add("hidden");
  qs("sideAmount").value = "";
  sideWinner = null;
}

/* ---------------- HISTORY ---------------- */

function openHistory() {
  const list = qs("historyList");
  list.innerHTML = history.length
    ? history.map(h => `<div>${h}</div>`).join("")
    : "<div>No holes played yet</div>";

  qs("historyModal").classList.remove("hidden");
}

function closeHistory() {
  qs("historyModal").classList.add("hidden");
}

/* ---------------- LEADERBOARD ---------------- */

function showLeaderboard(text) {
  const board = qs("leaderboard");
  board.innerHTML = [...players]
    .sort((a, b) => ledger[b] - ledger[a])
    .map(p => `
      <div class="leader-row">
        <span>${p}</span>
        <span>$${ledger[p].toFixed(2)}</span>
      </div>
    `).join("");

  const btn = qs("continueBtn");
  btn.textContent = text;

  btn.onclick = () => {
    qs("leaderboardModal").classList.add("hidden");
    if (text === "Continue to Back 9") {
      hole++;
      updateUI();
    } else {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  };

  qs("leaderboardModal").classList.remove("hidden");
}

/* ---------------- SAVE / RESUME ---------------- */

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    gameType, playStyle, players, teams,
    ledger, hole, holeLimit,
    baseWager, carryCount,
    history, nassau
  }));
}

function resumeGame() {
  const data = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (!data) return alert("No saved game");

  ({ gameType, playStyle, players, teams, ledger,
     hole, holeLimit, baseWager, carryCount,
     history, nassau } = data);

  show("game-screen");
  buildWinnerButtons();
  updateUI();
}
