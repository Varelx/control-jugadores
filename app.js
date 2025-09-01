// ---------------- EJERCICIOS ----------------
let currentExerciseFilter = 'all'; // filtro inicial

const exercisesContainer = document.getElementById('exercisesContainer');
const toggleExerciseFormBtn = document.getElementById('toggleExerciseFormBtn');
const addExerciseForm = document.getElementById('addExerciseForm');
const saveExerciseBtn = document.getElementById('saveExerciseBtn');

// Mostrar/ocultar formulario
toggleExerciseFormBtn.addEventListener('click', () => {
  addExerciseForm.style.display = (addExerciseForm.style.display === 'none' || addExerciseForm.style.display === '') ? 'block' : 'none';
});

// Guardar ejercicio
saveExerciseBtn.addEventListener('click', addExercise);

function addExercise() {
  const title = document.getElementById('exerciseTitle').value;
  const category = document.getElementById('exerciseCategory').value || '1';
  const material = document.getElementById('exerciseMaterial').value;
  const space = document.getElementById('exerciseSpace').value;
  const players = document.getElementById('exercisePlayers').value;
  const moreInfo = document.getElementById('exerciseMoreInfo').value;
  const imageFile = document.getElementById('exerciseImage').files[0];

  if (!title) { alert('Título requerido'); return; }

  const refExercise = push(ref(db, 'exercises'));
  const newExercise = { title, category, material, space, players, moreInfo, imageUrl: '' };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      newExercise.imageUrl = e.target.result;
      set(refExercise, newExercise);
    };
    reader.readAsDataURL(imageFile);
  } else {
    set(refExercise, newExercise);
  }

  clearForm(['exerciseTitle','exerciseCategory','exerciseMaterial','exerciseSpace','exercisePlayers','exerciseMoreInfo','exerciseImage']);
  addExerciseForm.style.display='none';
}

// Limpiar formulario
function clearForm(ids) { ids.forEach(id => document.getElementById(id).value = ''); }

// Filtrar ejercicios
window.filterExercise = function(cat) {
  currentExerciseFilter = cat;
  document.querySelectorAll('.exerciseFilter').forEach(btn => btn.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.exerciseFilter')).find(b => b.textContent.toLowerCase() === cat.toLowerCase() || b.textContent === cat);
  if (btn) btn.classList.add('active');
  loadExercises();
}

// Cargar ejercicios
function loadExercises() {
  onValue(ref(db,'exercises'), snap => {
    exercisesContainer.innerHTML = '';
    snap.forEach(child => {
      const ex = child.val();
      const id = child.key;
      if (currentExerciseFilter === 'all' || ex.category === currentExerciseFilter) {
        renderExerciseCard(id, ex, exercisesContainer);
      }
    });
  });
}

// Renderizar ficha ejercicio
function renderExerciseCard(id, ex, container) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class='info'>
      ${ex.imageUrl ? `<img src="${ex.imageUrl}" alt="${ex.title}">` : ''}
      <input value='${ex.title}' placeholder="Título" onchange='updateExerciseField("${id}","title",this.value)'>
      <input value='${ex.material || ""}' placeholder="Material" onchange='updateExerciseField("${id}","material",this.value)'>
      <input value='${ex.space || ""}' placeholder="Espacio" onchange='updateExerciseField("${id}","space",this.value)'>
      <input value='${ex.players || ""}' placeholder="Jugadores" onchange='updateExerciseField("${id}","players",this.value)'>
      <input value='${ex.moreInfo || ""}' placeholder="Más info" onchange='updateExerciseField("${id}","moreInfo",this.value)'>
      <button onclick='deleteExercise("${id}")'>🗑️ Borrar ejercicio</button>
    </div>`;
  container.appendChild(div);
}

// Actualizar campo ejercicio
window.updateExerciseField = function(id, field, value) {
  set(ref(db, 'exercises/' + id + '/' + field), value);
}

// Borrar ejercicio
window.deleteExercise = function(id) {
  if (confirm('¿Seguro que quieres borrar este ejercicio?')) remove(ref(db,'exercises/'+id));
}

// Cargar ejercicios al inicio
loadExercises();
