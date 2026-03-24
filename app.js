/* ================= SUPABASE AUTH & SYNC ================= */

const SUPABASE_URL      = "https://hrslssvfafdzoncovfqt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc2xzc3ZmYWZkem9uY292ZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTU4MzIsImV4cCI6MjA4OTUzMTgzMn0.dFwltOaE4xZlKbllSOsltX9n5acEKou6QkpDgsaQCXQ";

let sbClient = null;
let currentUser = null;
let syncInProgress = false;

// Initialize Supabase client once the CDN script loads
function initSupabase(){
if(typeof window.supabase !== "undefined" && !sbClient){
sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
sbClient.auth.onAuthStateChange(async (event, session) => {
if(event === "SIGNED_IN" && session){
currentUser = session.user;
await restoreFromServer();
updateAccountBar();
closeAuthModal();
} else if(event === "SIGNED_OUT"){
currentUser = null;
updateAccountBar();
}
});
sbClient.auth.getSession().then(({ data: { session } }) => {
if(session){
currentUser = session.user;
updateAccountBar();
}
});
} else if(typeof window.supabase === "undefined") {
// CDN not loaded yet — retry after a short delay
setTimeout(initSupabase, 200);
}
}

// ── Auth UI ──────────────────────────────────────────────────────────────────

let authMode = "login";

window.openAuthModal = () => {
if(currentUser){
openAccountModal();
return;
}
switchAuthTab("login");
document.getElementById("authModal").classList.remove("hidden");
setTimeout(() => document.getElementById("authEmail")?.focus(), 100);
};

window.closeAuthModal = () => {
document.getElementById("authModal")?.classList.add("hidden");
document.getElementById("authError").textContent = "";
};

window.switchAuthTab = (mode) => {
authMode = mode;
const loginTab   = document.getElementById("authTabLogin");
const signupTab  = document.getElementById("authTabSignup");
const extra      = document.getElementById("authSignupExtra");
const submitBtn  = document.getElementById("authSubmitBtn");
loginTab.classList.toggle("active", mode === "login");
signupTab.classList.toggle("active", mode === "signup");
extra.classList.toggle("hidden", mode === "login");
submitBtn.textContent = mode === "login" ? "Sign In" : "Create Account";
document.getElementById("authError").textContent = "";
};

window.handleAuthSubmit = async () => {
// Ensure client is ready
if(!sbClient){
initSupabase();
await new Promise(r => setTimeout(r, 600));
}
if(!sbClient){
document.getElementById("authError").textContent = "Connection error — please try again";
return;
}
const email    = document.getElementById("authEmail")?.value?.trim();
const password = document.getElementById("authPassword")?.value;
const errorEl  = document.getElementById("authError");
const btn      = document.getElementById("authSubmitBtn");

if(!email || !password){ errorEl.textContent = "Please enter email and password"; return; }

btn.textContent = "Please wait...";
btn.disabled    = true;
errorEl.textContent = "";

try {
if(authMode === "signup"){
const name = document.getElementById("authDisplayName")?.value?.trim() || "";
const { error } = await sbClient.auth.signUp({
email, password,
options: { data: { name } }
});
if(error) throw error;
errorEl.style.color = "#2ecc71";
errorEl.textContent = "Account created! Check your email to confirm.";
} else {
const { error } = await sbClient.auth.signInWithPassword({ email, password });
if(error) throw error;
}
} catch(err) {
errorEl.style.color = "#e74c3c";
errorEl.textContent = err.message || "Something went wrong";
} finally {
btn.textContent = authMode === "login" ? "Sign In" : "Create Account";
btn.disabled    = false;
}
};

window.handleForgotPassword = async () => {
if(!sbClient){ initSupabase(); }
const email = document.getElementById("authEmail")?.value?.trim();
if(!email){ document.getElementById("authError").textContent = "Enter your email first"; return; }
await sbClient.auth.resetPasswordForEmail(email);
document.getElementById("authError").style.color = "#2ecc71";
document.getElementById("authError").textContent = "Password reset email sent!";
};

window.handleSignOut = async () => {
if(!sbClient) return;
await sbClient.auth.signOut();
closeAccountModal();
updateAccountBar();
alert("Signed out. Your local data is still saved on this device.");
};

// ── Account Modal ─────────────────────────────────────────────────────────────

window.openAccountModal = () => {
const box = document.getElementById("accountInfo");
if(box && currentUser){
box.innerHTML = `
<div style="font-size:28px;margin-bottom:6px;">👤</div>
<div style="font-weight:700;">${currentUser.user_metadata?.name || currentUser.email}</div>
<div style="font-size:12px;opacity:.6;">${currentUser.email}</div>
`;
}
document.getElementById("accountModal")?.classList.remove("hidden");
};

window.closeAccountModal = () => {
document.getElementById("accountModal")?.classList.add("hidden");
};

// ── Account Bar (home screen) ─────────────────────────────────────────────────

function updateAccountBar(){
const bar = document.getElementById("homeAccountBar");
if(!bar) return;

if(currentUser){
bar.innerHTML = `
<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 14px;background:rgba(255,255,255,.06);border-radius:12px;font-size:13px;cursor:pointer;" onclick="openAccountModal()">
<span>☁️</span>
<span style="opacity:.8;">Synced · ${currentUser.user_metadata?.name || currentUser.email}</span>
<span style="opacity:.4;">›</span>
</div>
`;
} else {
bar.innerHTML = `
<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 14px;background:rgba(255,255,255,.06);border-radius:12px;font-size:13px;cursor:pointer;" onclick="openAuthModal()">
<span>☁️</span>
<span style="opacity:.8;">Sign in to sync your data</span>
<span style="opacity:.4;">›</span>
</div>
`;
}
}

// ── Sync Engine ───────────────────────────────────────────────────────────────

window.syncToServer = async (showAlert) => {
if(!sbClient || !currentUser) return;
if(syncInProgress) return;
syncInProgress = true;

try {
const uid = currentUser.id;

// 1. Profile
if(userProfile){
await sbClient.from("profiles").upsert({
id:        uid,
name:      userProfile.name,
handicap:  userProfile.currentHandicap || 0,
updated_at: new Date().toISOString()
});
}

// 2. Saved Players
if(savedPlayers?.length){
await sbClient.from("saved_players").delete().eq("user_id", uid);
const rows = savedPlayers.map(p => ({ user_id: uid, name: p.name, payments: p.payments || {} }));
await sbClient.from("saved_players").insert(rows);
}

// 3. Saved Groups
if(savedGroups?.length){
await sbClient.from("saved_groups").delete().eq("user_id", uid);
const rows = savedGroups.map(g => ({
user_id: uid, name: g.name, players: g.players,
game: g.game, wager: g.wager
}));
await sbClient.from("saved_groups").insert(rows);
}

// 4. Betting History
if(userProfile?.bettingHistory?.length){
await sbClient.from("betting_history").delete().eq("user_id", uid);
const rows = userProfile.bettingHistory.map(r => ({
user_id: uid, date: r.date, game: r.game,
players: r.players, ledger: r.ledger
}));
await sbClient.from("betting_history").insert(rows);
}

// 5. Round History
if(userProfile?.rounds?.length){
await sbClient.from("rounds").delete().eq("user_id", uid);
const rows = userProfile.rounds.map(r => ({
user_id: uid, date: r.date, course: r.course,
strokes: r.strokes, holes: r.holes,
differential: r.differential, hole_scores: r.holeScores || []
}));
await sbClient.from("rounds").insert(rows);
}

if(showAlert) alert("✅ Data synced to server!");

} catch(err) {
console.error("Sync error:", err);
if(showAlert) alert("Sync failed: " + err.message);
} finally {
syncInProgress = false;
}
};

async function restoreFromServer(){
if(!sbClient || !currentUser) return;
const uid = currentUser.id;

try {
// Profile
const { data: profile } = await supabase
.from("profiles").select("*").eq("id", uid).single();
if(profile && userProfile){
userProfile.name            = profile.name || userProfile.name;
userProfile.currentHandicap = profile.handicap || userProfile.currentHandicap;
}

// Saved Players
const { data: players } = await supabase
.from("saved_players").select("*").eq("user_id", uid);
if(players?.length){
// Merge with local — server wins on conflict
players.forEach(sp => {
const local = savedPlayers.find(p => p.name.toLowerCase() === sp.name.toLowerCase());
if(!local) savedPlayers.push({ name: sp.name, payments: sp.payments || {} });
else local.payments = { ...local.payments, ...sp.payments };
});
localStorage.setItem("savedPlayers", JSON.stringify(savedPlayers));
}

// Saved Groups
const { data: groups } = await supabase
.from("saved_groups").select("*").eq("user_id", uid);
if(groups?.length){
savedGroups = groups.map(g => ({
name: g.name, players: g.players, game: g.game, wager: g.wager
}));
localStorage.setItem("savedGroups", JSON.stringify(savedGroups));
renderHomeGroups();
}

// Betting History
const { data: bHistory } = await supabase
.from("betting_history").select("*").eq("user_id", uid).order("date", { ascending: false });
if(bHistory?.length && userProfile){
userProfile.bettingHistory = bHistory.map(r => ({
date: r.date, game: r.game, players: r.players, ledger: r.ledger
}));
}

// Rounds
const { data: rounds } = await supabase
.from("rounds").select("*").eq("user_id", uid).order("date", { ascending: false });
if(rounds?.length && userProfile){
userProfile.rounds = rounds.map(r => ({
date: r.date, course: r.course, strokes: r.strokes,
holes: r.holes, differential: r.differential, holeScores: r.hole_scores || []
}));
}

if(userProfile) localStorage.setItem("userProfile", JSON.stringify(userProfile));

console.log("✅ Data restored from server");
} catch(err) {
console.error("Restore error:", err);
}
}

// Auto-sync after betting round ends
function autoSync(){
if(currentUser && sbClient){
setTimeout(() => syncToServer(false), 1000);
}
}

/* ================= TIER SYSTEM ================= */
/* ================= TIER SYSTEM ================= */

// Tiers: free | starter | pro | elite
// In production this will be driven by RevenueCat
let userTier = localStorage.getItem("userTier") || "free";

function setTier(tier){
userTier = tier;
localStorage.setItem("userTier", tier);
}

function getTier(){ return userTier; }

function hasStarterOrAbove(){ return ["starter","pro","elite"].includes(userTier); }
function hasProOrAbove(){     return ["pro","elite"].includes(userTier); }
function hasElite(){          return userTier === "elite"; }

// Group limits
function maxGroups(){
if(hasElite())       return Infinity;
if(hasProOrAbove())  return 5;
return 2;
}

/* ================= GAME ENGINE REGISTRY ================= */

window.GAME_ENGINES = {};

window.registerGame = function(name, engine){
GAME_ENGINES[name] = engine;
};

window.GAME_UI = {};

window.registerGameUI = function(name, ui){
GAME_UI[name] = ui;
};

window.GAME_RULES = {};

window.registerGameRules = function(name, rules){
GAME_RULES[name] = rules;
};

/* ================= STATE ================= */

let userProfile = JSON.parse(localStorage.getItem("userProfile"));

let currentGame = null;

let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

let bettingCourse = null; // { name, pars: [], tee: "" }

let historyStack=[];

let currentRound = null;

/* ================= GOLF COURSE API ================= */

const GOLF_PROXY = `${SUPABASE_URL}/functions/v1/golf-search`;

async function callGolfProxy(params){
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${GOLF_PROXY}?${qs}`, {
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type":  "application/json"
    }
  });
  if(!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}

window.searchCoursesAPI = async () => {
  const input  = document.getElementById("courseSearch");
  const status = document.getElementById("apiCourseStatus");
  const drop   = document.getElementById("apiCourseDropdown");
  const q      = input?.value?.trim();

  if(!q || q.length < 2) return;

  status.textContent = "Searching...";
  drop.innerHTML     = "";
  drop.classList.remove("hidden");

  try {
    const data    = await callGolfProxy({ action: "search", q });
    const courses = data.courses || [];

    status.textContent = courses.length
      ? `${courses.length} course${courses.length > 1 ? "s" : ""} found`
      : "No courses found — try a different search or add manually";

    drop.innerHTML = "";

    courses.slice(0, 10).forEach(c => {
      const row  = document.createElement("div");
      row.className = "course-row";

      const name = document.createElement("span");
      name.textContent = `${c.club_name} — ${c.location?.city || ""}, ${c.location?.state || ""}`.trim().replace(/,\s*$/, "");

      name.onclick = async () => {
        status.textContent = "Loading course data...";
        drop.classList.add("hidden");
        input.value = c.club_name;
        await loadAPICourse(c.id, c.club_name);
      };

      row.appendChild(name);
      drop.appendChild(row);
    });

  } catch(err) {
    status.textContent = "Search failed — check connection or add manually";
    drop.classList.add("hidden");
    console.error("Golf API error:", err);
  }
};

// Allow pressing Enter to search
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("courseSearch");
  if(input){
    input.addEventListener("keydown", e => {
      if(e.key === "Enter") searchCoursesAPI();
    });
  }

  // Betting course search — Enter key
  const bInput = document.getElementById("bettingCourseSearch");
  if(bInput){
    bInput.addEventListener("keydown", e => {
      if(e.key === "Enter") searchBettingCourse();
    });
  }

  // Dismiss betting dropdown on outside click
  document.addEventListener("click", e => {
    if(!e.target.closest("#bettingCourseSearch") &&
       !e.target.closest("#bettingCourseDropdown") &&
       !e.target.closest(".search-icon-btn")){
      document.getElementById("bettingCourseDropdown")?.classList.add("hidden");
    }
  });
});

async function loadAPICourse(courseId, clubName){
  const status    = document.getElementById("apiCourseStatus");
  const teeSelect = document.getElementById("teeSelect");

  try {
    const data   = await callGolfProxy({ action: "course", id: courseId });
    const course = data.course || data;

    const tees = {};

    // API returns tees.male and tees.female arrays
    const allTees = [
      ...(course.tees?.male   || []).map(t => ({ ...t, gender: "M" })),
      ...(course.tees?.female || []).map(t => ({ ...t, gender: "F" })),
    ];

    allTees.forEach(tee => {
      const holes    = tee.holes || [];
      const pars     = holes.map(h => h.par      || 4);
      const yardages = holes.map(h => h.yardage  || 0);

      // Label tee with gender suffix if same name exists for both
      const teeName = tee.tee_name +
        (allTees.filter(t => t.tee_name === tee.tee_name).length > 1
          ? ` (${tee.gender === "M" ? "Men" : "Women"})`
          : "");

      tees[teeName] = {
        rating:   parseFloat(tee.course_rating) || 72,
        slope:    parseInt(tee.slope_rating)    || 113,
        pars,
        yardages
      };
    });

    // Check if already saved — update tees if so
    const existing = savedCourses.find(c =>
      c.name.toLowerCase() === clubName.toLowerCase()
    );

    if(existing){
      existing.tees = tees;
    } else {
      savedCourses.push({
        name:    clubName,
        favorite: false,
        fromAPI: true,
        tees
      });
    }

    localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

    // Populate tee dropdown
    teeSelect.innerHTML = "";
    Object.keys(tees).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = t;
      teeSelect.appendChild(opt);
    });

    refreshCourseDropdown();

    const teeCount = Object.keys(tees).length;
    status.textContent = `✅ ${clubName} loaded — ${teeCount} tee box${teeCount !== 1 ? "es" : ""} found`;

  } catch(err) {
    status.textContent = "Failed to load course data — try adding manually";
    console.error("Course load error:", err);
  }
}


/* ================= BETTING COURSE SEARCH ================= */

window.searchBettingCourse = async () => {
  const input  = document.getElementById("bettingCourseSearch");
  const status = document.getElementById("bettingCourseStatus");
  const drop   = document.getElementById("bettingCourseDropdown");
  const q      = input?.value?.trim();
  if(!q || q.length < 2) return;

  status.textContent = "Searching...";
  drop.innerHTML = "";
  drop.classList.remove("hidden");

  try {
    const localMatches = savedCourses.filter(c =>
      c.name.toLowerCase().includes(q.toLowerCase())
    );
    const data    = await callGolfProxy({ action: "search", q });
    const courses = data.courses || [];
    drop.innerHTML = "";

    localMatches.forEach(c => {
      const row = document.createElement("div");
      row.className = "course-row";
      const name = document.createElement("span");
      name.textContent = "⭐ " + c.name;
      name.onclick = () => selectBettingCourse(c.name);
      row.appendChild(name);
      drop.appendChild(row);
    });

    courses.slice(0, 8).forEach(c => {
      const row = document.createElement("div");
      row.className = "course-row";
      const name = document.createElement("span");
      name.textContent = `${c.club_name} — ${c.location?.city || ""}, ${c.location?.state || ""}`.trim().replace(/,\s*$/, "");
      name.onclick = async () => {
        status.textContent = "Loading...";
        drop.classList.add("hidden");
        input.value = c.club_name;
        await loadBettingCourseFromAPI(c.id, c.club_name);
      };
      row.appendChild(name);
      drop.appendChild(row);
    });

    const total = localMatches.length + Math.min(courses.length, 8);
    status.textContent = total > 0 ? `${total} courses found` : "No courses found";
    if(!drop.children.length) drop.classList.add("hidden");

  } catch(err) {
    status.textContent = "Search failed";
    console.error(err);
  }
};

async function loadBettingCourseFromAPI(courseId, clubName){
  const status    = document.getElementById("bettingCourseStatus");
  try {
    const data   = await callGolfProxy({ action: "course", id: courseId });
    const course = data.course || data;
    const allTees = [
      ...(course.tees?.male   || []).map(t => ({ ...t, gender:"M" })),
      ...(course.tees?.female || []).map(t => ({ ...t, gender:"F" })),
    ];
    const tees = {};
    allTees.forEach(tee => {
      const name = tee.tee_name +
        (allTees.filter(t => t.tee_name === tee.tee_name).length > 1
          ? ` (${tee.gender === "M" ? "Men" : "Women"})` : "");
      tees[name] = { pars: (tee.holes||[]).map(h => h.par||4) };
    });
    if(!savedCourses.find(c => c.name.toLowerCase() === clubName.toLowerCase())){
      savedCourses.push({ name: clubName, favorite: false, fromAPI: true,
        tees: Object.fromEntries(Object.entries(tees).map(([k,v]) => [k, { ...v, rating:72, slope:113, yardages:[] }]))
      });
      localStorage.setItem("savedCourses", JSON.stringify(savedCourses));
    }
    populateBettingTees(clubName, tees);
    status.textContent = "\u2705 " + clubName;
  } catch(err) {
    status.textContent = "Failed to load";
  }
}

function selectBettingCourse(courseName){
  const input     = document.getElementById("bettingCourseSearch");
  const drop      = document.getElementById("bettingCourseDropdown");
  const status    = document.getElementById("bettingCourseStatus");
  input.value = courseName;
  drop.classList.add("hidden");
  const saved = savedCourses.find(c => c.name === courseName);
  if(saved && saved.tees){
    const teeMap = {};
    Object.entries(saved.tees).forEach(([name, tee]) => {
      teeMap[name] = { pars: tee.pars };
    });
    populateBettingTees(courseName, teeMap);
    status.textContent = "\u2705 " + courseName;
  }
}

function populateBettingTees(courseName, tees){
  const teeRow    = document.getElementById("bettingTeeRow");
  const teeSelect = document.getElementById("bettingTeeSelect");
  teeSelect.innerHTML = "";
  Object.keys(tees).forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    teeSelect.appendChild(opt);
  });
  teeRow.classList.remove("hidden");
  const firstTee = Object.keys(tees)[0];
  bettingCourse = { name: courseName, fullPars: tees[firstTee].pars };
  teeSelect.onchange = () => {
    bettingCourse = { name: courseName, fullPars: tees[teeSelect.value]?.pars || [] };
  };
}

function clearBettingCourse(){
  bettingCourse = null;
  const input  = document.getElementById("bettingCourseSearch");
  const drop   = document.getElementById("bettingCourseDropdown");
  const status = document.getElementById("bettingCourseStatus");
  const teeRow = document.getElementById("bettingTeeRow");
  if(input)  input.value = "";
  if(drop)   { drop.innerHTML = ""; drop.classList.add("hidden"); }
  if(status) status.textContent = "";
  if(teeRow) teeRow.classList.add("hidden");
}

/* ================= COURSE STORAGE ================= */


let savedCourses = JSON.parse(localStorage.getItem("savedCourses")) || [];

function refreshCourseDropdown(){

const dropdown = document.getElementById("courseDropdown");
const search = document.getElementById("courseSearch");

if(!dropdown || !search) return;

dropdown.innerHTML = "";

savedCourses.forEach(course=>{

const row = document.createElement("div");
row.className = "course-row";

const name = document.createElement("span");

name.textContent = (course.favorite ? "⭐ " : "") + course.name;

name.onclick = ()=>{
search.value = course.name;
dropdown.classList.add("hidden");

const teeSelect = document.getElementById("teeSelect");
teeSelect.innerHTML = "";

const tees = course.tees || { Default: { rating:72, slope:113, pars:course.pars } };

Object.keys(tees).forEach(t=>{
const opt = document.createElement("option");
opt.value = t;
opt.textContent = t;
teeSelect.appendChild(opt);
});
};

const del = document.createElement("span");
del.textContent = "✕";
del.className = "course-delete";

del.onclick = (e)=>{
e.stopPropagation();

if(!confirm(`Delete ${course.name}?`)) return;

savedCourses = savedCourses.filter(c=>c.name !== course.name);

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

/* 🔥 CLEAR SELECTION IF THIS COURSE WAS SELECTED */
const search = document.getElementById("courseSearch");

if(search && search.value === course.name){
search.value = "";

const teeSelect = document.getElementById("teeSelect");

if(teeSelect){
teeSelect.innerHTML = `<option value="Default">Default</option>`;
teeSelect.value = "Default";
}
}

refreshCourseDropdown();
};

const star = document.createElement("span");
star.textContent = "⭐";
star.style.cursor = "pointer";

star.onclick = (e)=>{

e.stopPropagation();

course.favorite = !course.favorite;

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();

};

row.appendChild(name);
row.appendChild(del);
row.appendChild(star);

dropdown.appendChild(row);

});

}

/*
Course Structure:

{
name: "Pine Valley",
pars: [4,4,3,5,4,4,3,4,5, 4,5,3,4,4,5,3,4,4],
}
*/

window.saveCourse = () => {

const name = document.getElementById("newCourseName").value.trim();
if(!name) return alert("Enter course name");

if(savedCourses.some(c => c.name.toLowerCase() === name.toLowerCase())){
return alert("Course already exists");
}

let pars = [];

for(let i=1;i<=18;i++){
const val = +document.getElementById(`par${i}`).value;
if(!val) return alert("Enter all 18 pars");
pars.push(val);
}

const teeName = document.getElementById("newTeeName").value.trim() || "Default";

savedCourses.push({
name,
favorite:false,
tees: {
[teeName]: {
rating: +document.getElementById("newTeeRating").value || 72,
slope: +document.getElementById("newTeeSlope").value || 113,
pars
}
}
});

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

closeCourseModal();

resetAddCourseModal();

refreshCourseDropdown();
};

function resetAddCourseModal(){

const name = document.getElementById("newCourseName");
if(name) name.value = "";

const tee = document.getElementById("newTeeName");
if(tee) tee.value = "";

const rating = document.getElementById("newTeeRating");
if(rating) rating.value = "";

const slope = document.getElementById("newTeeSlope");
if(slope) slope.value = "";

for(let i=1;i<=18;i++){
const par = document.getElementById(`par${i}`);
if(par) par.value = "";
}

}

/* ================= TEE MANAGER ================= */
function openTeeManager(){

document.body.classList.add("modal-open");

const courseName = document.getElementById("courseSearch").value;

const course = savedCourses.find(c => c.name === courseName);

if(!course){
alert("Select a course first");
return;
}

const teeList = document.getElementById("teeList");
teeList.innerHTML = "";

Object.keys(course.tees).forEach(name=>{

const tee = course.tees[name];

const row = document.createElement("div");
row.className = "tee-row";

row.innerHTML = `

<div>

<strong>${name}</strong>

<div style="font-size:12px;opacity:.8">
Rating
<input value="${tee.rating}"
class="tee-edit-rating"
inputmode="decimal"
onchange="editTee('${course.name}','${name}','rating',this.value)">

Slope
<input value="${tee.slope}"
class="tee-edit-slope"
inputmode="numeric"
onchange="editTee('${course.name}','${name}','slope',this.value)">
</div>

</div>

<button onclick="deleteTee('${course.name}','${name}')">✕</button>

`;

teeList.appendChild(row);

});

document.getElementById("teeManagerModal").classList.remove("hidden");

}

function closeTeeManager(){

document.body.classList.remove("modal-open");

document.getElementById("teeManagerModal").classList.add("hidden");

/* clear add tee inputs */

document.getElementById("teeNameInput").value = "";
document.getElementById("teeRatingInput").value = "";
document.getElementById("teeSlopeInput").value = "";

}

function addTeeToCourse(){

const courseName = document.getElementById("courseSearch").value;

const course = savedCourses.find(c => c.name === courseName);

if(!course){
alert("Select course first");
return;
}

const name = document.getElementById("teeNameInput").value.trim();
const rating = +document.getElementById("teeRatingInput").value || 72;
const slope = +document.getElementById("teeSlopeInput").value || 113;

if(!name){
alert("Enter tee name");
return;
}

if(course.tees[name]){
alert("Tee already exists");
return;
}

const basePars = Object.values(course.tees)[0].pars;

course.tees[name] = {
rating,
slope,
pars: [...basePars]
};

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();
openTeeManager();

document.getElementById("teeNameInput").value = "";
document.getElementById("teeRatingInput").value = "";
document.getElementById("teeSlopeInput").value = "";

}

function deleteTee(courseName, teeName){

const course = savedCourses.find(c => c.name === courseName);

if(!course) return;

if(Object.keys(course.tees).length <= 1){
alert("Cannot delete the last tee");
return;
}

if(!confirm(`Delete ${teeName} tee?`)) return;

delete course.tees[teeName];

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

// Refresh the tee dropdown immediately
const teeSelect = document.getElementById("teeSelect");
if(teeSelect){
teeSelect.innerHTML = "";
Object.keys(course.tees).forEach(t => {
const opt = document.createElement("option");
opt.value = t; opt.textContent = t;
teeSelect.appendChild(opt);
});
}

refreshCourseDropdown();
openTeeManager();

}

function editTee(courseName, teeName, field, value){

const course = savedCourses.find(c=>c.name===courseName);

if(!course) return;

if(field === "rating"){
course.tees[teeName].rating = +value;
}

if(field === "slope"){
course.tees[teeName].slope = +value;
}

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();

}

/* ================= SETTLE UP ================= */

const PAYMENT_APPS = [
{
id:    "venmo",
label: "Venmo",
color: "#008CFF",
icon:  "V",
url:   (handle, amount, note) =>
`https://venmo.com/${encodeURIComponent(handle.replace(/^@/,""))}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`
},
{
id:    "cashapp",
label: "Cash App",
color: "#00D632",
icon:  "$",
url:   (handle, amount, note) =>
`cashapp://cash.app/${encodeURIComponent(handle)}?amount=${amount}&note=${encodeURIComponent(note)}`
},
{
id:    "zelle",
label: "Zelle",
color: "#6D1ED4",
icon:  "Z",
url:   (handle, amount, note) =>
`https://enroll.zellepay.com/qr-codes?data=${encodeURIComponent(JSON.stringify({name:handle,action:"payment"}))}`
},
{
id:    "paypal",
label: "PayPal",
color: "#003087",
icon:  "P",
url:   (handle, amount, note) =>
`https://www.paypal.com/paypalme/${encodeURIComponent(handle)}/${amount}`
}
];

// Get payment handles for a player name from savedPlayers
function getPaymentHandles(playerName){
const p = savedPlayers.find(s => s.name.toLowerCase() === playerName.toLowerCase());
return p?.payments || {};
}

// Save payment handles back to savedPlayers
function savePaymentHandle(playerName, appId, handle){
if(!handle) return;
let p = savedPlayers.find(s => s.name.toLowerCase() === playerName.toLowerCase());
if(!p){
p = { name: playerName };
savedPlayers.push(p);
}
if(!p.payments) p.payments = {};
p.payments[appId] = handle;
localStorage.setItem("savedPlayers", JSON.stringify(savedPlayers));
}

// Internal: open the in-app handle input instead of prompt()
function askForHandle(playerName, appLabel, onConfirm){
const modal    = document.getElementById("handleInputModal");
const title    = document.getElementById("handleInputTitle");
const subtitle = document.getElementById("handleInputSubtitle");
const field    = document.getElementById("handleInputField");
const confirm  = document.getElementById("handleInputConfirm");

title.textContent    = appLabel + " Handle";
subtitle.textContent = `Enter ${playerName}'s ${appLabel} username`;
field.value          = "";
modal.classList.remove("hidden");
setTimeout(() => field.focus(), 100);

confirm.onclick = () => {
const val = field.value.trim();
if(!val) return;
modal.classList.add("hidden");
onConfirm(val);
};

field.onkeydown = (e) => {
if(e.key === "Enter") confirm.onclick();
};
}

window.closeHandleModal = () => {
document.getElementById("handleInputModal")?.classList.add("hidden");
};

window.openSettleModal = () => {
// Hide leaderboard modal so settle modal appears on top cleanly
const lbModal = document.getElementById("leaderboardModal");
if(lbModal) lbModal.classList.add("hidden");

const list = document.getElementById("settleList");
if(!list) return;
list.innerHTML = "";

// Build debts: each person with negative ledger owes those with positive
const debts = [];
const totalWon = Object.values(ledger).filter(v => v > 0).reduce((a,b) => a+b, 0);

Object.entries(ledger).forEach(([name, amount]) => {
if(amount < 0){
const winners = Object.entries(ledger).filter(([n,v]) => v > 0).sort((a,b) => b[1]-a[1]);
winners.forEach(([winner, winAmt]) => {
const share = Math.abs(amount) * (winAmt / (totalWon || 1));
if(share > 0.01) debts.push({ from: name, to: winner, amount: +share.toFixed(2) });
});
}
});

if(!debts.length){
list.innerHTML = `<p style="text-align:center;opacity:.6;padding:20px 0;">No debts to settle!</p>`;
} else {
debts.forEach(debt => {
const handles = getPaymentHandles(debt.to);
const card    = document.createElement("div");
card.className = "settle-card";

card.innerHTML = `
<div class="settle-card-header">
<div>
<div style="font-weight:700;font-size:15px;">${debt.from} <span style="opacity:.5;">→</span> ${debt.to}</div>
<div style="font-size:12px;opacity:.55;margin-top:2px;">owes</div>
</div>
<div style="font-size:24px;font-weight:800;color:#e74c3c;">$${debt.amount.toFixed(2)}</div>
</div>
`;

const btnRow = document.createElement("div");
btnRow.className = "settle-btn-row";

PAYMENT_APPS.forEach(app => {
const savedHandle = handles[app.id] || "";
const btn = document.createElement("button");
btn.className = "settle-app-btn";
btn.style.cssText = `background:${app.color};max-width:none;padding:10px 6px;flex:1;font-size:11px;font-weight:700;margin-top:0;line-height:1.4;border-radius:10px;`;
btn.innerHTML = `<div style="font-size:18px;">${app.icon}</div><div>${app.label}</div>`;
if(savedHandle){
btn.innerHTML += `<div style="font-size:9px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${savedHandle}</div>`;
}

btn.onclick = () => {
const launch = (handle) => {
savePaymentHandle(debt.to, app.id, handle);
const note = `Tee Box Bets${currentGame ? " - " + (currentGame.charAt(0).toUpperCase()+currentGame.slice(1)) : ""}`;
const url  = app.url(handle, debt.amount, note);
window.open(url, "_blank");
};
if(savedHandle){
launch(savedHandle);
} else {
askForHandle(debt.to, app.label, (handle) => {
// Update the button label with saved handle
const handleEl = document.createElement("div");
handleEl.style.cssText = "font-size:9px;opacity:.8;";
handleEl.textContent = handle;
btn.appendChild(handleEl);
launch(handle);
});
}
};
btnRow.appendChild(btn);
});

card.appendChild(btnRow);
list.appendChild(card);
});
}

document.getElementById("settleModal").classList.remove("hidden");
};

window.closeSettleModal = () => {
document.getElementById("settleModal")?.classList.add("hidden");
// Restore leaderboard modal
const lbModal = document.getElementById("leaderboardModal");
if(lbModal) lbModal.classList.remove("hidden");
};

/* ================= SAVED PLAYERS & GROUPS ================= */

let savedPlayers = JSON.parse(localStorage.getItem("savedPlayers")) || [];
let savedGroups  = JSON.parse(localStorage.getItem("savedGroups"))  || [];

// ── Save a player by name ────────────────────────────────────────────────────
function savePlayer(name){
if(!name || savedPlayers.find(p => p.name.toLowerCase() === name.toLowerCase())) return;
savedPlayers.push({ name });
localStorage.setItem("savedPlayers", JSON.stringify(savedPlayers));
}

// ── Autocomplete on player inputs ───────────────────────────────────────────
function attachPlayerAutocomplete(input){
if(!input || input.dataset.acAttached) return;
input.dataset.acAttached = "1";

const wrap = document.createElement("div");
wrap.style.cssText = "position:relative;";
input.parentNode.insertBefore(wrap, input);
wrap.appendChild(input);

const drop = document.createElement("div");
drop.className = "course-dropdown hidden";
drop.style.cssText = "position:absolute;top:100%;left:0;right:0;z-index:200;";
wrap.appendChild(drop);

input.addEventListener("input", () => {
const q = input.value.trim().toLowerCase();
if(!q){ drop.classList.add("hidden"); return; }

const matches = savedPlayers.filter(p =>
p.name.toLowerCase().startsWith(q) &&
p.name.toLowerCase() !== q
).slice(0, 5);

if(!matches.length){ drop.classList.add("hidden"); return; }

drop.innerHTML = "";
matches.forEach(p => {
const row = document.createElement("div");
row.className = "course-row";
const span = document.createElement("span");
span.textContent = p.name;
span.onclick = () => {
input.value = p.name;
drop.classList.add("hidden");
input.dispatchEvent(new Event("change"));
};
row.appendChild(span);
drop.appendChild(row);
});
drop.classList.remove("hidden");
});

document.addEventListener("click", e => {
if(!wrap.contains(e.target)) drop.classList.add("hidden");
}, { capture: false });
}

// Called from buildPlayers to attach autocomplete to all name inputs
function attachAllAutocomplete(){
document.querySelectorAll("#teamAInputs input, #teamBInputs input").forEach(attachPlayerAutocomplete);
}

// ── Groups Manager ───────────────────────────────────────────────────────────
window.openGroupsManager = () => {
renderGroupsList();
document.getElementById("groupsModal").classList.remove("hidden");
};

window.closeGroupsManager = () => {
document.getElementById("groupsModal").classList.add("hidden");
};

function renderGroupsList(){
const list = document.getElementById("groupsList");
list.innerHTML = "";

if(!savedGroups.length){
list.innerHTML = `<p style="opacity:.6;text-align:center;padding:20px 0;">No groups saved yet.<br>Enter players during a bet and tap 💾 Save Group.</p>`;
return;
}

savedGroups.forEach((g, i) => {
const card = document.createElement("div");
card.className = "group-card";

card.innerHTML = `
<div class="group-card-info">
<div class="group-card-name">${g.name}</div>
<div class="group-card-sub">
${g.players.join(", ")}
${g.game ? " · " + g.game.charAt(0).toUpperCase() + g.game.slice(1) : ""}
${g.wager ? " · $" + g.wager : ""}
</div>
</div>
<div class="group-card-actions">
<button class="group-quick-btn" onclick="quickStartGroup(${i})">⚡ Start</button>
<button class="group-del-btn" onclick="deleteGroup(${i})">✕</button>
</div>
`;

list.appendChild(card);
});

// Also render on home screen
renderHomeGroups();
}

function renderHomeGroups(){
const box = document.getElementById("homeGroups");
if(!box) return;
box.innerHTML = "";

if(!savedGroups.length) return;

const label = document.createElement("div");
label.style.cssText = "font-size:13px;opacity:.6;margin-bottom:8px;font-weight:600;";
label.textContent = "Quick Start";
box.appendChild(label);

savedGroups.forEach((g, i) => {
const card = document.createElement("div");
card.className = "group-card";
card.innerHTML = `
<div class="group-card-info">
<div class="group-card-name">${g.name}</div>
<div class="group-card-sub">${g.players.join(", ")}${g.game ? " · " + g.game.charAt(0).toUpperCase() + g.game.slice(1) : ""}${g.wager ? " · $" + g.wager : ""}</div>
</div>
<button class="group-quick-btn" onclick="quickStartGroup(${i})">⚡ Start</button>
`;
box.appendChild(card);
});
}

window.deleteGroup = (i) => {
if(!confirm(`Delete "${savedGroups[i].name}"?`)) return;
savedGroups.splice(i, 1);
localStorage.setItem("savedGroups", JSON.stringify(savedGroups));
renderGroupsList();
renderHomeGroups();
};

// ── Quick Start ──────────────────────────────────────────────────────────────
window.quickStartGroup = (i) => {
const g = savedGroups[i];

closeGroupsManager();

// Set game if saved
if(g.game){
currentGame = g.game;
} else {
currentGame = "skins"; // sensible default
}

// Set players
players  = [...g.players];
teams    = { A:[], B:[] };
ledger   = {};

// For FFA games put all in A, for team games split evenly
if(g.players.length === 4 && currentGame !== "wolf" && currentGame !== "bingo" && currentGame !== "dots"){
teams.A = [g.players[0], g.players[1]];
teams.B = [g.players[2], g.players[3]];
} else {
teams.A = [...g.players];
}

players.forEach(p => ledger[p] = 0);

// Pre-fill wager
if(g.wager){
baseWager = g.wager;
document.getElementById("baseWager").value = g.wager;
}

// Configure UI for this game (same as selectGame does)
selectGame(currentGame);

// Skip ahead to settings after a tick
setTimeout(() => {
// Pre-fill player inputs
const aInputs = document.querySelectorAll("#teamAInputs input");
const bInputs = document.querySelectorAll("#teamBInputs input");
teams.A.forEach((p,i) => { if(aInputs[i]) aInputs[i].value = p; });
teams.B.forEach((p,i) => { if(bInputs[i]) bInputs[i].value = p; });

show("step-settings");
}, 50);
};

// ── Save Group prompt ────────────────────────────────────────────────────────
window.promptSaveGroup = () => {
const names = [
...Array.from(document.querySelectorAll("#teamAInputs input")).map(i => i.value.trim()),
...Array.from(document.querySelectorAll("#teamBInputs input")).map(i => i.value.trim()),
].filter(Boolean);

if(names.length < 2){
alert("Enter at least 2 player names first.");
return;
}

document.getElementById("saveGroupName").value = names.join(", ");
document.getElementById("saveGroupGame").value = currentGame || "";
document.getElementById("saveGroupWager").value = "";

// Build payment fields for each player
const payFields = document.getElementById("saveGroupPaymentFields");
if(payFields){
payFields.innerHTML = "";
names.forEach(name => {
const existing = savedPlayers.find(p => p.name.toLowerCase() === name.toLowerCase());
const handles  = existing?.payments || {};
const section  = document.createElement("div");
section.style.cssText = "margin-bottom:14px;";
section.innerHTML = `<div style="font-weight:700;font-size:13px;margin-bottom:6px;">${name}</div>
${PAYMENT_APPS.map(app => `
<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
<div style="width:64px;font-size:12px;opacity:.7;">${app.label}</div>
<input id="pay_${name}_${app.id}" placeholder="@username"
style="flex:1;font-size:13px;padding:8px 12px;"
value="${handles[app.id]||''}">
</div>`).join("")}`;
payFields.appendChild(section);
});
}

document.getElementById("saveGroupModal").classList.remove("hidden");
};

window.closeSaveGroup = () => {
document.getElementById("saveGroupModal").classList.add("hidden");
};

window.confirmSaveGroup = () => {
const name   = document.getElementById("saveGroupName").value.trim();
const game   = document.getElementById("saveGroupGame").value;
const wager  = +document.getElementById("saveGroupWager").value || 0;

if(!name){ alert("Enter a group name"); return; }

// Check group limit
if(savedGroups.length >= maxGroups()){
closeSaveGroup();
openPremiumScreen("pro");
return;
}

const names = [
...Array.from(document.querySelectorAll("#teamAInputs input")).map(i => i.value.trim()),
...Array.from(document.querySelectorAll("#teamBInputs input")).map(i => i.value.trim()),
].filter(Boolean);

// Save each player individually + their payment handles
names.forEach(name => {
savePlayer(name);
PAYMENT_APPS.forEach(app => {
const input = document.getElementById(`pay_${name}_${app.id}`);
if(input?.value?.trim()){
savePaymentHandle(name, app.id, input.value.trim());
}
});
});

savedGroups.push({ name, players: names, game: game||null, wager: wager||null });
localStorage.setItem("savedGroups", JSON.stringify(savedGroups));
localStorage.setItem("savedPlayers", JSON.stringify(savedPlayers));

closeSaveGroup();
renderHomeGroups();
alert(`"${name}" saved!`);
};

/* ================= HAPTIC ================= */
function tapHaptic(){
    if (navigator.vibrate){
        navigator.vibrate(10);
    }
}

/* ================= AUTO DECIMAL ================= */
function autoDecimal(el){

el.addEventListener("beforeinput", (e)=>{
// Prevent second decimal
if(e.data === "." && el.value.includes(".")){
e.preventDefault();
}
});

el.addEventListener("input", ()=>{

let val = el.value.replace(/[^\d.]/g,"");

// Auto insert decimal after 2 digits if none exists
if(!val.includes(".") && val.length > 2){
val = val.slice(0,2) + "." + val.slice(2);
}

// Ensure only one decimal
const parts = val.split(".");
if(parts.length > 2){
val = parts[0] + "." + parts[1];
}

el.value = val;

});

}

function numericOnly(el){
el.addEventListener("input",()=>{
el.value = el.value.replace(/\D/g,"");
});
}

/* ================= HANDICAP MATH ================= */

function calculateDifferential(strokes, rating, slope){
return Number(
((strokes - rating) * 113 / slope).toFixed(1)
);
}

function calculateHandicapIndex(rounds){

// only rounds that have differentials
const diffs = rounds
.filter(r => r.differential !== undefined)
.map(r => r.differential)
.slice(-20); // most recent 20

if(diffs.length < 3) return null; // USGA minimum safety

// take lowest 8
const lowest = diffs
.sort((a,b)=>a-b)
.slice(0, Math.min(8, diffs.length));

// average
const avg = lowest.reduce((a,b)=>a+b,0) / lowest.length;

// round to 1 decimal
return Number(avg.toFixed(1));
}

function calculateHandicapFromDiffs(diffs){

const recent = diffs.slice(-20).sort((a,b)=>a-b);
const count = recent.length;

if(count < 3) return null;

let use = 1;
if(count >= 6) use = 2;
if(count >= 9) use = 3;
if(count >= 12) use = 4;
if(count >= 15) use = 5;
if(count >= 17) use = 6;
if(count >= 19) use = 7;
if(count >= 20) use = 8;

const selected = recent.slice(0,use);
const avg = selected.reduce((a,b)=>a+b,0) / use;

return Number((avg * 0.96).toFixed(1));
}

function updateHandicap(){

const diffs = userProfile.rounds
.map(r => r.differential)
.filter(d => d !== undefined);

const newHdcp = calculateHandicapFromDiffs(diffs);

if(newHdcp !== null){
userProfile.currentHandicap = newHdcp;
}else{
    userProfile.currentHandicap = 0;
}
}

/* ================= BETTING STATS ================= */

function updateBettingStats(){

const myName = userProfile.name;
const myNet = ledger[myName] || 0;

if(myNet > 0){
userProfile.bettingStats.totalWon += myNet;
}
if(myNet < 0){
userProfile.bettingStats.totalLost += Math.abs(myNet);
}

userProfile.bettingStats.totalPlayed += 1;

}


/* ================= DOM ================= */

const skinsBox = document.getElementById("skinsBox");
const vegasBox = document.getElementById("vegasBox");
const nassauBox = document.getElementById("nassauBox");

const teamAInputs = document.getElementById("teamAInputs");
const teamBInputs = document.getElementById("teamBInputs");

const teamALabel = document.getElementById("teamALabel");
const teamBLabel = document.getElementById("teamBLabel");

const birdieToggle = document.getElementById("birdieToggle");
const eagleToggle = document.getElementById("eagleToggle");

const holeDisplay = document.getElementById("holeDisplay");
const potDisplay = document.getElementById("potDisplay");
const leaderboard = document.getElementById("leaderboard");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardModalList = document.getElementById("leaderboardModalList");
const leaderboardFinishBtn = document.getElementById("leaderboardFinishBtn");

const teamAPlayers = document.getElementById("teamAPlayers");
const teamBPlayers = document.getElementById("teamBPlayers");


const sideBetBtn = document.getElementById("sideBetBtn");
const sideBetModal = document.getElementById("sideBetModal");
const sideAmount = document.getElementById("sideAmount");
const sideMode = document.getElementById("sideMode");
const sideWinners = document.getElementById("sideWinners");

const frontWager = document.getElementById("frontWager");
const backWager = document.getElementById("backWager");
const totalWager = document.getElementById("totalWager");
const holeLimitSelect = document.getElementById("holeLimit");

const lockedNotice = document.getElementById("lockedNotice");
const baseWagerWrapper = document.getElementById("baseWagerWrapper");

const playStyleBox = document.getElementById("playStyle");
const playerCountBox = document.getElementById("playerCount");
const playStyleLabel = document.getElementById("playStyleLabel");
const playerCountLabel = document.getElementById("playerCountLabel");


/* ================= UI TOGGLES ================= */

birdieToggle.onchange = () => {
 if (birdieToggle.checked) eagleToggle.checked = false;
};

eagleToggle.onchange = () => {
 if (eagleToggle.checked) birdieToggle.checked = false;
};

function applyBonus(){
if(birdieToggle.checked){
skinsGame.applyBonus("birdie");
}
if(eagleToggle.checked){
skinsGame.applyBonus("eagle");
}
}

function setPar(value, el){

    tapHaptic();

document.getElementById("holePar").value = value;

document.querySelectorAll(".par-btn").forEach(b=>{
b.classList.remove("active");
});

el.classList.add("active");
}

["firToggle","girToggle"].forEach(id=>{


const btn = document.getElementById(id);

btn.onclick = ()=>{
    tapHaptic();
btn.classList.toggle("active");
};
});

window.toggleManualRound = () => {
document.getElementById("manualRoundBox")
.classList.toggle("hidden");
};

/* ================= NAV ================= */

const headerMap = {
"step-home": "Tee Box Bets",

"step-game": "Select Game",
"rules-screen": "Game Rules",

"step-style": "Play Style",
"step-teams": "Teams",
"step-players": "Players",
"step-settings": "Wager Settings",
"step-dots": "Choose Dots",

"game-screen": "Live Game",

"round-setup": "Round Setup",
"round-play": "Round In Progress",

"profile-screen": "Your Profile",
"profile-setup": "Edit Profile"
};

function updateHeader(id){
const title = document.getElementById("appTitle");
title.classList.add("title-swap");

setTimeout(()=>{

/* Live betting game */
if(id === "game-screen"){
const gameName =
currentGame === "skins" ? "Skins" :
currentGame === "vegas" ? "Vegas" :
currentGame === "nassau" ? "Nassau" :
currentGame === "wolf" ? "Wolf" :
currentGame === "baseball" ? "Baseball" :
currentGame === "bingo" ? "Bingo Bango Bongo" :
currentGame === "dots" ? "Dots" :
currentGame === "nine" ? "9-Point" :
currentGame === "sixes" ? "Sixes" :
currentGame === "battle" ? "Net Battle" :
"Game";

title.textContent = `${gameName} – Hole ${hole}`;
title.classList.remove("title-swap");
return;
}

/* Round tracking */
if(id === "round-play" && currentRound){
title.textContent =
`Round – Hole ${currentRound.currentHole} of ${currentRound.holes}`;
title.classList.remove("title-swap");
return;
}

/* Default */
title.textContent = headerMap[id] || "Tee Box Bets";
title.classList.remove("title-swap");

},120);
}

let screenHistory = [];

function show(id){
tapHaptic();

const current = document.querySelector("section:not(.hidden)");

/* 🔥 Reset round setup if leaving it */
if(current && current.id === "round-setup" && id !== "round-setup"){
resetRoundSetup();
}

if (current && current.id !== id) {
screenHistory.push(current.id);
}

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

document.getElementById(id).classList.remove("hidden");

// ✅ Side bet ONLY during live game
if(id === "game-screen"){
sideBetBtn.classList.remove("hidden");
}else{
sideBetBtn.classList.add("hidden");
}

// End Round pill only during round tracking
const endRoundBtn = document.getElementById("endRoundBtn");
if(endRoundBtn){
if(id === "round-play"){
endRoundBtn.classList.remove("hidden");
}else{
endRoundBtn.classList.add("hidden");
}
}

// End Round pill for betting game
const endBetBtn = document.getElementById("endBetBtn");
if(endBetBtn){
if(id === "game-screen"){
endBetBtn.classList.remove("hidden");
}else{
endBetBtn.classList.add("hidden");
}
}

updateHeader(id);
syncBackButton();
}


function syncBackButton(){
const btn = document.getElementById("navBack");
const current = document.querySelector("section:not(.hidden)");

// Screens where back should be disabled
const lockScreens = ["round-play", "game-screen"];

if (!current || lockScreens.includes(current.id)) {
btn.style.display = "none";
return;
}

btn.style.display = screenHistory.length ? "flex" : "none";
}

window.goBack = () => {
 tapHaptic();

 if (!screenHistory.length) return;

const prev = screenHistory.pop();

/* If leaving round setup, reset the fields */
const current = document.querySelector("section:not(.hidden)");

if(current && current.id === "round-setup"){
resetRoundSetup();
}

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

 document.getElementById(prev).classList.remove("hidden");

 syncBackButton();
 updateHeader(prev);
};

function resetRoundSetup(){

const search = document.getElementById("courseSearch");
if(search) search.value = "";

// Clear API search results
const apiDrop   = document.getElementById("apiCourseDropdown");
const apiStatus = document.getElementById("apiCourseStatus");
if(apiDrop)   { apiDrop.innerHTML = ""; apiDrop.classList.add("hidden"); }
if(apiStatus)   apiStatus.textContent = "";

const teeSelect = document.getElementById("teeSelect");

if(teeSelect){
teeSelect.innerHTML = `<option value="Default">Default</option>`;
teeSelect.value = "Default";
}

const rating = document.getElementById("courseRating");
if(rating) rating.value = "";

const slope = document.getElementById("courseSlope");
if(slope) slope.value = "";

const holes = document.getElementById("roundHoles");
if(holes) holes.value = "9";

const nineType = document.getElementById("nineType");
if(nineType) nineType.value = "front";

}

function goHomeClean(){

userProfile = JSON.parse(localStorage.getItem("userProfile"));

screenHistory = [];

// Reset game state so next game starts fresh
currentGame = null;
playStyle = null;
playerCount = null;
players = [];
teams = { A:[], B:[] };
ledger = {};
hole = 1;
historyStack = [];

// Reset play style and player count dropdowns to defaults
playStyleBox.innerHTML = `
<option value="ffa">Free For All</option>
<option value="teams">Teams</option>
`;
playStyleBox.value = "ffa";
playStyleBox.classList.remove("hidden");
playStyleLabel.classList.remove("hidden");

playerCountBox.innerHTML = `
<option value="2">2</option>
<option value="3">3</option>
<option value="4">4</option>
`;
playerCountBox.value = "4";
playerCountBox.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");

lockedNotice.classList.add("hidden");

resetRoundSetup();
document.getElementById("baseWager").value = "";
document.getElementById("frontWager").value = "";
document.getElementById("backWager").value = "";
document.getElementById("totalWager").value = "";

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

document.getElementById("step-home").classList.remove("hidden");

// Always hide floating action buttons on home
document.getElementById("sideBetBtn")?.classList.add("hidden");
document.getElementById("endRoundBtn")?.classList.add("hidden");
document.getElementById("endBetBtn")?.classList.add("hidden");

// Clear betting course selection
clearBettingCourse();

// Refresh home screen groups
renderHomeGroups();

// Show/hide ads based on tier
updateAdVisibility();

// Update account bar
updateAccountBar();

updateHeader("step-home");
syncBackButton();

}

window.toggleManualRound = () => {
const box = document.getElementById("manualRoundBox");
const btn = document.getElementById("manualToggleBtn");

const open = box.classList.contains("hidden");

box.classList.toggle("hidden");

btn.textContent = open
? "Cancel Previous Round"
: "Add Previous Round";
};

window.goHome = goHomeClean;
window.goGameSelect = () => show("step-game");

window.showRules = () => {
const order = ["skins","vegas","nassau","wolf","baseball","bingo","dots","nine","sixes","battle"];
const box = document.getElementById("rulesContent");
if(box){
box.innerHTML = order.map(key => {
const r = GAME_RULES[key];
if(!r) return "";
return `<div class="rules-block"><h3>${r.icon || ""} ${r.title}</h3>${r.description}</div>`;
}).join('<hr class="rules-divider">');
}
show("rules-screen");
};

window.openCourseModal = () =>{
document.getElementById("courseModal").classList.remove("hidden");
};

window.closeCourseModal = () =>{
document.getElementById("courseModal").classList.add("hidden");
resetAddCourseModal();
};

function startGame(game){
GameRouter.start(game);
}

/* ================= PROFILE CHECK ================= */


document.addEventListener("DOMContentLoaded", () => {

const ratingInput = document.getElementById("courseRating");
const slopeInput = document.getElementById("courseSlope");
const manualRating = document.getElementById("manualRating");
const manualSlope = document.getElementById("manualSlope");
const newTeeRating = document.getElementById("newTeeRating");
const newTeeSlope = document.getElementById("newTeeSlope");
const teeRatingInput = document.getElementById("teeRatingInput");
const teeSlopeInput = document.getElementById("teeSlopeInput");

if(ratingInput) autoDecimal(ratingInput);
if(manualRating) autoDecimal(manualRating);
if(teeRatingInput) autoDecimal(teeRatingInput);
if(newTeeRating) autoDecimal(newTeeRating);

if(slopeInput) numericOnly(slopeInput);
if(manualSlope) numericOnly(manualSlope);
if(newTeeSlope) numericOnly(newTeeSlope);
if(teeSlopeInput) numericOnly(teeSlopeInput);

if(!userProfile){
show("profile-setup");
}
sideBetBtn.classList.add("hidden");

document.getElementById("manualSaveBtn").onclick = addManualRound;

const roundHoles = document.getElementById("roundHoles");
const nineType = document.getElementById("nineType");

if(roundHoles && nineType){

roundHoles.addEventListener("change", ()=>{

if(roundHoles.value === "18"){
nineType.classList.add("hidden");
}else{
nineType.classList.remove("hidden");
}

});

}

// Betting nine type show/hide
const holeLimitEl     = document.getElementById("holeLimit");
const bettingNineType = document.getElementById("bettingNineType");

if(holeLimitEl && bettingNineType){
holeLimitEl.addEventListener("change", ()=>{
if(holeLimitEl.value === "18"){
bettingNineType.classList.add("hidden");
} else {
bettingNineType.classList.remove("hidden");
}
});
}
refreshCourseDropdown();
renderHomeGroups();
updateAdVisibility();
initSupabase();
updateAccountBar();

const courseSearchEl = document.getElementById("courseSearch");
const dropdown = document.getElementById("courseDropdown");

if(courseSearchEl && dropdown){

courseSearchEl.addEventListener("focus", ()=>{
dropdown.classList.remove("hidden");
});

courseSearchEl.addEventListener("input", ()=>{

const term = courseSearchEl.value.trim().toLowerCase();

dropdown.innerHTML = "";

/* ===== SAVED COURSES ===== */

savedCourses
.filter(c=>c.name.toLowerCase().includes(term))
.forEach(course=>{

const row = document.createElement("div");
row.className = "course-row";

const name = document.createElement("span");
name.textContent = course.name;

name.onclick = ()=>{
courseSearchEl.value = course.name;
dropdown.classList.add("hidden");
};

const del = document.createElement("span");
del.textContent = "✕";
del.className = "course-delete";

del.onclick = (e)=>{
e.stopPropagation();

if(!confirm(`Delete ${course.name}?`)) return;

savedCourses = savedCourses.filter(c=>c.name !== course.name);
localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

if(courseSearchEl.value === course.name){

courseSearchEl.value = "";

const teeSelect = document.getElementById("teeSelect");

if(teeSelect){
teeSelect.innerHTML = `<option value="Default">Default</option>`;
teeSelect.value = "Default";
}

}

refreshCourseDropdown();
search.dispatchEvent(new Event("input"));

};

row.appendChild(name);
row.appendChild(del);

dropdown.appendChild(row);

});



});

document.addEventListener("click",(e)=>{
if(!e.target.closest(".course-select-wrapper")){
dropdown.classList.add("hidden");
// Also hide API results dropdown
const apiDrop = document.getElementById("apiCourseDropdown");
if(apiDrop) apiDrop.classList.add("hidden");
}
});

}

/* ===== HOME DASHBOARD ===== */

if(userProfile){

/* DASH ROUNDS */

const dashRounds = document.getElementById("dashRounds");
if(dashRounds){
const rounds = userProfile.rounds ? userProfile.rounds.length : 0;
dashRounds.textContent = rounds;
}

/* DASH HANDICAP */

const dashHandicap = document.getElementById("dashHandicap");
if(dashHandicap){
const handicap = userProfile.currentHandicap || 0;
dashHandicap.textContent = handicap.toFixed(1);
}

/* DASH BETTING */

const dashBetting = document.getElementById("dashBetting");
if(dashBetting){

const totalWon = userProfile.bettingStats ? userProfile.bettingStats.totalWon : 0;
const totalLost = userProfile.bettingStats ? userProfile.bettingStats.totalLost : 0;

const net = totalWon - totalLost;

dashBetting.textContent =
(net >= 0 ? "+" : "") + "$" + net.toFixed(2);

}

}

/* ===== SCORE INPUT STANDARD ===== */

document.querySelectorAll(".score-input").forEach(input=>{

input.setAttribute("type","number");
input.setAttribute("inputmode","numeric");
input.setAttribute("pattern","[0-9]*");

input.addEventListener("input",()=>{
if(input.value.length>2){
input.value=input.value.slice(0,2);
}
});

});

/* ===== PUTTS / PENALTIES AUTO-ADVANCE ===== */

const holePutts     = document.getElementById("holePutts");
const holePenalties = document.getElementById("holePenalties");

if(holePutts){
holePutts.addEventListener("input", () => {
if(holePutts.value.length >= 1){
holePenalties?.focus();
}
});
}

if(holePenalties){
holePenalties.addEventListener("input", () => {
if(holePenalties.value.length >= 1){
holePenalties.blur();
}
});
}

});
/* ================= GAME SELECT ================= */

window.selectGame=game=>{
document.getElementById("skinsBox").classList.add("hidden");
document.getElementById("vegasBox").classList.add("hidden");
document.getElementById("nassauBox").classList.add("hidden");
currentGame=game;

if(game === "wolf"){

playStyle = "ffa";

/* FORCE DROPDOWN TO ONLY FFA */
playStyleBox.innerHTML = `<option value="ffa" selected>Free For All</option>`;
playStyleBox.value = "ffa";

playStyleBox.classList.remove("hidden");
playStyleLabel.classList.remove("hidden");

/* PLAYER COUNT 3 OR 4 */
playerCountBox.innerHTML = `
<option value="3">3 Players</option>
<option value="4" selected>4 Players</option>
`;

playerCountBox.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");

/* MESSAGE */
lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "Wolf is Free For All only";

}



if(game === "baseball"){

playStyle = "teams";

// ✅ ONLY TEAMS (NO FFA)
playStyleBox.innerHTML = `<option value="teams" selected>Teams</option>`;
playStyleBox.value = "teams";

// Hide playstyle completely
playStyleBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");

// ✅ Allow 2 or 4 players
playerCountBox.innerHTML = `
<option value="2">2 Players (1v1)</option>
<option value="4" selected>4 Players (2v2)</option>
`;

playerCountBox.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");

// ✅ FORCE TEAM NAMES
teamAName = "Away";
teamBName = "Home";

lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "Baseball is Home vs Away";

}

if(game === "bingo"){

playStyle = "ffa";

playStyleBox.innerHTML = `<option value="ffa" selected>Free For All</option>`;
playStyleBox.value = "ffa";
playStyleBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");

playerCountBox.innerHTML = `
<option value="2">2 Players</option>
<option value="3">3 Players</option>
<option value="4" selected>4 Players</option>
`;
playerCountBox.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");

lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "Bingo Bango Bongo is Free For All";

}

if(game === "dots"){

playStyle = "ffa";

playStyleBox.innerHTML = `<option value="ffa" selected>Free For All</option>`;
playStyleBox.value = "ffa";
playStyleBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");

playerCountBox.innerHTML = `
<option value="2">2 Players</option>
<option value="3">3 Players</option>
<option value="4" selected>4 Players</option>
`;
playerCountBox.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");

lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "Dots is Free For All";

}

if(game === "nine"){
playStyle = "ffa";
playStyleBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");
playerCountBox.innerHTML = `<option value="3" selected>3 Players</option>`;
playerCountBox.classList.add("hidden");
playerCountLabel.classList.add("hidden");
lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "9-Point is a 3-player game";
}

if(game === "sixes"){
playStyle = "teams";
playerCount = 4;
playStyleBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");
playerCountBox.classList.add("hidden");
playerCountLabel.classList.add("hidden");
lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "Sixes must be played with 4 players";
}

if(game === "battle"){
playStyleBox.innerHTML = `
<option value="ffa">Free For All</option>
<option value="teams">2v2 Teams</option>
`;
playStyleBox.value = "ffa";
playStyleBox.classList.remove("hidden");
playStyleLabel.classList.remove("hidden");
playerCountBox.innerHTML = `
<option value="2">2 Players</option>
<option value="3">3 Players</option>
<option value="4" selected>4 Players</option>
`;
playerCountBox.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");
lockedNotice.classList.remove("hidden");
lockedNotice.textContent = "Net Battle — handicap strokes applied automatically";
}

if(game==="vegas" || game==="nassau"){
lockedNotice.classList.remove("hidden");

playStyleBox.classList.add("hidden");
playerCountBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");
playerCountLabel.classList.add("hidden");

playStyle="teams";
playerCount=4;
}else if(game !== "wolf" && game !== "baseball" && game !== "bingo" && game !== "dots" && game !== "nine" && game !== "sixes" && game !== "battle"){
lockedNotice.classList.add("hidden");

playStyleBox.classList.remove("hidden");
playerCountBox.classList.remove("hidden");
playStyleLabel.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");
}

if(game === "skins"){
lockedNotice.classList.add("hidden");

playStyleBox.classList.remove("hidden");
playerCountBox.classList.remove("hidden");
playStyleLabel.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");
}

if(game==="nassau" || game==="baseball"){

document.getElementById("nassauWagers").classList.toggle("hidden",game!=="nassau");

holeLimitSelect.classList.add("hidden");

}else{

document.getElementById("nassauWagers").classList.add("hidden");

holeLimitSelect.classList.remove("hidden");

}

if(game==="vegas"){
document.getElementById("wagerLabel").textContent="Wager per point";
baseWagerWrapper.classList.remove("hidden");
}
else if(game==="baseball"){
document.getElementById("wagerLabel").textContent="Wager per Run";
baseWagerWrapper.classList.remove("hidden");
}
else if(game==="nassau"){
document.getElementById("wagerLabel").textContent="";
baseWagerWrapper.classList.add("hidden");
}
else if(game==="bingo"){
document.getElementById("wagerLabel").textContent="Wager per point";
baseWagerWrapper.classList.remove("hidden");
}
else if(game==="dots"){
document.getElementById("wagerLabel").textContent="Wager per dot";
baseWagerWrapper.classList.remove("hidden");
}
else if(game==="nine"){
document.getElementById("wagerLabel").textContent="Wager per point";
baseWagerWrapper.classList.remove("hidden");
}
else if(game==="sixes"){
document.getElementById("wagerLabel").textContent="Wager per segment";
baseWagerWrapper.classList.remove("hidden");
}
else if(game==="battle"){
document.getElementById("wagerLabel").textContent="Wager amount";
baseWagerWrapper.classList.remove("hidden");
}
else{
document.getElementById("wagerLabel").textContent="Wager per player";
baseWagerWrapper.classList.remove("hidden");
}

// Show battle payout row only for battle
const battlePayoutRow = document.getElementById("battlePayoutRow");
if(battlePayoutRow){
battlePayoutRow.classList.toggle("hidden", game !== "battle");
}

if(game==="wolf"){
playStyleBox.value="ffa";
}

// Update course label in step-settings
const courseLabel = document.getElementById("bettingCourseLabel");
if(courseLabel){
if(game === "dots"){
courseLabel.innerHTML = `Course <span style="color:#e74c3c;font-size:12px;">Required</span>`;
} else {
courseLabel.innerHTML = `Course <span style="opacity:.5;font-size:12px;">(optional)</span>`;
}
}

show("step-style");
};

/* ================= SETUP ================= */

window.nextTeams=()=>{
if(currentGame === "baseball"){
teamAName = "Away";
teamBName = "Home";
buildPlayers();
return;
}

if(currentGame === "wolf" || currentGame === "bingo" || currentGame === "dots" || currentGame === "nine"){
playStyle = "ffa";
playerCount = parseInt(playerCountBox.value);
buildPlayers();
return;
}

if(currentGame === "battle"){
playStyle = playStyleBox.value;
playerCount = parseInt(playerCountBox.value);
if(playStyle === "teams"){
playerCount = 4;
show("step-teams");
} else {
buildPlayers();
}
return;
}

if(currentGame === "sixes"){
playStyle = "teams";
playerCount = 4;
buildPlayers();
return;
}

if(currentGame==="vegas"||currentGame==="nassau"){
show("step-teams");
return;
}

playStyle = playStyleBox.value;

if(playStyle === "teams"){
playerCount = 4;
}else{
playerCount = parseInt(playerCountBox.value);
}


playStyle==="teams"?show("step-teams"):buildPlayers();
};

window.nextPlayers=()=>{
teamAName=document.getElementById("teamAName").value||"Team 1";
teamBName=document.getElementById("teamBName").value||"Team 2";
buildPlayers();
};

function buildPlayers(){
teamAInputs.innerHTML="";
teamBInputs.innerHTML="";

if(currentGame === "baseball"){
teamALabel.textContent = "Away";
teamBLabel.textContent = "Home";
} else if(currentGame === "sixes"){
// Sixes: 4 individual name inputs, no team split
teamALabel.textContent = "Players (rotation handled automatically)";
teamBLabel.textContent = "";
} else {
teamALabel.textContent = playStyle==="teams" ? teamAName : "Players";
teamBLabel.textContent = playStyle==="teams" ? teamBName : "";
}

const userName = userProfile ? userProfile.name : "";

if(playStyle==="teams" && currentGame !== "sixes"){

// TEAM A
teamAInputs.innerHTML += `<input value="${userName}">`; // Player 1 auto-fill
teamAInputs.innerHTML += `<input placeholder="Player 2 name">`; // Player 2 blank

// TEAM B (both blank)
teamBInputs.innerHTML += `<input placeholder="Player 1 name">`;
teamBInputs.innerHTML += `<input placeholder="Player 2 name">`;

}else{

teamAInputs.innerHTML = "";
teamBInputs.innerHTML = "";

const count = currentGame === "sixes" ? 4 : playerCount;

for(let i=0;i<count;i++){

const input = document.createElement("input");

input.placeholder = `Player ${i+1} name`;

if(i === 0 && userName){
input.value = userName;
}

teamAInputs.appendChild(input);

}

}

show("step-players");
setTimeout(attachAllAutocomplete, 50);
}


window.nextSettings = () => {
show("step-settings");
};

window.setBattlePayout = (mode) => {
battleGame.setPayoutMode(mode);
document.getElementById("payoutFlat")?.classList.toggle("bingo-selected", mode === "flat");
document.getElementById("payoutPerStroke")?.classList.toggle("bingo-selected", mode === "perstroke");
};

/* ================= NET BATTLE HANDICAP INPUT ================= */

function buildHandicapInputs(){
const list = document.getElementById("handicapInputList");
if(!list) return;
list.innerHTML = "";

players.forEach(p => {
const row = document.createElement("div");
row.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:12px;";
row.innerHTML = `
<div style="flex:1;font-weight:600;font-size:14px;">${p}</div>
<input id="hcp_${p}" type="number" inputmode="decimal" placeholder="Handicap"
style="width:100px;text-align:center;">
`;
list.appendChild(row);
});
}

window.startBattleRound = () => {
const handicaps = {};
let allEntered = true;

players.forEach(p => {
const el  = document.getElementById(`hcp_${p}`);
const val = el?.value;
if(val === "" || val === undefined){ allEntered = false; return; }
handicaps[p] = parseFloat(val) || 0;
});

if(!allEntered){
alert("Please enter a handicap for every player (use 0 if scratch)");
return;
}

if(GAME_UI["battle"]) GAME_UI["battle"]._handicapInputs = handicaps;

// Determine 9 vs 18
const isNineHole  = holeLimit <= 9;
const halfForNine = document.getElementById("halfForNineToggle")?.checked || false;

// Set up engine
battleGame.reset();
battleGame.setTeamMode(playStyle === "teams");
battleGame.setHalfForNine(halfForNine);
battleGame.setPlayers(players, handicaps, isNineHole);

// Course data
const rating = bettingCourse?.rating || 72;
const slope  = bettingCourse?.slope  || 113;
battleGame.setCourseHandicaps(rating, slope);

// Hole handicap difficulty rankings if available
if(bettingCourse){
const saved   = savedCourses.find(c => c.name === bettingCourse.name);
const teeName = document.getElementById("bettingTeeSelect")?.value;
const tee     = saved?.tees?.[teeName];
if(tee?.holeHandicaps?.length){
battleGame.setHoleHandicaps(tee.holeHandicaps);
}
}

["skinsBox","vegasBox","nassauBox","wolfBox","baseballBox","bingoBox","dotsBox","nineBox","sixesBox2","battleBox"]
.forEach(id => document.getElementById(id)?.classList.add("hidden"));
document.getElementById("battleBox")?.classList.remove("hidden");

if(GAME_UI["battle"]?.build){
GAME_UI["battle"].build({ players, teams, ledger, baseWager });
}

teamAPlayers.textContent = `Players: ${players.join(", ")}`;
teamBPlayers.textContent = "";
document.getElementById("leaderboardWrapper").classList.add("hidden");
document.getElementById("leaderboardHeader").classList.add("hidden");
updateUI();
show("game-screen");
};

/* ================= DOT PICKER ================= */

const DEFAULT_DOTS = [
{ key:"birdie",    label:"Birdie",        value:1, single:false, on:true },
{ key:"eagle",     label:"Eagle",         value:2, single:false, on:true },
{ key:"gir",       label:"GIR",           value:1, single:false, on:true },
{ key:"fir",       label:"FIR",           value:1, single:false, on:true },
{ key:"oneputt",   label:"One Putt",      value:1, single:false, on:true },
{ key:"holeout",   label:"Hole Out",      value:2, single:false, on:true },
{ key:"sandsave",  label:"Sand Save",     value:1, single:false, on:true },
{ key:"longdrive", label:"Long Drive",    value:1, single:true,  on:true },
{ key:"longputt",  label:"Longest Putt",  value:1, single:true,  on:true },
{ key:"ctp",       label:"CTP",           value:1, single:true,  on:true },
{ key:"lowscore",  label:"Low Score",     value:1, single:true,  on:true },
];

let dotPickerState = [];

function buildDotPicker(){
const customs = dotPickerState.filter(d => d.custom);
dotPickerState = DEFAULT_DOTS.map(d => ({ ...d })).concat(customs);
renderDotPicker();
}

function renderDotPicker(){
const list = document.getElementById("dotPickerList");
if(!list) return;
list.innerHTML = "";

dotPickerState.forEach((dot, i) => {
const row = document.createElement("div");
row.style.cssText = "display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);";

// Pill toggle
const toggleWrap = document.createElement("label");
toggleWrap.style.cssText = "position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;cursor:pointer;";
const checkbox = document.createElement("input");
checkbox.type    = "checkbox";
checkbox.checked = dot.on;
checkbox.style.cssText = "opacity:0;width:0;height:0;position:absolute;";
checkbox.onchange = () => { dotPickerState[i].on = checkbox.checked; slider.style.background = checkbox.checked ? "#2ecc71" : "rgba(255,255,255,.2)"; knob.style.transform = checkbox.checked ? "translateX(20px)" : "translateX(2px)"; };
const slider = document.createElement("div");
slider.style.cssText = `position:absolute;inset:0;border-radius:24px;background:${dot.on?"#2ecc71":"rgba(255,255,255,.2)"};transition:background .2s;`;
const knob = document.createElement("div");
knob.style.cssText = `position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;transform:${dot.on?"translateX(20px)":"translateX(2px)"};`;
slider.appendChild(knob);
toggleWrap.appendChild(checkbox);
toggleWrap.appendChild(slider);

const lbl = document.createElement("div");
lbl.style.cssText = "flex:1;font-weight:600;font-size:14px;";
lbl.textContent   = dot.label + (dot.single ? " ⚡" : "");

const val = document.createElement("div");
val.style.cssText = "font-size:12px;opacity:.6;white-space:nowrap;";
val.textContent   = dot.value + " dot" + (dot.value !== 1 ? "s" : "");

row.appendChild(toggleWrap);
row.appendChild(lbl);
row.appendChild(val);

if(dot.custom){
const del = document.createElement("button");
del.textContent   = "✕";
del.style.cssText = "padding:4px 10px;font-size:13px;background:rgba(200,50,50,.4);";
del.onclick       = () => { dotPickerState.splice(i, 1); renderDotPicker(); };
row.appendChild(del);
}

list.appendChild(row);
});
}

window.addCustomDot = () => {
const name  = document.getElementById("customDotName").value.trim();
const value = parseFloat(document.getElementById("customDotValue").value);
if(!name)           return alert("Enter a dot name");
if(!value || value <= 0) return alert("Enter a valid dot value");
dotPickerState.push({ key:"custom_"+Date.now(), label:name, value, single:false, on:true, custom:true });
document.getElementById("customDotName").value  = "";
document.getElementById("customDotValue").value = "";
renderDotPicker();
};

window.startDotsRound = () => {
const active = dotPickerState.filter(d => d.on);
if(!active.length) return alert("Select at least one dot");

dotsGame.reset();
dotsGame.initPlayers(players);
dotsGame.setWager(baseWager);
dotsGame.setActiveDots(active);

holeLimit = +document.getElementById("holeLimit")?.value || 9;

// Hide all game boxes, show dots
["skinsBox","vegasBox","nassauBox","wolfBox","baseballBox","bingoBox","dotsBox"]
.forEach(id => {
const el = document.getElementById(id);
if(el) el.classList.add("hidden");
});
document.getElementById("dotsBox")?.classList.remove("hidden");

if(GAME_UI["dots"]?.build){
GAME_UI["dots"].build({ players, teams, ledger, baseWager });
}

teamAPlayers.textContent = `Players: ${players.join(", ")}`;
teamBPlayers.textContent = "";

document.getElementById("leaderboardWrapper").classList.add("collapsed");
document.getElementById("leaderboardWrapper").classList.add("hidden");
document.getElementById("leaderboardHeader").classList.add("hidden");
updateUI();
show("game-screen");
};

function saveState(){

historyStack.push({
hole,
ledger: { ...ledger },
players: [...players],

wolfIndex: GAME_ENGINES.wolf?.wolfIndex,

gameState: GAME_ENGINES[currentGame]?.getState
? GAME_ENGINES[currentGame].getState()
: null

});

}

window.undoHole = () => {

if(!historyStack.length) return;

const prev = historyStack.pop();

hole = prev.hole;
ledger = { ...prev.ledger };
players = [...prev.players];

// ✅ restore engine state (wolf rotation + partner/lone)
if(prev.gameState && GAME_ENGINES[currentGame]?.setState){
GAME_ENGINES[currentGame].setState(prev.gameState);
}

// 🔥 FORCE UI TO REBIND TO RESTORED STATE
if(GAME_UI[currentGame]){
GAME_UI[currentGame].players = players;
GAME_UI[currentGame].ledger = ledger;
}

// ✅ FORCE UI TO REBUILD CORRECTLY
if(GAME_UI[currentGame]?.onHoleChange){
GAME_UI[currentGame].onHoleChange(hole);
}

updateUI();

};



/* ================= START ROUND ================= */

window.startRound=()=>{

// Dots requires a course
if(currentGame === "dots" && !bettingCourse){
alert("Please select a course for Dots — it's needed for par-based dot rules.");
return;
}

// Slice betting course pars based on hole selection
if(bettingCourse && bettingCourse.fullPars){
const holes    = +document.getElementById("holeLimit")?.value || 9;
const nineType = document.getElementById("bettingNineType")?.value || "front";
if(holes === 18){
bettingCourse.pars = bettingCourse.fullPars.slice(0, 18);
} else if(nineType === "back"){
bettingCourse.pars = bettingCourse.fullPars.slice(9, 18);
} else {
bettingCourse.pars = bettingCourse.fullPars.slice(0, 9);
}
}

players=[]; teams={A:[],B:[]}; ledger={}; hole=1;
historyStack=[];
document.getElementById("birdieFlip").checked=false;

document.querySelectorAll("#teamAInputs input").forEach(i=>{
if(!i.value) return;
players.push(i.value);
ledger[i.value]=0;
teams.A.push(i.value);
});

document.querySelectorAll("#teamBInputs input").forEach(i=>{
if(!i.value) return;
players.push(i.value);
ledger[i.value]=0;
teams.B.push(i.value);
});

// Dots: collect wager then go to dot picker
if(currentGame === "dots"){
baseWager = +document.getElementById("baseWager").value;
buildDotPicker();
show("dot-picker");
return;
}

// Net Battle: go to handicap input screen
if(currentGame === "battle"){
baseWager = +document.getElementById("baseWager").value;
buildHandicapInputs();
show("handicap-input");
return;
}

// ✅ BASEBALL ONLY TEAM NAMES
if(currentGame === "baseball"){
teamAName = "Away";
teamBName = "Home";
}

/* Detect 1v1 automatically */

if(teams.A.length === 1 && teams.B.length === 1){
playStyle = "ffa";
}else{
playStyle = "teams";
}

baseWager=+document.getElementById("baseWager").value;
holeLimit =
currentGame==="nassau" ? 18 :
currentGame==="baseball" ? 18 :
+holeLimitSelect.value;

if(GAME_ENGINES[currentGame]?.reset){
GAME_ENGINES[currentGame].reset(baseWager);
}

skinsBox.classList.toggle("hidden",currentGame!=="skins");
vegasBox.classList.toggle("hidden",currentGame!=="vegas");
nassauBox.classList.toggle("hidden",currentGame!=="nassau");
const wolfBox = document.getElementById("wolfBox");
if(wolfBox) wolfBox.classList.toggle("hidden", currentGame !== "wolf");
const baseballBox = document.getElementById("baseballBox");
if(baseballBox) baseballBox.classList.toggle("hidden", currentGame !== "baseball");
const bingoBox = document.getElementById("bingoBox");
if(bingoBox) bingoBox.classList.toggle("hidden", currentGame !== "bingo");
const dotsBox = document.getElementById("dotsBox");
if(dotsBox) dotsBox.classList.toggle("hidden", currentGame !== "dots");
const nineBox = document.getElementById("nineBox");
if(nineBox) nineBox.classList.toggle("hidden", currentGame !== "nine");
const sixesBox2 = document.getElementById("sixesBox2");
if(sixesBox2) sixesBox2.classList.toggle("hidden", currentGame !== "sixes");
const battleBox = document.getElementById("battleBox");
if(battleBox) battleBox.classList.toggle("hidden", currentGame !== "battle");

if(GAME_UI[currentGame]?.build){
GAME_UI[currentGame].build({
players,
teams,
ledger,
baseWager
});
}

// 🔥 FORCE UI TO REBUILD AFTER PLAYERS ARE SET
if(GAME_UI[currentGame]?.build){
GAME_UI[currentGame].build({
players,
teams,
ledger,
baseWager
});
}

// ✅ FORCE UPDATE AFTER BUILD
if(GAME_UI[currentGame]?.update){
GAME_UI[currentGame].update();
}

if(currentGame === "baseball"){
teamAPlayers.textContent = `Away: ${teams.A.join(" & ")}`;
teamBPlayers.textContent = `Home: ${teams.B.join(" & ")}`;
}else{
teamAPlayers.textContent=`${teamAName}: ${teams.A.join(" & ")}`;
teamBPlayers.textContent=`${teamBName}: ${teams.B.join(" & ")}`;
}

document.querySelectorAll("#game-screen input").forEach(i => {
if(["a1","a2","b1","b2"].includes(i.id)) return;
i.value = "";
});
updateUI();
document.getElementById("leaderboardWrapper").classList.add("collapsed");
// Hide money leaderboard entirely for dots/bingo — it doesn't update mid-round
if(currentGame === "bingo" || currentGame === "dots" || currentGame === "nine" || currentGame === "battle"){
document.getElementById("leaderboardWrapper").classList.add("hidden");
document.getElementById("leaderboardHeader").classList.add("hidden");
} else {
document.getElementById("leaderboardWrapper").classList.remove("hidden");
document.getElementById("leaderboardHeader").classList.remove("hidden");
}
show("game-screen");
};
/* ================= SIDE BET ================= */

sideBetBtn.onclick=()=>{
sideWinners.innerHTML="";
sideBetModal.classList.remove("hidden");
};

sideMode.onchange=buildSideButtons;
sideAmount.oninput=buildSideButtons;

function buildSideButtons(){

const amount=+sideAmount.value;
if(!amount||amount<=0){
sideWinners.innerHTML="<p>Enter wager first</p>";
return;
}

sideWinners.innerHTML="";
sideBets.setAmount(amount);
sideBets.setMode(sideMode.value);

if(sideMode.value==="player"){
players.forEach(p=>{
const btn=document.createElement("button");
btn.textContent=p;
btn.onclick=()=>{
saveState();
sideBets.applyPlayer(p,players,ledger);
sideAmount.value="";
updateUI();
sideBetModal.classList.add("hidden");
};
sideWinners.appendChild(btn);
});
}else{
["A","B"].forEach(t=>{
const btn=document.createElement("button");
btn.textContent=t==="A"?teamAName:teamBName;
btn.onclick=()=>{
saveState();
sideBets.applyTeam(t,teams,ledger);
sideAmount.value="";
updateUI();
sideBetModal.classList.add("hidden");
};
sideWinners.appendChild(btn);
});
}
}

/* ================= FLOW ================= */

function nextHole(){
if(hole>=holeLimit){

const sorted = [...players].sort((a,b)=>ledger[b]-ledger[a]);
const topValue = ledger[sorted[0]];
const winners = sorted.filter(p => ledger[p] === topValue && topValue > 0);

leaderboardModalList.innerHTML = "";

// Winner banner
if(winners.length > 0){
const banner = document.createElement("div");
banner.className = "winner-banner";
banner.innerHTML = `
<div class="winner-crown">🏆</div>
<div class="winner-name">${winners.join(" & ")}</div>
<div class="winner-sub">Winner${winners.length > 1 ? "s" : ""}!</div>
`;
leaderboardModalList.appendChild(banner);
}

// Confetti burst
spawnConfetti();

sorted.forEach((p, i) => {

const value = ledger[p];
const isWinner = winners.includes(p);

const row = document.createElement("div");
row.className = "results-row" + (isWinner ? " results-row-winner" : "");
row.style.animationDelay = `${i * 80}ms`;

row.innerHTML = `
<span>${isWinner ? "🏆 " : ""}${p}</span>
<span>${value>=0?"+":""}$${value.toFixed(2)}</span>
`;

leaderboardModalList.appendChild(row);

});

// For battle: add a "View Net Scores" button
if(currentGame === "battle"){
const netBtn = document.createElement("button");
netBtn.textContent = "View Net Scores";
netBtn.style.cssText = "width:100%;margin-top:12px;background:rgba(255,255,255,.15);font-size:14px;";
netBtn.onclick = () => {
const nets = battleGame.getNetScores();
const ch   = battleGame.getCourseHandicaps();
let html   = `<div style="margin-top:14px;border-top:1px solid rgba(255,255,255,.15);padding-top:14px;">
<div style="font-weight:700;margin-bottom:10px;font-size:14px;">Net Score Breakdown</div>`;
[...players].sort((a,b)=>nets[a]-nets[b]).forEach(p => {
html += `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,.07);">
<span>${p} <span style="opacity:.5;font-size:11px;">(HCP ${ch[p]||0})</span></span>
<span style="font-weight:700;">${nets[p]} net</span>
</div>`;
});
html += `</div>`;
const detail = document.createElement("div");
detail.innerHTML = html;
netBtn.replaceWith(detail);
};
leaderboardModalList.appendChild(netBtn);
}

// Add Settle Up button if any money changed hands — appended to modal-box not the list
const hasDebts = Object.values(ledger).some(v => v < 0);
const existingSettleBtn = document.getElementById("settleUpBtn");
if(existingSettleBtn) existingSettleBtn.remove();
if(hasDebts){
const settleBtn = document.createElement("button");
settleBtn.id = "settleUpBtn";
settleBtn.textContent = "💸 Settle Up";
settleBtn.style.cssText = "background:linear-gradient(135deg,#1a4f8c,#3498db);margin-top:8px;margin-bottom:8px;";
settleBtn.onclick = (e) => {
e.stopPropagation();
openSettleModal();
};
// Insert before the Finish Round button
const finishBtn = document.getElementById("leaderboardFinishBtn");
finishBtn.parentNode.insertBefore(settleBtn, finishBtn);
}

leaderboardModal.classList.remove("hidden");
return;
}
hole++;
if(GAME_UI[currentGame]?.onHoleChange){
GAME_UI[currentGame].onHoleChange(hole);
}
// Dots and Bingo settle at end — money leaderboard stays hidden during round
if(currentGame === "bingo" || currentGame === "dots" || currentGame === "nine" || currentGame === "battle"){
document.getElementById("leaderboardWrapper").classList.add("hidden");
document.getElementById("leaderboardHeader").classList.add("hidden");
} else {
document.getElementById("leaderboardWrapper").classList.remove("collapsed");
document.getElementById("leaderboardWrapper").classList.remove("hidden");
document.getElementById("leaderboardHeader").classList.remove("hidden");
}
// Scroll game screen back to top
document.getElementById("game-screen")?.scrollTo({ top: 0, behavior: "smooth" });
updateUI();
}

function toggleLeaderboard(){

const wrap = document.getElementById("leaderboardWrapper");
const header = document.getElementById("leaderboardHeader");

wrap.classList.toggle("collapsed");

header.textContent =
wrap.classList.contains("collapsed")
? "▲ Leaderboard"
: "▼ Leaderboard";

}

function updateUI(){
holeDisplay.textContent=`Hole ${hole}`;

// Show par for current hole if course is selected
const parDisplay = document.getElementById("parDisplay");
if(parDisplay){
if(bettingCourse && bettingCourse.pars && bettingCourse.pars[hole-1]){
parDisplay.textContent = `Par ${bettingCourse.pars[hole-1]}`;
} else {
parDisplay.textContent = "";
}
}

if(currentGame==="skins"){
potDisplay.textContent=`$${skinsGame.currentPot()}/player`;
}

if(currentGame==="vegas"){
potDisplay.textContent=`$${baseWager}/point`;
}

if(currentGame==="baseball"){
potDisplay.textContent=`$${baseWager}/run`;
}

if(currentGame==="bingo"){
potDisplay.textContent=`$${baseWager}/point`;
}

if(currentGame==="dots"){
potDisplay.textContent=`$${baseWager}/dot`;
}

if(currentGame==="nine"){
potDisplay.textContent=`$${baseWager}/point`;
}

if(currentGame==="sixes"){
potDisplay.textContent=`$${baseWager}/segment`;
}

if(currentGame==="battle"){
potDisplay.textContent=`$${baseWager} wager`;
}

if(currentGame==="dots"){
potDisplay.textContent=`$${baseWager}/dot`;
}

if(currentGame==="nassau"){
const s=nassauGame.getStatus();
potDisplay.textContent=`Front ${s.frontA}-${s.frontB} | Back ${s.backA}-${s.backB} | Total ${s.totalA}-${s.totalB}`;
}

if(currentGame==="baseball"){

const inning=Math.ceil(hole/2);
const isTop=hole%2===1;

const txt=(isTop?"Top":"Bottom")+" of "+inning;

const el=document.getElementById("baseballInning");
if(el) el.textContent=txt;

}

/* ===== ENHANCED LEADERBOARD ===== */

const sorted = [...players].sort((a,b)=>ledger[b]-ledger[a]);

leaderboard.innerHTML = "";

sorted.forEach((p,i)=>{

const value = ledger[p];
const row = document.createElement("div");
row.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s ease";
row.style.transform = "translateY(20px)";
row.style.opacity = "0";

row.style.display = "flex";
row.style.background = "rgba(255,255,255,.008)";
row.style.backdropFilter = "blur(6px)";
row.style.border = "1px solid rgba(255,255,255,.12)";
row.style.justifyContent = "space-between";
row.style.padding = "8px 12px";
row.style.marginBottom = "6px";
row.style.borderRadius = "10px";
row.style.fontWeight = "600";

if(i === 0){

row.style.background = "linear-gradient(90deg,#0f5132,#1f7a4f)";
row.style.boxShadow = "0 0 12px rgba(46,204,113,.35)";
row.style.transform = "scale(1.03)";

}

if(value > 0){
row.style.color = "#2ecc71";
}else if(value < 0){
row.style.color = "#e74c3c";
}else{
row.style.color = "#ffffff";
}

row.innerHTML = `
<span>${p}</span>
<span>${value>=0?"+":""}$${value.toFixed(2)}</span>
`;

leaderboard.appendChild(row);

requestAnimationFrame(()=>{
row.style.transform = "translateY(0)";
row.style.opacity  = "1";
});

});

if(GAME_UI[currentGame]?.update){
GAME_UI[currentGame].update();
}

updateHeader("game-screen");
animateMoney();
}

/* ================= END ROUND ================= */

window.endRoundNow = () =>{
if(!confirm("End round? Progress will be lost.")) return;

currentRound = null;
historyStack = [];
goHomeClean();
};

leaderboardFinishBtn.onclick = () => {

updateBettingStats();
trackOpponents();
trackPvP();
saveBettingRound();

localStorage.setItem("userProfile", JSON.stringify(userProfile));

leaderboardModal.classList.add("hidden");

autoSync();

setTimeout(()=>{
goHomeClean();
},50);

}

/* ================= ROUND TRACKING ================= */

let roundHistory = [];

window.startRoundTracking = () => {

const selectedCourseName = document.getElementById("courseSearch")?.value;
const holesSelected = +document.getElementById("roundHoles").value;
const nineType = document.getElementById("nineType")?.value; // front/back

let selectedCourse = savedCourses.find(c => c.name === selectedCourseName);

let parArray = [];
let yardageArray = [];
let holeOffset = 0;
let rating = 72;
let slope = 113;

if(selectedCourse){

 const teeName = document.getElementById("teeSelect")?.value || "Default";
 const tee = selectedCourse.tees?.[teeName];

 if(tee){
 rating = tee.rating;
 slope = tee.slope;

 if(holesSelected === 18){
 parArray     = tee.pars;
 yardageArray = tee.yardages || [];
 }else if(nineType === "back"){
 parArray     = tee.pars.slice(9,18);
 yardageArray = (tee.yardages || []).slice(9,18);
 holeOffset = 9;
 }else{
 parArray     = tee.pars.slice(0,9);
 yardageArray = (tee.yardages || []).slice(0,9);
holeOffset = 0;
}
}

}else{
parArray = []; // manual mode
}

currentRound = {
course: selectedCourseName || document.getElementById("courseName").value || "Unknown Course",
rating,
slope,
holes: holesSelected,
currentHole: 1,
scores: [],
pars: [],
putts: [],
penalties: [],
gir: [],
fir: [],
totalStrokes: 0,
totalPar: 0,
loadedPars: parArray,
loadedYardages: yardageArray,
holeOffset,
};

roundHistory = [];
updateRoundUI();
show("round-play");
};

function updateRoundUI(){

if(!currentRound) return;

const parButtonContainer = document.getElementById("parButtonContainer");

const actualHoleNumber =
currentRound.currentHole + (currentRound.holeOffset || 0);

if(currentRound.loadedPars && currentRound.loadedPars.length){

parButtonContainer?.classList.add("hidden");

const par  = currentRound.loadedPars[currentRound.currentHole - 1];
const yds  = currentRound.loadedYardages?.[currentRound.currentHole - 1];
const yardStr = yds ? ` – ${yds} yds` : "";

document.getElementById("roundHoleDisplay").textContent =
`Hole ${actualHoleNumber} (Par ${par}${yardStr})`;

}else{

parButtonContainer?.classList.remove("hidden");

document.getElementById("roundHoleDisplay").textContent =
`Hole ${actualHoleNumber} of ${currentRound.holes}`;

}

let totalParDisplay = "";

if(currentRound.loadedPars && currentRound.loadedPars.length){

const totalPar = currentRound.loadedPars.reduce((a,b)=>a+b,0);
totalParDisplay = ` | Par ${totalPar}`;

}

const totalPar =currentRound.loadedPars && currentRound.loadedPars.length
? currentRound.loadedPars.reduce((a,b)=>a+b,0)
: currentRound.totalPar || "";

document.getElementById("roundCourseMain").innerHTML =
`${currentRound.course}${totalPar ? ` <span style="opacity:.75;font-weight:600;"> — Par ${totalPar}</span>` : ""}`;

document.getElementById("roundCourseSub").textContent =
`Rating ${currentRound.rating} • Slope ${currentRound.slope}`;

const toPar = currentRound.totalStrokes - currentRound.totalPar;

const courseHandicap = Math.round(
(userProfile.currentHandicap * currentRound.slope) / 113
);

const net = currentRound.totalStrokes - courseHandicap;

document.getElementById("roundLiveStats").textContent =
`Total ${currentRound.totalStrokes} | To Par ${toPar>=0?"+":""}${toPar} | Net ${net}`;

updateHeader("round-play");
}

function setScore(val, el){

    tapHaptic();

const input = document.getElementById("holeScore");

if(val === 8){
input.classList.remove("hidden");
input.focus();
input.value = "";
return;
}

input.value = val;

/* Remove active from all buttons */
document.querySelectorAll("#scoreButtons button").forEach(btn=>{
btn.classList.remove("active");
});

/* Add active to selected */
el.classList.add("active");
}


window.submitHoleScore = () => {

if(!currentRound) return;

const score = +document.getElementById("holeScore").value;
let par;

if(currentRound.loadedPars && currentRound.loadedPars.length){
par = currentRound.loadedPars[currentRound.currentHole - 1];
}else{
par = +document.getElementById("holePar").value;
}
if(!score) return;

roundHistory.push(JSON.parse(JSON.stringify(currentRound)));

currentRound.scores.push(score);
currentRound.pars.push(par);
currentRound.putts.push(+document.getElementById("holePutts").value || 0);
currentRound.penalties.push(+document.getElementById("holePenalties").value || 0);

currentRound.gir.push(
document.getElementById("girToggle").classList.contains("active")
);

currentRound.fir.push(
document.getElementById("firToggle").classList.contains("active")
);
currentRound.totalStrokes += score;
currentRound.totalPar += par;

document.getElementById("holeScore").value = "";
document.querySelectorAll("#scoreButtons button").forEach(btn=>{
btn.classList.remove("active");
});
document.getElementById("holePutts").value = "";
document.getElementById("holePenalties").value = "";

document.getElementById("firToggle").classList.remove("active");
document.getElementById("girToggle").classList.remove("active");

if(currentRound.currentHole >= currentRound.holes){
finishTrackedRound();
return;
}

currentRound.currentHole++;
updateRoundUI();
};

window.undoRoundHole = () => {
if(!roundHistory.length) return;
currentRound = roundHistory.pop();
updateRoundUI();
};

function finishTrackedRound(){

if(!currentRound) return;

const toPar = currentRound.totalStrokes - currentRound.totalPar;
let adjustedStrokes = currentRound.totalStrokes;

if(currentRound.holes === 9){
adjustedStrokes = currentRound.totalStrokes * 2;
}

const differential = calculateDifferential(
adjustedStrokes,
currentRound.rating,
currentRound.slope
);

userProfile.rounds.push({
date: new Date().toISOString(),
course: currentRound.course,
strokes: currentRound.totalStrokes,
rating: currentRound.rating,
slope: currentRound.slope,
toPar,
holes: currentRound.holes,
differential,

scores: currentRound.scores,
pars: currentRound.pars,
putts: currentRound.putts,
penalties: currentRound.penalties,
gir: currentRound.gir,
fir: currentRound.fir
});

updateHandicap();

localStorage.setItem("userProfile", JSON.stringify(userProfile));

autoSync();

currentRound = null;
alert("Round Saved!");
goHomeClean();
}

window.cancelTrackedRound = () => {
if(!confirm("End round without saving?")) return;

currentRound = null;
roundHistory = [];
goHomeClean();
};

window.openScorecard = () => {

if(!currentRound) return;

let html = `
<table style="width:100%;border-collapse:collapse;text-align:center">
<tr style="border-bottom:1px solid rgba(255,255,255,.15);height:48px;line-height:44px;">
<th>Hole</th>
<th>Par</th>
<th>Score</th>
<th>+/-</th>
</tr>
`;

let frontScore = 0;
let backScore = 0;

let frontPar = 0;
let backPar = 0;

let frontDiff = 0;
let backDiff = 0;

for(let i=0;i<currentRound.scores.length;i++){

const score = currentRound.scores[i];
const par = currentRound.pars[i];
const diff = score - par;

if(i < 9){
frontScore += score;
frontPar += par;
frontDiff += diff;
}else{
backScore += score;
backPar += par;
backDiff += diff;
}

let scoreStyle = "color:#fff;font-weight:700;";
let scoreWrapStart = "";
let scoreWrapEnd = "";

/* 🟢 EAGLE OR BETTER — GOLD DOUBLE CIRCLE */
if(diff <= -2){
scoreStyle = "color:#ffd700;font-weight:800;";
scoreWrapStart = `<span style="border:2px solid #ffd700;border-radius:50%;padding:4px 10px;box-shadow:0 0 0 2px #ffd700 inset;">`;
scoreWrapEnd = `</span>`;
}

/* 🔴 BIRDIE — RED CIRCLE */
else if(diff === -1){
scoreStyle = "color:#ff4d4d;font-weight:800;";
scoreWrapStart = `<span style="border:2px solid #ff4d4d;border-radius:50%;padding:4px 10px;">`;
scoreWrapEnd = `</span>`;
}

/* ⬛ BOGEY OR WORSE — BOX */
else if(diff >= 1){
scoreWrapStart = `<span style="border:2px solid #ffffff;padding:4px 10px;">`;
scoreWrapEnd = `</span>`;
}

html += `
<tr style="border-bottom:1px solid rgba(255,255,255,.15)">
<td>${i + 1 + (currentRound.holeOffset || 0)}</td>
<td>${par}</td>
<td style="${scoreStyle};padding:10px 0;">
${scoreWrapStart}${score}${scoreWrapEnd}
</td>
<td>${diff>=0?"+":""}${diff}</td>
</tr>
`;

if(i === 8){
html += `
<tr style="font-weight:700;border-top:2px solid rgba(255,255,255,.4)">
<td>Front 9</td>
<td>${frontPar}</td>
<td>${frontScore}</td>
<td>${frontDiff>=0?"+":""}${frontDiff}</td>
</tr>
`;
}

}

if(currentRound.scores.length > 9){
html += `
<tr style="font-weight:700;border-top:2px solid rgba(255,255,255,.4)">
<td>Back 9</td>
<td>${backPar}</td>
<td>${backScore}</td>
<td>${backDiff>=0?"+":""}${backDiff}</td>
</tr>
`;
}

const totalPutts = currentRound.putts.reduce((a,b)=>a+b,0);
const totalPens = currentRound.penalties.reduce((a,b)=>a+b,0);

const girMade = currentRound.gir.filter(x=>x).length;
const girTotal = currentRound.gir.length;

let firMade = 0;
let firTotal = 0;

for(let i=0;i<currentRound.fir.length;i++){
    if(currentRound.pars[i] !== 3){
        firTotal++;
        if(currentRound.fir[i]) firMade++;
    }
}


html += `
</table>

<div style="margin-top:16px;text-align:left;font-size:15px;line-height:1.6">

<strong>Totals</strong><br>
Par: ${currentRound.totalPar}<br>
Score: ${currentRound.totalStrokes}<br>
+/-: ${currentRound.totalStrokes - currentRound.totalPar}<br><br>

GIR: ${girMade}/${girTotal} (${Math.round(girMade/girTotal*100)}%)<br>
FIR: ${firMade}/${firTotal} (${Math.round(firMade/firTotal*100)}%)<br><br>

Putts: ${totalPutts}<br>
Penalty Strokes: ${totalPens}

</div>
`;

document.getElementById("scorecardTable").innerHTML = html;
document.getElementById("scorecardModal").classList.remove("hidden");
};

window.closeScorecard = () => {
document.getElementById("scorecardModal").classList.add("hidden");
};

window.addManualRound = () => {

const date = document.getElementById("manualDate").value;
const course = document.getElementById("manualCourse").value || "Manual Entry";
const rating = +document.getElementById("manualRating").value || 72;
const slope = +document.getElementById("manualSlope").value || 113;
const strokes = +document.getElementById("manualStrokes").value;
const holes = +document.getElementById("manualHoles").value;

if(!date || !strokes || !holes){
alert("Fill all required fields");
return;
}

// Estimate par for manual entry (simple average)
const par = holes === 9 ? 36 : 72;
const toPar = strokes - par;
let adjustedStrokes = strokes;

if(holes === 9){
adjustedStrokes = strokes * 2;
}

const differential = calculateDifferential(adjustedStrokes, rating, slope);

userProfile.rounds.push({
date: new Date(date).toISOString(),
course,
rating,
slope,
strokes,
toPar,
holes,
differential
});

updateHandicap();

localStorage.setItem("userProfile", JSON.stringify(userProfile));
renderProfile();

// clear fields

// Clear ALL fields
[
"manualDate",
"manualCourse",
"manualRating",
"manualSlope",
"manualStrokes"
].forEach(id=>{
const el = document.getElementById(id);
if(el) el.value = "";
});

// Reset holes dropdown
document.getElementById("manualHoles").value = "9";

// Close manual entry box
const box = document.getElementById("manualRoundBox");
const btn = document.getElementById("manualToggleBtn");

box.classList.add("hidden");
btn.textContent = "Add Previous Round";

};


/* ================= PREMIUM SYSTEM ================= */

window.openPremiumScreen = (highlightTier) => {
const modal = document.getElementById("premiumModal");
if(!modal) return;

// Render tier cards
const content = document.getElementById("premiumTierCards");
if(content){

const tiers = [
{
id: "starter",
name: "Starter",
price: "$2.99",
period: "one-time",
color: "#3498db",
features: ["✓ No ads forever", "✓ All betting games", "✓ Up to 2 saved groups"]
},
{
id: "pro",
name: "Pro",
price: "$4.99",
period: "/ month",
color: "#2ecc71",
badge: "Popular",
features: ["✓ Everything in Starter", "✓ Advanced betting stats", "✓ Player vs player money", "✓ Handicap trend chart", "✓ Up to 5 saved groups"]
},
{
id: "elite",
name: "Elite",
price: "$9.99",
period: "/ month",
color: "#f1c40f",
features: ["✓ Everything in Pro", "✓ Full betting history", "✓ Unlimited saved groups"]
}
];

content.innerHTML = tiers.map(t => `
<div class="premium-card ${t.id === highlightTier ? "premium-card-highlight" : ""}" style="border-color:${t.color}40;">
${t.badge ? `<div class="premium-badge" style="background:${t.color};">${t.badge}</div>` : ""}
<div class="premium-card-name" style="color:${t.color};">${t.name}</div>
<div class="premium-card-price">${t.price} <span class="premium-card-period">${t.period}</span></div>
<div class="premium-card-features">${t.features.map(f=>`<div>${f}</div>`).join("")}</div>
<button class="premium-subscribe-btn" style="background:${t.color};" onclick="subscribeTier('${t.id}')">
${userTier === t.id ? "✓ Current Plan" : "Get " + t.name}
</button>
</div>
`).join("");
}

modal.classList.remove("hidden");
};

window.closePremiumModal = () => {
document.getElementById("premiumModal")?.classList.add("hidden");
};

// In production this calls RevenueCat — for now sets tier locally (dev mode)
window.subscribeTier = (tier) => {
setTier(tier);
closePremiumModal();
renderProfile();
alert(`✅ Dev mode: Switched to ${tier} tier`);
};

// ── Advanced Betting Stats ───────────────────────────────────────────────────
function buildAdvancedBettingStats(){
if(!userProfile?.bettingStats) return "<p>No data yet</p>";

const stats  = userProfile.bettingStats;
const rounds = userProfile.rounds || [];
const opps   = stats.opponents || {};

const net      = (stats.totalWon || 0) - (stats.totalLost || 0);
const played   = stats.totalPlayed || 0;
const winRate  = played ? Math.round((stats.totalWon > 0 ? 1 : 0) * 100) : 0;
const avgPayout= played ? (net / played).toFixed(2) : "0.00";

// Best opponent (most played)
const topOpp = Object.entries(opps).sort((a,b)=>b[1]-a[1])[0];

return `
<div class="premium-stat-grid">
<div class="premium-stat">
<div class="premium-stat-val">${played}</div>
<div class="premium-stat-label">Games Played</div>
</div>
<div class="premium-stat">
<div class="premium-stat-val" style="color:${net>=0?"#2ecc71":"#e74c3c"}">
${net>=0?"+":""}$${Math.abs(net).toFixed(2)}
</div>
<div class="premium-stat-label">Net Winnings</div>
</div>
<div class="premium-stat">
<div class="premium-stat-val">${avgPayout>=0?"+":""}$${Math.abs(avgPayout)}</div>
<div class="premium-stat-label">Avg per Game</div>
</div>
<div class="premium-stat">
<div class="premium-stat-val">${topOpp ? topOpp[0] : "—"}</div>
<div class="premium-stat-label">Most Played With</div>
</div>
</div>
`;
}

// ── Player vs Player Net Money ───────────────────────────────────────────────
function buildPvPStats(){
if(!userProfile?.bettingStats?.pvp) return `<p style="opacity:.6;text-align:center;padding:20px 0;">Play more rounds to see player vs player stats.</p>`;

const pvp  = userProfile.bettingStats.pvp;
const rows = Object.entries(pvp).sort((a,b) => b[1] - a[1]);

if(!rows.length) return `<p style="opacity:.6;text-align:center;padding:20px 0;">No data yet.</p>`;

return rows.map(([name, net]) => `
<div class="pvp-row">
<span>${name}</span>
<span style="color:${net>=0?"#2ecc71":"#e74c3c"};font-weight:700;">
${net>=0?"+":""}$${Math.abs(net).toFixed(2)}
</span>
</div>
`).join("");
}

// Track pvp data when a betting round ends
function trackPvP(){
if(!userProfile?.bettingStats) return;
if(!userProfile.bettingStats.pvp) userProfile.bettingStats.pvp = {};

const myName = userProfile.name;
const myNet  = ledger[myName] || 0;

players.forEach(p => {
if(p === myName) return;
const theirNet = ledger[p] || 0;
// From my perspective: if I'm +$10 and they're -$10 vs me
const vsMe = -theirNet; // approximation for 2-player; works for pairwise
if(!userProfile.bettingStats.pvp[p]) userProfile.bettingStats.pvp[p] = 0;
// Net between me and this player = my ledger share attributed to them
// Simple approach: divide my net by number of opponents
const opponents = players.filter(x => x !== myName).length || 1;
userProfile.bettingStats.pvp[p] = +(userProfile.bettingStats.pvp[p] + myNet / opponents).toFixed(2);
});
}

// ── Handicap Trend Chart ─────────────────────────────────────────────────────
function buildHandicapChart(){
if(!userProfile?.rounds?.length){
return `<p style="opacity:.6;text-align:center;padding:20px 0;">No rounds tracked yet.</p>`;
}

const rounds = userProfile.rounds.filter(r => r.differential !== undefined).slice(-20);
if(rounds.length < 2){
return `<p style="opacity:.6;text-align:center;padding:20px 0;">Track at least 2 rounds to see your trend.</p>`;
}

const diffs  = rounds.map(r => r.differential);
const minVal = Math.min(...diffs);
const maxVal = Math.max(...diffs);
const range  = maxVal - minVal || 1;
const W = 300, H = 120, pad = 16;

const pts = diffs.map((d,i) => {
const x = pad + (i / (diffs.length-1)) * (W - pad*2);
const y = H - pad - ((d - minVal) / range) * (H - pad*2);
return `${x},${y}`;
}).join(" ");

const latest = diffs[diffs.length-1];

return `
<div style="text-align:center;margin-bottom:8px;font-size:13px;opacity:.7;">
Last ${diffs.length} rounds · Current index: <strong>${latest}</strong>
</div>
<svg viewBox="0 0 ${W} ${H}" style="width:100%;border-radius:10px;background:rgba(255,255,255,.04);">
<polyline points="${pts}" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
${diffs.map((d,i) => {
const x = pad + (i/(diffs.length-1))*(W-pad*2);
const y = H - pad - ((d-minVal)/range)*(H-pad*2);
return `<circle cx="${x}" cy="${y}" r="4" fill="#2ecc71"/>`;
}).join("")}
</svg>
`;
}

// ── Betting History ──────────────────────────────────────────────────────────
function buildBettingHistory(){
const history = userProfile?.bettingHistory || [];
if(!history.length){
return `<p style="opacity:.6;text-align:center;padding:20px 0;">No betting rounds recorded yet.</p>`;
}

return [...history].reverse().map((r,i) => {
const d    = new Date(r.date);
const date = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
const myNet= r.ledger?.[userProfile.name] || 0;

return `
<div class="bet-history-card" onclick="toggleBetHistoryDetail(${i})">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div>
<div style="font-weight:700;font-size:14px;">${date} · ${r.game||"Game"}</div>
<div style="font-size:12px;opacity:.6;">${r.players?.join(", ")||""}</div>
</div>
<div style="font-weight:800;font-size:16px;color:${myNet>=0?"#2ecc71":"#e74c3c"}">
${myNet>=0?"+":""}$${Math.abs(myNet).toFixed(2)}
</div>
</div>
<div id="betDetail_${i}" class="hidden" style="margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px;">
${Object.entries(r.ledger||{}).map(([p,v])=>`
<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
<span>${p}</span>
<span style="color:${v>=0?"#2ecc71":"#e74c3c"}">${v>=0?"+":""}$${Math.abs(v).toFixed(2)}</span>
</div>`).join("")}
</div>
</div>
`;
}).join("");
}

window.toggleBetHistoryDetail = (i) => {
document.getElementById(`betDetail_${i}`)?.classList.toggle("hidden");
};

// Save betting round to history when finished
function saveBettingRound(){
if(!userProfile) return;
if(!userProfile.bettingHistory) userProfile.bettingHistory = [];

userProfile.bettingHistory.push({
date:    new Date().toISOString(),
game:    currentGame === "nine"  ? "9-Point" :
         currentGame === "sixes" ? "Sixes" :
         currentGame === "battle"? "Net Battle" :
         currentGame === "bingo" ? "Bingo Bango Bongo" :
         currentGame === "dots"  ? "Dots" :
         currentGame ? currentGame.charAt(0).toUpperCase() + currentGame.slice(1) : "Game",
players: [...players],
ledger:  { ...ledger }
});

// Keep last 50 rounds
if(userProfile.bettingHistory.length > 50){
userProfile.bettingHistory = userProfile.bettingHistory.slice(-50);
}
}

/* ================= PROFILE ================= */

function showProfileTab(tabId){

document.querySelectorAll(".profile-tab").forEach(btn=>{
btn.classList.remove("active");
});

document.querySelectorAll(".profile-tab-content").forEach(tab=>{
tab.classList.add("hidden");
});

document.getElementById(tabId).classList.remove("hidden");

// Match button to tab by data or text
document.querySelectorAll(".profile-tab").forEach(b=>{
const map = {
summaryTab: "summary",
roundsTab:  "rounds",
bettingTab: "betting",
premiumTab: "premium"
};
if(b.textContent.toLowerCase().includes(map[tabId]||"")){
b.classList.add("active");
}
});

}

window.openProfile = () =>{
renderProfile();
show("profile-screen");
showProfileTab("summaryTab");
};

function renderProfile(){

if(!userProfile) return;

document.getElementById("profileNameDisplay").textContent = userProfile.name;

const handicap = userProfile.currentHandicap ?? 0;
document.getElementById("profileHandicapDisplay").textContent = handicap.toFixed(1);
document.getElementById("profileRounds").textContent = userProfile.rounds.length;

const avg = userProfile.rounds.length
? Math.round(userProfile.rounds.reduce((a,b)=>a+b.strokes,0) / userProfile.rounds.length)
: "--";

document.getElementById("profileAvg").textContent = avg;

const net =
userProfile.bettingStats.totalWon - userProfile.bettingStats.totalLost;

document.getElementById("betNet").textContent =
`${net>=0?"+":""}$${net.toFixed(2)}`;

document.getElementById("betGames").textContent =
userProfile.bettingStats.totalPlayed;

const oppBox = document.getElementById("opponentList");
if(oppBox){
oppBox.innerHTML = "";

const opponents = userProfile.bettingStats.opponents || {};

const sortedOpps = Object.entries(opponents)
.sort((a,b)=>b[1]-a[1]);

if(!sortedOpps.length){
oppBox.innerHTML = "<p>No opponents yet</p>";
}else{
sortedOpps.slice(0,5).forEach(([name,count])=>{

const row = document.createElement("div");

row.style.display = "flex";
row.style.justifyContent = "space-between";
row.style.padding = "6px 10px";
row.style.marginBottom = "6px";
row.style.borderRadius = "10px";
row.style.background = "rgba(255,255,255,.08)";

row.innerHTML = `
<span>${name}</span>
<span>${count}</span>
`;

oppBox.appendChild(row);

});
}
}


/* ===== PREMIUM ROUND HISTORY ===== */

const container = document.getElementById("roundHistoryTable");
container.innerHTML = "";

if(!userProfile.rounds.length){
container.innerHTML = `<div style="opacity:.6;padding:12px 0;">No rounds yet</div>`;
}else{

[...userProfile.rounds].reverse().forEach((r, index) =>{

const d = new Date(r.date);
const shortDate = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;

const par = r.holes === 9 ? 36 : 72;
const diff = r.strokes - par;

const card = document.createElement("div");
card.className = "round-card";
card.onclick = () => openRoundDetails(index);

card.innerHTML = `
<div class="round-card-left">

<div class="round-card-title">
${shortDate} – ${r.course}
</div>

<div class="round-card-sub">
Par ${par} • Score ${r.strokes} • 
<span class="${diff<0?'score-under':diff>0?'score-over':'score-even'}">
${diff>=0?"+":""}${diff}
</span>
${r.differential !== undefined ? `• Diff ${r.differential}` : ""}
</div>

</div>

<button class="delete-round-btn"
onclick="event.stopPropagation(); deleteRound(${index})">
✕
</button>
`;

container.appendChild(card);

});

}

// Premium sections
const advancedBox = document.getElementById("advancedBettingStats");
if(advancedBox){
if(hasProOrAbove()){
advancedBox.innerHTML = buildAdvancedBettingStats();
} else {
advancedBox.innerHTML = premiumLockBanner("pro", "Advanced Betting Stats");
}
}

const pvpBox = document.getElementById("pvpStats");
if(pvpBox){
if(hasProOrAbove()){
pvpBox.innerHTML = buildPvPStats();
} else {
pvpBox.innerHTML = premiumLockBanner("pro", "Player vs Player Money");
}
}

const chartBox = document.getElementById("handicapChart");
if(chartBox){
if(hasProOrAbove()){
chartBox.innerHTML = buildHandicapChart();
} else {
chartBox.innerHTML = premiumLockBanner("pro", "Handicap Trend Chart");
}
}

const historyBox = document.getElementById("bettingHistoryList");
if(historyBox){
if(hasElite()){
historyBox.innerHTML = buildBettingHistory();
} else {
historyBox.innerHTML = premiumLockBanner("elite", "Betting History");
}
}

// Tier badge on profile
const tierBadge = document.getElementById("tierBadge");
if(tierBadge){
const labels = { free:"Free", starter:"Starter ⚡", pro:"Pro 🏆", elite:"Elite 👑" };
const colors = { free:"rgba(255,255,255,.2)", starter:"#3498db", pro:"#2ecc71", elite:"#f1c40f" };
tierBadge.textContent = labels[userTier] || "Free";
tierBadge.style.background = colors[userTier] || colors.free;
}

}

function premiumLockBanner(tier, feature){
const tierName = tier === "elite" ? "Elite" : "Pro";
const price    = tier === "elite" ? "$9.99/mo" : "$4.99/mo";
return `
<div class="premium-lock-banner" onclick="openPremiumScreen('${tier}')">
<div style="font-size:22px;">🔒</div>
<div>
<div style="font-weight:700;font-size:14px;">${feature}</div>
<div style="font-size:12px;opacity:.7;">${tierName} feature · ${price} · Tap to unlock</div>
</div>
</div>
`;
}

function updateAdVisibility(){
const adSlots = document.querySelectorAll(".ad-slot");
adSlots.forEach(slot => {
slot.style.display = hasStarterOrAbove() ? "none" : "flex";
});
}

function openRoundDetails(index){

const r = [...userProfile.rounds].reverse()[index];

const d = new Date(r.date);
const shortDate = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;

let html = `
<div style="text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.15);">
<strong style="font-size:15px;">${shortDate}</strong><br>
<span style="opacity:.85;">${r.course}</span>
</div>

<table style="width:100%;text-align:center;border-collapse:collapse">
<tr>
<th>Hole</th>
<th>Par</th>
<th>Score</th>
<th>+/-</th>
</tr>
`;

for(let i=0;i<r.scores.length;i++){

const score = r.scores[i];
const par = r.pars[i];
const diff = score - par;

let wrapStart="", wrapEnd="";

if(diff <= -2){
wrapStart=`<span style="border:2px solid gold;border-radius:50%;padding:4px 10px;">`;
wrapEnd="</span>";
}
else if(diff === -1){
wrapStart=`<span style="border:2px solid red;border-radius:50%;padding:4px 10px;">`;
wrapEnd="</span>";
}
else if(diff >= 1){
wrapStart=`<span style="border:2px solid white;padding:4px 10px;">`;
wrapEnd="</span>";
}

html += `
<tr>
<td>${i+1}</td>
<td>${par}</td>
<td>${wrapStart}${score}${wrapEnd}</td>
<td>${diff>=0?"+":""}${diff}</td>
</tr>
<tr style="font-size:12px;color:#ccc">
<td colspan="4">
Putts ${r.putts[i]} | Pen ${r.penalties[i]} |
GIR ${r.gir[i]?"✔":""} | FIR ${r.fir[i]?"✔":""}
</td>
</tr>
`;
}

const totalPutts = r.putts.reduce((a,b)=>a+b,0);
const totalPens = r.penalties.reduce((a,b)=>a+b,0);

const girMade = r.gir.filter(x=>x).length;
const girTotal = r.gir.length;

let firMade = 0;
let firTotal = 0;

for(let i=0;i<r.fir.length;i++){
    if(r.pars[i] !== 3){
        firTotal++;
        if(r.fir[i]) firMade++;
    }
}

html += `
</table>

<div style="margin-top:18px;text-align:left;font-size:15px;line-height:1.7">

<strong>Round Summary</strong><br>

Par: ${r.pars.reduce((a,b)=>a+b,0)}<br>
Score: ${r.strokes}<br>
+/-: ${r.toPar>=0?"+":""}${r.toPar}<br><br>

GIR: ${girMade}/${girTotal} (${girTotal?Math.round(girMade/girTotal*100):0}%)<br>
FIR: ${firMade}/${firTotal} (${firTotal?Math.round(firMade/firTotal*100):0}%)<br><br>

Putts: ${totalPutts}<br>
Penalty Strokes: ${totalPens}

</div>
`;

document.getElementById("roundDetailContent").innerHTML = html;
document.getElementById("roundDetailModal").classList.remove("hidden");
}

// DEV ONLY — tap tier badge 5x to open switcher
let tierTapCount = 0;
window.devTierTap = () => {
tierTapCount++;
if(tierTapCount >= 5){
tierTapCount = 0;
const t = prompt("Dev: Set tier (free/starter/pro/elite):", userTier);
if(t && ["free","starter","pro","elite"].includes(t)){
setTier(t);
renderProfile();
}
}
};

window.editProfile = () => {

document.getElementById("profileName").value = userProfile.name;
document.getElementById("profileHandicap").value = userProfile.currentHandicap;
document.getElementById("profileSaveBtn").textContent = "Save Profile";

show("profile-setup");

};
window.saveProfileChanges = () => {

const name = document.getElementById("profileName").value.trim();
const handicap = parseFloat(document.getElementById("profileHandicap").value) || 0;

if(!name){
alert("Please enter your name");
return;
}

if(!userProfile){
userProfile = {
name,
startingHandicap: handicap,
currentHandicap: handicap,
rounds: [],
bettingStats:{
totalWon:0,
totalLost:0,
totalPlayed:0
}
};
}else{
userProfile.name = name;
userProfile.currentHandicap = handicap;
}

localStorage.setItem("userProfile", JSON.stringify(userProfile));

renderProfile();
goHomeClean(); // 👈 THIS is the important part
};

function deleteRound(displayIndex){

event.stopPropagation();

const confirmed = confirm("Delete this round permanently?");
if(!confirmed) return;

const realIndex = userProfile.rounds.length - 1 - displayIndex;

if(realIndex < 0 || realIndex >= userProfile.rounds.length) return;

userProfile.rounds.splice(realIndex,1);

updateHandicap();

localStorage.setItem("userProfile", JSON.stringify(userProfile));

renderProfile();
}

/* ================= RESET BETTING ================= */

document.getElementById("resetBettingBtn").onclick = () => {

if(!confirm("Reset all betting stats? This cannot be undone.")) return;

userProfile.bettingStats = {
totalWon:0,
totalLost:0,
totalPlayed:0
};

localStorage.setItem("userProfile", JSON.stringify(userProfile));
renderProfile();

};

/* ================= OPPONENT TRACKING ================= */

function trackOpponents(){

if(!userProfile.bettingStats.opponents){
userProfile.bettingStats.opponents = {};
}

players.forEach(p=>{
if(p === userProfile.name) return;

userProfile.bettingStats.opponents[p] =
(userProfile.bettingStats.opponents[p] || 0) + 1;
});

localStorage.setItem("userProfile", JSON.stringify(userProfile));
}

function closeRoundDetail(){
document.getElementById("roundDetailModal").classList.add("hidden");
}

/* ================= BASEBALL SCOREBOARD ================= */

window.openBaseballScoreboard = () => {

const innings = GAME_ENGINES.baseball.getScoreboard();

const awayTotal = innings.reduce((a,inn) => a + (inn.away ?? 0), 0);
const homeTotal = innings.reduce((a,inn) => a + (inn.home ?? 0), 0);

let html = `
<div class="mlb-scoreboard">

<div class="mlb-row header">
<div></div>
${[1,2,3,4,5,6,7,8,9].map(i=>`<div>${i}</div>`).join("")}
<div>R</div>
</div>

<div class="mlb-row">
<div class="team-name">${teams.A.join("/")}</div>
${innings.map(inn=>`<div>${inn.away !== null ? inn.away : ""}</div>`).join("")}
<div class="runs">${awayTotal}</div>
</div>

<div class="mlb-row">
<div class="team-name">${teams.B.join("/")}</div>
${innings.map(inn=>`<div>${inn.home !== null ? inn.home : ""}</div>`).join("")}
<div class="runs">${homeTotal}</div>
</div>

</div>
`;

document.getElementById("baseballScoreboardTable").innerHTML = html;
document.getElementById("baseballScoreboardModal").classList.remove("hidden");

};

window.closeBaseballScoreboard=()=>{

document.getElementById("baseballScoreboardModal")
.classList.add("hidden");

};

/* ================= MONEY ANIMATION ================= */

function animateMoney(){

const rows = document.querySelectorAll("#leaderboard div");

rows.forEach(row=>{

row.style.transform = "scale(1.05)";
row.style.transition = "transform .2s ease";

setTimeout(()=>{
row.style.transform = "scale(1)";
},200);

});

}

/* ================= CONFETTI ================= */

function spawnConfetti(){

const colors = ["#2ecc71","#f1c40f","#e74c3c","#3498db","#9b59b6","#ffffff"];
const container = document.getElementById("leaderboardModal");
if(!container) return;

for(let i = 0; i < 60; i++){

const piece = document.createElement("div");
piece.className = "confetti-piece";

piece.style.left = Math.random() * 100 + "%";
piece.style.background = colors[Math.floor(Math.random() * colors.length)];
piece.style.animationDuration = (0.8 + Math.random() * 1.2) + "s";
piece.style.animationDelay = (Math.random() * 0.6) + "s";
piece.style.width = (6 + Math.random() * 6) + "px";
piece.style.height = (6 + Math.random() * 6) + "px";
piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

container.appendChild(piece);

// Remove after animation
setTimeout(() => piece.remove(), 2500);

}

}

/* ================= SCORE AUTO ADVANCE ================= */

document.addEventListener("input",(e)=>{

if(!e.target.classList.contains("score-input")) return;

if(e.target.value.length>=1){

const inputs=[...document.querySelectorAll(".score-input")];

const index=inputs.indexOf(e.target);

if(index>-1 && index<inputs.length-1){
inputs[index+1].focus();
}

}

});