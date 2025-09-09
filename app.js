// Firebase
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

// Simple auth
document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password).catch(e=>alert(e.message));
});
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth,email,password).catch(e=>alert(e.message));
});

onAuthStateChanged(auth,user=>{
  if(user){ document.getElementById('authBox').style.display='none'; document.getElementById('app').style.display='block'; loadPlayers(); }
});

// Players
document.getElementById('toggleFormBtn').addEventListener('click', ()=>{
  const f=document.getElementById('addPlayerForm'); f.style.display=(f.style.display==='none'||f.style.display==='')?'block':'none';
});
document.getElementById('savePlayerBtn').addEventListener('click', ()=>{
  const p={
    name:document.getElementById('playerName').value,
    birth:document.getElementById('playerBirth').value,
    category:document.getElementById('categorySelect').value,
    dni:document.getElementById('playerDni').value,
    address:document.getElementById('playerAddress').value,
    phone:document.getElementById('playerPhone').value,
    license:document.getElementById('playerLicense').value,
    moreInfo:document.getElementById('playerMoreInfo').value,
    attendance:{}
  };
  set(push(ref(db,'players')),p);
});

function loadPlayers(){
  const c=document.getElementById('playersContainer');
  onValue(ref(db,'players'),s=>{
    c.innerHTML='';
    s.forEach(ch=>{
      const p=ch.val(),id=ch.key;
      const d=document.createElement('div');d.className='card';
      d.innerHTML=`<strong>${p.name}</strong> - ${p.category}<br>
      <button onclick="toggleDetails('${id}')">Ver/Editar</button>
      <div id="details_${id}" class="player-details">
        <p>DNI: ${p.dni||''}</p><p>Tel: ${p.phone||''}</p><p>Licencia: ${p.license||''}</p>
        <button onclick="deletePlayer('${id}')">Borrar</button>
      </div>`;
      c.appendChild(d);
    });
  });
}

window.toggleDetails=function(id){const e=document.getElementById('details_'+id);e.style.display=(e.style.display==='none'||e.style.display==='')?'block':'none';}
window.deletePlayer=function(id){remove(ref(db,'players/'+id));}
