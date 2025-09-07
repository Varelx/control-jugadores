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

    document.getElementById('authBox').style.display = 'none';
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
document.getElementById('toggleFormBtn').addEventListener('click', ()=>{
  const form = document.getElementById('addPlayerForm');
  form.style.display = (form.style.display==='none'||form.style.display==='')?'block':'none';
});

document.getElementById('savePlayerBtn').addEventListener('click', addPlayer);

function addPlayer(){
  const name = document.getElementById('playerName').value;
  const birth = document.getElementById('playerBirth').value;
  const category = document.getElementById('categorySelect').value;
  const dni = document.getElementById('playerDni').value;
  const address = document.getElementById('playerAddress').value;
  const phone = document.getElementById('playerPhone').value;
  const license = document.getElementById('playerLicense').value;
  const moreInfo = document.getElementById('playerMoreInfo').value;

  if(!name){ alert('Nombre requerido'); return; }
  if(!birth){ alert('Fecha de nacimiento requerida'); return; }

  const refPlayer = push(ref(db,'players'));
  set(refPlayer, {name, birth, category, dni, address, phone, license, moreInfo, attendance:{}});
  clearForm(['playerName','playerBirth','categorySelect','playerDni','playerAddress','playerPhone','playerLicense','playerMoreInfo']);
  document.getElementById('addPlayerForm').style.display='none';
}

function clearForm(ids){ ids.forEach(id=>document.getElementById(id).value=''); }

function loadPlayers(){
  const container = document.getElementById('playersContainer');
  onValue(ref(db,'players'), snap=>{
    container.innerHTML='';
    snap.forEach(child=>{
      const p = child.val();
      const id = child.key;
      if(currentCategory==='all'||p.category===currentCategory){
        renderPlayerCard(id,p,container);
      }
    });
  });
}

function renderPlayerCard(id, p, container){
  const div = document.createElement('div');
  div.className='card';
  div.innerHTML=`
    <div class='info'>
      <input value='${p.name}' onchange='updateField("${id}","name",this.value)' 
             style="font-weight:600; font-size:1.1em; width:100%; border:none; background:transparent;">
      <small>Categoría: ${p.category}</small>
      <div class='attendance-buttons'>
        <button id='asist_${id}' onclick='markAttendance("${id}",true)'>✅ Asistencia</button>
        <button id='falta_${id}' onclick='markAttendance("${id}",false)'>❌ No asistencia</button>
