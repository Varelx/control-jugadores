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

document.getElementById('loginBtn').Listener('click', () => {
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
  const phone1 = document.getElementById('playerPhone1').value;
  const phone2 = document.getElementById('playerPhone2').value;
  const license = document.getElementById('playerLicense').value;
  const moreInfo = document.getElementById('playerMoreInfo').value;

  if(!name){ alert('Nombre requerido'); return; }
  if(!birth){ alert('Fecha de nacimiento requerida'); return; }

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
      <div class="form-row"><small>Teléfono1:</small><input value='${p.phone1 || ""}' onchange='updateField("${id}","phone1",this.value)'></div>
      <div class="form-row"><small>Teléfono2:</small><input value='${p.phone2 || ""}' onchange='updateField("${id}","phone2",this.value)'></div>
      <div class="form-row"><small>Nº Licencia:</small><input value='${p.license || ""}' onchange='updateField("${id}","license",this.value)'></div>
      <div class="form-row"><small>Más info:</small><input value='${p.moreInfo || ""}' onchange='updateField("${id}","moreInfo",this.value)'></div>
      <table id='attendance_${id}'><tr><th>Fecha</th><th>Asistencia</th></tr></table>
      <button onclick='deletePlayer("${id}")'>🗑️ Borrar jugador</button>
    </div>`;
  container.appendChild(div);
  renderAttendanceTable(id,p.attendance);
  updateAttendanceButtons(id,p.attendance);
}

window.markAttendance = function(id,presente){
  const today = new Date().toISOString().slice(0,10);
  set(ref(db,'players/'+id+'/attendance/'+today),presente)
    .then(()=> {
      renderAttendanceTable(id, { [today]: presente });
      updateAttendanceButtons(id, { [today]: presente });
    });
}

window.renderAttendanceTable = function(id, attendance){
  const table = document.getElementById('attendance_'+id);
  table.innerHTML='<tr><th>Fecha</th><th>Asistencia</th></tr>';
  for(const date in attendance){
    const tr = document.createElement('tr');
    tr.innerHTML=`<td>${date}</td><td>${attendance[date]?'✅':'❌'}</td>`;
    table.appendChild(tr);
  }
}

function updateAttendanceButtons(id, attendance){
  const today = new Date().toISOString().slice(0,10);
  const asistBtn = document.getElementById('asist_'+id);
  const faltaBtn = document.getElementById('falta_'+id);
  asistBtn.classList.remove('asistio'); 
  faltaBtn.classList.remove('falto');
  if(attendance && attendance[today]!==undefined){
    if(attendance[today]) asistBtn.classList.add('asistio');
    else faltaBtn.classList.add('falto');
  }
}

window.toggleDetails = function(id){
  const el = document.getElementById('details_'+id);
  el.style.display = (el.style.display==='none'||el.style.display==='')?'block':'none';
}

window.updateField = function(id,field,value){ set(ref(db,'players/'+id+'/'+field),value); }

window.deletePlayer = function(id){ if(confirm('¿Seguro?')) remove(ref(db,'players/'+id)); }

// ---------------- FILTRO CATEGORÍAS ----------------
window.filterCategory = function(cat){
  currentCategory = (cat === 'Todas' || cat === 'all') ? 'all' : cat;

  // Quitamos la clase "active" de todos los botones
  document.querySelectorAll('.tabBtn').forEach(btn => btn.classList.remove('active'));

  // Añadimos la clase "active" al botón correspondiente
  const btn = Array.from(document.querySelectorAll('.tabBtn')).find(b => b.textContent === cat);
  if(btn) btn.classList.add('active');

  // Recargamos los jugadores filtrando por categoría
  loadPlayers();
};

// ---------------- EVENTOS ----------------
document.addEventListener('DOMContentLoaded', () => {
  // Botones de categorías
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.addEventListener('click', () => filterCategory(btn.textContent));
  });

  // Botón ver asistencias
  const viewBtn = document.getElementById('viewAttendanceBtn');
  if(viewBtn){
    viewBtn.addEventListener('click', () => showAttendanceByCategory(currentCategory));
  }
});

// ---------------- VER ASISTENCIAS ----------------
function showAttendanceByCategory(cat){
  const container = document.getElementById('playersContainer');
  container.innerHTML = '';

  get(ref(db,'players')).then(snap => {
    snap.forEach(child => {
      const p = child.val();
      const id = child.key;
      if(cat === 'all' || p.category === cat){
        const div = document.createElement('div');
        div.className = 'card';
        let attendanceRows = '';
        if(p.attendance){
          for(const date in p.attendance){
            attendanceRows += `<tr>
                                 <td>${p.name}</td>
                                 <td>${date}</td>
                                 <td>${p.attendance[date] ? '✅' : '❌'}</td>
                               </tr>`;
          }
        }
        div.innerHTML = `
          <strong>${p.name}</strong> - ${p.category}
          <table style="width:100%; margin-top:6px; border-collapse:collapse;">
            <tr><th>Jugador</th><th>Fecha</th><th>Asistencia</th></tr>
            ${attendanceRows}
          </table>`;
        container.appendChild(div);
      }
    });
  });
}

// ---------------- SWITCH VIEWS ----------------
window.switchView = function(){
  const val = document.getElementById('menuSelect').value;
  document.getElementById('app').style.display = (val==='players')?'block':'none';
  document.getElementById('adminArea').style.display = (val==='admin')?'block':'none';
}
