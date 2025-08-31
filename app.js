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
  const fatherName = document.getElementById('fatherName').value;
  const fatherPhone = document.getElementById('fatherPhone').value;
  const motherName = document.getElementById('motherName').value;
  const motherPhone = document.getElementById('motherPhone').value;
  const category = document.getElementById('categorySelect').value;

  if(!name){ alert('Nombre requerido'); return; }
  if(!/^\d{9}$/.test(fatherPhone)){ alert('Teléfono padre no válido'); return; }
  if(!/^\d{9}$/.test(motherPhone)){ alert('Teléfono madre no válido'); return; }
  if(new Date(birth) > new Date()){ alert('Fecha de nacimiento inválida'); return; }

  const refPlayer = push(ref(db,'players'));
  set(refPlayer, {name,birth,fatherName,fatherPhone,motherName,motherPhone,category,attendance:{}});
  clearForm(['playerName','playerBirth','fatherName','fatherPhone','motherName','motherPhone']);
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

function renderPlayerCard(id,p,container){
  const div = document.createElement('div');
  div.className='card';
  div.innerHTML=`
    <div class='info'>
      <strong>${p.name}</strong>
      <small>Categoría: ${p.category}</small>
      <div class='attendance-buttons'>
        <button id='asist_${id}' onclick='markAttendance("${id}",true)'>✅ Asistencia</button>
        <button id='falta_${id}' onclick='markAttendance("${id}",false)'>❌ No asistencia</button>
      </div>
      <button onclick='toggleDetails("${id}")'>Ver / Editar</button>
    </div>
    <div class='player-details' id='details_${id}'>
      <div class="form-row"><small>Nacimiento:</small><input value='${p.birth}' onchange='updateField("${id}","birth",this.value)'></div>
      <div class="form-row"><small>Padre:</small><input value='${p.fatherName}' onchange='updateField("${id}","fatherName",this.value)'>
      <small>Nº Tlf. Padre:</small><input value='${p.fatherPhone}' onchange='updateField("${id}","fatherPhone",this
