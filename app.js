// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "APIKEY",
  authDomain: "AUTHDOMAIN",
  databaseURL: "DBURL",
  projectId: "PROJECTID",
  storageBucket: "STORAGE",
  messagingSenderId: "MSGID",
  appId: "APPID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
let currentCategory = 'all';

// ---------------- AUTH ----------------
const authMsg = document.getElementById('authMsg');

document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(user => set(ref(db,'users/'+user.user.uid), {email, status:'pendiente', role:'user'}))
    .then(()=> showMsg('Registrado, pendiente de aprobación'))
    .catch(e => showMsg(e.message,'error'));
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth,email,password)
    .catch(e => showMsg(e.message,'error'));
});

function showMsg(msg,type='info'){ authMsg.innerText = msg; authMsg.style.color = type==='error' ? 'red' : 'green'; }

// ---------------- MENÚ DINÁMICO ----------------
onAuthStateChanged(auth, user => {
  if (!user) return;

  get(ref(db, 'users/' + user.uid)).then(snap => {
    const data = snap.val();
    if(!data) return;

    document.getElementById('menuContainer').style.display = 'block';

    // Solo admin añade la opción de Área Administración
    if(data.role === 'admin') {
      const menu = document.getElementById('menuSelect');
      if (!menu.querySelector('option[value="admin"]')) {
        const opt = document.createElement('option');
        opt.value = 'admin';
        opt.textContent = 'Área Administración';
        menu.appendChild(opt);
      }
    }

    switchView();
    loadPlayers();
    loadExercises();
  });
});

// ---------------- SWITCH VIEW ----------------
window.switchView = function() {
  const val = document.getElementById('menuSelect').value;

  document.getElementById('app').style.display = (val === 'players') ? 'block' : 'none';
  document.getElementById('exercisesArea').style.display = (val === 'exercises') ? 'block' : 'none';
  document.getElementById('adminArea').style.display = (val === 'admin') ? 'block' : 'none';

  if(val === 'exercises') loadExercises();
};

// ---------------- JUGADORES ----------------
// Aquí van todas las funciones que ya tenías: addPlayer, loadPlayers, renderPlayerCard, etc.
// Igual que antes, no hay cambios. Mantén tus funciones actuales de jugadores.

// ---------------- EJERCICIOS ----------------
document.getElementById('toggleExerciseFormBtn').addEventListener('click', ()=>{
  const form = document.getElementById('addExerciseForm');
  form.style.display = (form.style.display==='none'||form.style.display==='')?'block':'none';
});

document.getElementById('saveExerciseBtn').addEventListener('click', addExercise);

function addExercise() {
  const name = document.getElementById('exerciseName').value;
  const material = document.getElementById('exerciseMaterial').value;
  const space = document.getElementById('exerciseSpace').value;
  const players = document.getElementById('exercisePlayers').value;
  const moreInfo = document.getElementById('exerciseMoreInfo').value;

  if(!name){ alert('Nombre requerido'); return; }

  const refEx = push(ref(db,'exercises'));
  set(refEx,{name, material, space, players, moreInfo});
  clearExerciseForm();
  loadExercises();
}

function clearExerciseForm(){
  ['exerciseName','exerciseMaterial','exerciseSpace','exercisePlayers','exerciseMoreInfo'].forEach(id=>document.getElementById(id).value='');
}

function loadExercises(){
  const container = document.getElementById('exercisesContainer');
  onValue(ref(db,'exercises'), snap=>{
    container.innerHTML='';
    snap.forEach(child=>{
      const ex = child.val();
      const id = child.key;
      renderExerciseCard(id,ex,container);
    });
  });
}

function renderExerciseCard(id, ex, container){
  const div = document.createElement('div');
  div.className = 'exercise-card';
  div.innerHTML=`
    <strong>${ex.name}</strong>
    <p><strong>Material:</strong> ${ex.material}</p>
    <p><strong>Espacio:</strong> ${ex.space}</p>
    <p><strong>Jugadores:</strong> ${ex.players}</p>
    <p><strong>Más info:</strong> ${ex.moreInfo}</p>
  `;
  container.appendChild(div);
}
