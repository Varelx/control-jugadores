// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getDatabase(app);
const auth = getAuth(app);
let currentCategory = 'all';

// ---------------- AUTH ----------------
const authMsg = document.getElementById('authMsg');

document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(user => set(ref(db,'users/'+user.user.uid), {email, status:'pendiente'}))
    .then(()=> showMsg('Registrado, pendiente de aprobación'))
    .catch(e => showMsg(e.message,'error'));
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth,email,password)
    .catch(e => showMsg(e.message,'error'));
});

onAuthStateChanged(auth,user=>{
  if(user){
    get(ref(db,'users/'+user.uid)).then(snap=>{
      const data = snap.val();
      if(data && data.status==='aprobado'){
        document.getElementById('authBox').style.display='none';
        document.getElementById('pagesContainer').style.display='block';
        showPage('pagePlayers');
        if(data.role==='admin'){ /* aquí podrías mostrar opciones admin */ }
        loadPlayers();
      }
    });
  }
});

function showMsg(msg,type='info'){
  authMsg.innerText = msg;
  authMsg.style.color = type==='error' ? 'red' : 'green';
}

// ---------------- DARK MODE ----------------
document.getElementById('darkModeToggle').addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
});

// ---------------- PAGES NAV ----------------
window.showPage = function(id){
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  const page = document.getElementById(id);
  if(page) page.style.display='block';
}

// ---------------- PLAYERS ----------------
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
  const phone1 = document.getElementById('playerPhone1').value;
  const phone2 = document.getElementById('playerPhone2').value;
  const license = document.getElementById('playerLicense').value;
  const moreInfo = document.getElementById('playerMoreInfo').value;

  if(!name || !birth){ alert('Nombre y nacimiento requeridos'); return; }

  const refPlayer = push(ref(db,'players'));
  set(refPlayer, {name, birth, category, dni, address, phone1, phone2, license, moreInfo, attendance:{}});
  clearForm(['playerName','playerBirth','categorySelect','playerDni','playerAddress','playerPhone1','playerPhone2','playerLicense','playerMoreInfo']);
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
      <input value='${p.name}' onchange='updateField("${id}","name",this.value)' style="font-weight:600; font-size:1.1em;">
      <small>Categoría: ${p.category}</small>
      <div class='attendance-buttons'>
        <button id='asist_${id}' onclick='markAttendance("${id}",true)'>✅ Asistencia</button>
        <button id='falta_${id}' onclick='markAttendance("${id}",false)'>❌ No asistencia</button>
      </div>
      <button onclick='toggleDetails("${id}")'>Ver / Editar</button>
    </div>
    <div class='player-details' id='details_${id}'>
      <div class="form-row"><small>Nacimiento:</small><input value='${p.birth || ""}' onchange='updateField("${id}","birth",this.value)'></div>
      <div class="form-row"><small>DNI:</small><input value='${p.dni || ""}' onchange='updateField("${id}","dni",this.value)'></div>
      <div class="form-row"><small>Dirección:</small><textarea onchange='updateField("${id}","address",this.value)'>${p.address || ""}</textarea></div>
      <div class="form-row"><small>Teléfono 1:</small><input value='${p.phone1 || ""}' onchange='updateField("${id}","phone1",this.value)'></div>
      <div class="form-row"><small>Teléfono 2:</small><input value='${p.phone2 || ""}' onchange='updateField("${id}","phone2",this.value)'></div>
      <div class="form-row"><small>Licencia:</small><input value='${p.license || ""}' onchange='updateField("${id}","license",this.value)'></div>
      <div class="form-row"><small>Más info:</small><textarea onchange='updateField("${id}","moreInfo",this.value)'>${p.moreInfo || ""}</textarea></div>
    </div>`;
  container.appendChild(div);
}

// Ajuste automático altura textareas
document.addEventListener('input', e=>{
  if(e.target.tagName==='TEXTAREA'){
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight+'px';
  }
});

// ---------------- Exercises ----------------
document.getElementById('toggleExerciseFormBtn')?.addEventListener('click', ()=>{
  const form = document.getElementById('addExerciseForm');
  form.style.display = (form.style.display==='none'||form.style.display==='')?'block':'none';
});

// Aquí podrías agregar Firebase para ejercicios igual que jugadores

// ---------------- Files Upload ----------------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');

dropZone?.addEventListener('click', ()=> fileInput.click());
dropZone?.addEventListener('dragover', e=> { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone?.addEventListener('dragleave', e=> dropZone.classList.remove('dragover'));
dropZone?.addEventListener('drop', e=> {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput?.addEventListener('change', e=> handleFiles(e.target.files));

function handleFiles(files){
  Array.from(files).forEach(file=>{
    const div = document.createElement('div');
    div.textContent = file.name;
    filesList.appendChild(div);
  });
}

// ---------------- Misc ----------------
window.toggleDetails = function(id){
  const el = document.getElementById('details_'+id);
  el.style.display = (el.style.display==='none'||el.style.display==='')?'block':'none';
}

window.updateField = function(id,field,value){ set(ref(db,'players/'+id+'/'+field),value); }
window.markAttendance = function(id,presente){
  const today = new Date().toISOString().slice(0,10);
  set(ref(db,'players/'+id+'/attendance/'+today),presente);
}
