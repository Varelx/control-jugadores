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
let currentExerciseCategory = 'all';

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
        document.getElementById('app').style.display='block';

        if(data.role==='admin'){
          document.getElementById('menuContainer').style.display='block';
        }

        loadPlayers();
        loadExercises();
      }
    });
  } else {
    document.getElementById('menuContainer').style.display='none';
  }
});

function showMsg(msg,type='info'){
  authMsg.innerText = msg;
  authMsg.style.color = type==='error' ? 'red' : 'green';
}

// ---------------- ADMIN ----------------
document.getElementById('adminBtn').addEventListener('click', () => {
  const user = auth.currentUser;
  if(!user) return alert('No has iniciado sesión');

  get(ref(db,'users/' + user.uid)).then(snap=>{
    const data = snap.val();
    if(!data || data.role !== 'admin'){
      return alert('No tienes permisos de administrador');
    }

    const list = document.getElementById('requestsList');
    list.innerHTML='';
    get(ref(db,'users')).then(snap=>{
      snap.forEach(child=>{
        const u = child.val();
        if(u.status === 'pendiente'){
          const div = document.createElement('div');
          div.innerHTML = `${u.email} <button onclick='approveUser("${child.key}", this)'>Aprobar</button>`;
          list.appendChild(div);
        }
      });
    });
  });
});

window.approveUser = function(uid, btn){
  set(ref(db,'users/'+uid+'/status'),'aprobado')
    .then(()=> btn.parentNode.remove());
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
      </div>
      <button onclick='toggleDetails("${id}")'>Ver / Editar</button>
    </div>
    <div class='player-details' id='details_${id}'>
      <div class="form-row"><small>Nacimiento:</small><input value='${p.birth || ""}' onchange='updateField("${id}","birth",this.value)'></div>
      <div class="form-row"><small>DNI:</small><input value='${p.dni || ""}' onchange='updateField("${id}","dni",this.value)'></div>
      <div class="form-row"><small>Dirección:</small><input value='${p.address || ""}' onchange='updateField("${id}","address",this.value)'></div>
      <div class="form-row"><small>Teléfono:</small><input value='${p.phone || ""}' onchange='updateField("${id}","phone",this.value)'></div>
      <div class="form-row"><small>Nº Licencia:</small><input value='${p.license || ""}' onchange='updateField("${id}","license",this.value)'></div>
      <div class="form-row"><small>Más info:</small><input value='${p.moreInfo || ""}' onchange='updateField("${id}","moreInfo",this.value)'></div>
      <table id='attendance_${id}'><tr><th>Fecha</th><th>Asistencia</th></tr></table>
      <button onclick='deletePlayer("${id}")'>🗑️ Borrar jugador</button>
    </div>`;
  container.appendChild(div);
  renderAttendanceTable(id,p.attendance);
  updateAttendanceButtons(id,p.attendance);
}

// ---------------- UPDATE FIELDS ----------------
window.updateField = function(id, field, value){
  set(ref(db,'players/'+id+'/'+field), value);
}

window.deletePlayer = function(id){
  if(confirm('¿Seguro que quieres borrar este jugador?')){
    remove(ref(db,'players/'+id));
  }
}

window.toggleDetails = function(id){
  const el = document.getElementById('details_'+id);
  el.style.display = (el.style.display==='none'||el.style.display==='')?'block':'none';
}

// ---------------- ATTENDANCE ----------------
window.markAttendance = function(id, present){
  const date = new Date().toISOString().split('T')[0];
  set(ref(db,'players/'+id+'/attendance/'+date), present);
}

function renderAttendanceTable(id, attendance){
  const table = document.getElementById('attendance_'+id);
  if(!table) return;
  table.innerHTML='<tr><th>Fecha</th><th>Asistencia</th></tr>';
  if(attendance){
    Object.keys(attendance).forEach(d=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${d}</td><td>${attendance[d]?'✅':'❌'}</td>`;
      table.appendChild(tr);
    });
  }
}

function updateAttendanceButtons(id, attendance){
  const today=new Date().toISOString().split('T')[0];
  if(attendance && attendance[today]!==undefined){
    document.getElementById('asist_'+id).disabled=true;
    document.getElementById('falta_'+id).disabled=true;
  }
}

// ---------------- FILTER PLAYERS ----------------
window.filterCategory = function(cat){
  currentCategory=cat;
  loadPlayers();
}

// ---------------- EXERCISES ----------------
document.getElementById('toggleExerciseFormBtn').addEventListener('click', ()=>{
  const form = document.getElementById('addExerciseForm');
  form.style.display = (form.style.display==='none'||form.style.display==='')?'block':'none';
});

document.getElementById('saveExerciseBtn').addEventListener('click', addExercise);

function addExercise(){
  const name = document.getElementById('exerciseName').value;
  const category = document.getElementById('exerciseCategory').value;
  const material = document.getElementById('exerciseMaterial').value;
  const space = document.getElementById('exerciseSpace').value;
  const players = document.getElementById('exercisePlayers').value;
  const moreInfo = document.getElementById('exerciseMoreInfo').value;
  const imgInput = document.getElementById('exerciseImage');

  if(!name){ alert('Nombre requerido'); return; }

  // Convertir imagen a base64 si hay
  if(imgInput.files && imgInput.files[0]){
    const reader = new FileReader();
    reader.onload = function(e){
      saveExerciseToDB(name,category,material,space,players,moreInfo,e.target.result);
    }
    reader.readAsDataURL(imgInput.files[0]);
  } else {
    saveExerciseToDB(name,category,material,space,players,moreInfo,null);
  }
}

function saveExerciseToDB(name,category,material,space,players,moreInfo,image){
  const refEx = push(ref(db,'exercises'));
  set(refEx, {name, category, material, space, players, moreInfo, image});
  clearForm(['exerciseName','exerciseCategory','exerciseMaterial','exerciseSpace','exercisePlayers','exerciseMoreInfo','exerciseImage']);
  document.getElementById('addExerciseForm').style.display='none';
}

function loadExercises(){
  const container = document.getElementById('exercisesContainer');
  onValue(ref(db,'exercises'), snap=>{
    container.innerHTML='';
    snap.forEach(child=>{
      const ex = child.val();
      const id = child.key;
      if(currentExerciseCategory==='all'||ex.category===currentExerciseCategory){
        renderExerciseCard(id,ex,container);
      }
    });
  });
}

function renderExerciseCard(id, ex, container){
  const div=document.createElement('div');
  div.className='card';
  div.innerHTML=`
    <div class='info'>
      <input value='${ex.name}' onchange='updateExerciseField("${id}","name",this.value)' 
             style="font-weight:600; font-size:1.1em; width:100%; border:none; background:transparent;">
      <small>Categoría: ${ex.category}</small>
      ${ex.image?`<img src="${ex.image}" style="max-width:100%; border-radius:8px; margin-top:8px;">`:''}
      <button onclick='toggleExerciseDetails("${id}")'>Ver / Editar</button>
    </div>
    <div class='player-details' id='exerciseDetails_${id}'>
      <div class="form-row"><small>Material:</small><input value='${ex.material||""}' onchange='updateExerciseField("${id}","material",this.value)'></div>
      <div class="form-row"><small>Espacio:</small><input value='${ex.space||""}' onchange='updateExerciseField("${id}","space",this.value)'></div>
      <div class="form-row"><small>Jugadores:</small><input value='${ex.players||""}' onchange='updateExerciseField("${id}","players",this.value)'></div>
      <div class="form-row"><small>Más info:</small><input value='${ex.moreInfo||""}' onchange='updateExerciseField("${id}","moreInfo",this.value)'></div>
      <button onclick='deleteExercise("${id}")'>🗑️ Borrar ejercicio</button>
    </div>`;
  container.appendChild(div);
}

window.updateExerciseField = function(id, field, value){
  set(ref(db,'exercises/'+id+'/'+field), value);
}

window.deleteExercise = function(id){
  if(confirm('¿Seguro que quieres borrar este ejercicio?')){
    remove(ref(db,'exercises/'+id));
  }
}

window.toggleExerciseDetails = function(id){
  const el=document.getElementById('exerciseDetails_'+id);
  el.style.display=(el.style.display==='none'||el.style.display==='')?'block':'none';
}

// ---------------- FILTER EXERCISES ----------------
window.filterExerciseCategory = function(cat){
  currentExerciseCategory=cat;
  loadExercises();
}

// ---------------- SWITCH VIEW ----------------
window.switchView = function(){
  const val=document.getElementById('menuSelect').value;
  document.getElementById('app').style.display=(val==='players')?'block':'none';
  document.getElementById('adminArea').style.display=(val==='admin')?'block':'none';
  document.getElementById('exercisesArea').style.display=(val==='exercises')?'block':'none';
}
