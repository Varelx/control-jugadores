// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-DTX0x8Bebk6Z1TEkyVD3K4jOPVSmLA",
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

document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if(!email || !password){ showMsg('Completa email y contraseña','error'); return; }

  try{
    const user = await createUserWithEmailAndPassword(auth,email,password);
    await set(ref(db,'users/'+user.user.uid), {email, status:'pendiente'});
    showMsg('Registrado, pendiente de aprobación');
  } catch(e){
    showMsg(e.message,'error');
  }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if(!email || !password){ showMsg('Completa email y contraseña','error'); return; }
  try{ await signInWithEmailAndPassword(auth,email,password); }
  catch(e){ showMsg(e.message,'error'); }
});

onAuthStateChanged(auth, async user=>{
  if(user){
    const snap = await get(ref(db,'users/'+user.uid));
    const data = snap.val();
