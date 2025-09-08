// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// TODO: Cambia esto por tu config de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-DTX0x8Bebk6Z1TEkyyVD3K4jOPVSmLA",
  authDomain: "control-jugadores-64ae6.firebaseapp.com",
  databaseURL: "https://control-jugadores-64ae6-default-rtdb.firebaseio.com",
  projectId: "control-jugadores-64ae6",
  storageBucket: "control-jugadores-64ae6.firebasestorage.app",
  messagingSenderId: "345003884874",
  appId: "1:345003884874:web:51308a576a636b5a9741b3",
  measurementId: "G-1RR2CLEPL1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ---------------- AUTH ----------------
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => document.getElementById('authMsg').innerText = "✅ Login correcto")
    .catch(err => document.getElementById('authMsg').innerText = err.message);
});

document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => document.getElementById('authMsg').innerText = "✅ Usuario creado")
    .catch(err => document.getElementById('authMsg').innerText = err.message);
});

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('authBox').style.display = "none";
    document.getElementById('app').style.display = "block";
    document.getElementById('menuContainer').style.display = "block";
    loadPlayers();
    loadExercises();
  } else {
    document.getElementById('authBox').style.display = "block";
    document.getElementById('app').style.display = "none";
    document.getElementById('menuContainer').style.display = "none";
    document.getElementById('exercisesArea').style.display = "none";
    document.getElementById('adminArea').style.display = "none";
  }
});

// ---------------- SWITCH VIEW ----------------
window.switchView = function(){
  const val=document.getElementById('menuSelect').value;
  document.getElementById('app').style.display=(val==='players')?'block':'none';
  document.getElementById('adminArea').style.display=(val==='admin')?'block':'none';
  document.getElementById('exercisesArea').style.display=(val==='exercises')?'block':'none';
}

// ---------------- PLAYERS ----------------
document.getElementById('toggleFormBtn').addEventListener('click',()=>{
  const form=document.getElementById('addPlayerForm');
  form.style.display=form.style.display==="none"?"block":"none";
});

document.getElementById('savePlayerBtn').addEventListener('click',()=>{
  const player={
    name:document.getElementById('playerName').value,
    birth:document.getElementById('playerBirth').value,
    dni:document.getElementById('playerDni').value,
    address:document.getElementById('playerAddress').value,
    phone:document.getElementById('playerPhone').value,
    license:document.getElementById('playerLicense').value,
    more:document.getElementById('playerMoreInfo').value,
    category:document.getElementById('categorySelect').value
  };
  const playersRef=ref(db,"players");
  push(playersRef,player);
});

function loadPlayers(){
  const playersRef=ref(db,"players");
  onValue(playersRef,snap=>{
    const cont=document.getElementById('playersContainer');
    cont.innerHTML="";
    snap.forEach(child=>{
      const p=child.val();
      const div=document.createElement('div');
      div.className="card";
      div.innerHTML=`<strong>${p.name}</strong> (${p.category})`;
      cont.appendChild(div);
    });
  });
}

// ---------------- EXERCISES ----------------
document.getElementById('toggleExerciseFormBtn').addEventListener('click',()=>{
  const form=document.getElementById('addExerciseForm');
  form.style.display=form.style.display==="none"?"block":"none";
});

document.getElementById('saveExerciseBtn').addEventListener('click',()=>{
  const ex={
    name:document.getElementById('exerciseName').value,
    material:document.getElementById('exerciseMaterial').value,
    space:document.getElementById('exerciseSpace').value,
    players:document.getElementById('exercisePlayers').value,
    more:document.getElementById('exerciseMoreInfo').value,
    category:document.getElementById('exerciseCategory').value
  };
  const exRef=ref(db,"exercises");
  push(exRef,ex);
});

function loadExercises(){
  const exRef=ref(db,"exercises");
  onValue(exRef,snap=>{
    const cont=document.getElementById('exercisesContainer');
    cont.innerHTML="";
    snap.forEach(child=>{
      const e=child.val();
      const div=document.createElement('div');
      div.className="exercise-card";
      div.innerHTML=`<strong>${e.name}</strong> (Cat: ${e.category})`;
      cont.appendChild(div);
    });
  });
}

// ---------------- FILTERS ----------------
window.filterCategory=function(cat){
  const cards=document.querySelectorAll('#playersContainer .card');
  cards.forEach(c=>c.style.display=(cat==="all"||c.innerText.includes(cat))?"block":"none");
}
window.filterExercise=function(cat){
  const cards=document.querySelectorAll('#exercisesContainer .exercise-card');
  cards.forEach(c=>c.style.display=(cat==="all"||c.innerText.includes(cat))?"block":"none");
}
