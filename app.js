// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Tu configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO.firebaseio.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "XXX",
  appId: "XXX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ---------------- UI ----------------
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("app");
const exercisesArea = document.getElementById("exercisesArea");
const adminArea = document.getElementById("adminArea");
const menuContainer = document.getElementById("menuContainer");
const menuSelect = document.getElementById("menuSelect");
const playersContainer = document.getElementById("playersContainer");
const exercisesContainer = document.getElementById("exercisesContainer");

// ---------------- SWITCH VIEW ----------------
window.switchView = function(){
  const val = menuSelect.value;
  appBox.style.display = (val === "players") ? "block" : "none";
  exercisesArea.style.display = (val === "exercises") ? "block" : "none";
  adminArea.style.display = (val === "admin") ? "block" : "none";
};

// ---------------- TOGGLE DETAILS ----------------
window.toggleDetails = function(id){
  const details = document.getElementById("details-" + id);
  if(details.style.display === "block"){
    details.style.display = "none";
  } else {
    details.style.display = "block";
  }
};

// ---------------- LOGIN / REGISTER ----------------
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, pass)
    .catch(err => document.getElementById("authMsg").textContent = err.message);
});

document.getElementById("registerBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, pass)
    .catch(err => document.getElementById("authMsg").textContent = err.message);
});

// ---------------- AUTH STATE ----------------
onAuthStateChanged(auth, user => {
  if(user){
    authBox.style.display = "none";
    menuContainer.style.display = "block";
    loadPlayers();
    loadExercises();
  } else {
    authBox.style.display = "block";
    menuContainer.style.display = "none";
    appBox.style.display = "none";
    exercisesArea.style.display = "none";
    adminArea.style.display = "none";
  }
});

// ---------------- PLAYERS ----------------
function loadPlayers(){
  const playersRef = ref(db, "players");
  onValue(playersRef, snap => {
    playersContainer.innerHTML = "";
    snap.forEach(child => {
      const player = child.val();
      const id = child.key;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <strong>${player.name}</strong> (${player.category || ""})
        <button onclick="toggleDetails('${id}')">Ver / Editar</button>
        <div id="details-${id}" class="player-details">
          <div class="form-row"><small>Nombre:</small><input value="${player.name || ""}"></div>
          <div class="form-row"><small>Nacimiento:</small><input value="${player.birth || ""}"></div>
          <div class="form-row"><small>DNI:</small><input value="${player.dni || ""}"></div>
          <div class="form-row"><small>Dirección:</small><input value="${player.address || ""}"></div>
          <div class="form-row"><small>Teléfono:</small><input value="${player.phone || ""}"></div>
          <div class="form-row"><small>Licencia:</small><input value="${player.license || ""}"></div>
          <div class="form-row"><small>Info:</small><input value="${player.moreInfo || ""}"></div>
        </div>
      `;
      playersContainer.appendChild(card);
    });
  });
}

// ---------------- EXERCISES ----------------
function loadExercises(){
  const exRef = ref(db, "exercises");
  onValue(exRef, snap => {
    exercisesContainer.innerHTML = "";
    snap.forEach(child => {
      const ex = child.val();
      const id = child.key;
      const card = document.createElement("div");
      card.className = "exercise-card";
      card.innerHTML = `
        <strong>${ex.name}</strong>
        <div>Material: ${ex.material || ""}</div>
        <div>Espacio: ${ex.space || ""}</div>
        <div>Jugadores: ${ex.players || ""}</div>
        <div>Info: ${ex.moreInfo || ""}</div>
      `;
      exercisesContainer.appendChild(card);
    });
  });
}

// ---------------- ADD PLAYER ----------------
document.getElementById("toggleFormBtn").addEventListener("click", () => {
  const f = document.getElementById("addPlayerForm");
  f.style.display = (f.style.display === "block") ? "none" : "block";
});

document.getElementById("savePlayerBtn").addEventListener("click", () => {
  const data = {
    name: document.getElementById("playerName").value,
    birth: document.getElementById("playerBirth").value,
    dni: document.getElementById("playerDni").value,
    address: document.getElementById("playerAddress").value,
    phone: document.getElementById("playerPhone").value,
    license: document.getElementById("playerLicense").value,
    moreInfo: document.getElementById("playerMoreInfo").value,
    category: document.getElementById("categorySelect").value
  };
  push(ref(db, "players"), data);
  document.getElementById("addPlayerForm").style.display = "none";
});

// ---------------- ADD EXERCISE ----------------
document.getElementById("toggleExerciseFormBtn").addEventListener("click", () => {
  const f = document.getElementById("addExerciseForm");
  f.style.display = (f.style.display === "block") ? "none" : "block";
});

document.getElementById("saveExerciseBtn").addEventListener("click", () => {
  const data = {
    name: document.getElementById("exerciseName").value,
    material: document.getElementById("exerciseMaterial").value,
    space: document.getElementById("exerciseSpace").value,
    players: document.getElementById("exercisePlayers").value,
    moreInfo: document.getElementById("exerciseMoreInfo").value
  };
  push(ref(db, "exercises"), data);
  document.getElementById("addExerciseForm").style.display = "none";
});
