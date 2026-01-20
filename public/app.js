let selectedExerciseId = null;

function showServerError(show) {
  const el = document.getElementById("serverError");
  el.classList.toggle("d-none", !show);
}

async function apiGet(url) {
  try {
    showServerError(false);
    const res = await fetch(url);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    showServerError(true);
    return { ok: false, status: 0, data: null };
  }
}

function renderExerciseList(exercises) {
  const listEl = document.getElementById("exerciseList");
  listEl.innerHTML = "";

  for (const ex of exercises) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    const btn = document.createElement("button");
    btn.className = "btn btn-link p-0 text-start";
    btn.textContent = ex.name;
    btn.addEventListener("click", () => selectExercise(ex.id));

    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

function renderSelectedExercise(exercise) {
  document.getElementById("selectedTitle").textContent = `${exercise.name} (${exercise.id})`;
  document.getElementById("selectedMuscle").textContent = exercise.muscleGroup;

  const tbody = document.getElementById("logsTableBody");
  tbody.innerHTML = "";

  for (const log of exercise.logs) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${log.date}</td>
      <td>${log.weightKg}</td>
      <td>${log.reps}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary" disabled>Edit</button>
      </td>
    `;

    tbody.appendChild(tr);
  }

  // enable add-log button once an exercise is selected
  document.getElementById("addLogBtn").disabled = false;
}

async function loadExercises() {
  const result = await apiGet("/api/exercises");
  if (!result.ok) return;

  renderExerciseList(result.data);
}

async function selectExercise(id) {
  selectedExerciseId = id;

  const result = await apiGet(`/api/exercises/${id}`);
  if (!result.ok) return;

  renderSelectedExercise(result.data);
}

document.addEventListener("DOMContentLoaded", () => {
  loadExercises();

  // We'll wire up forms next step
});
