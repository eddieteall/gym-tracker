let selectedExerciseId = null;
let editModal = null;
let allExercises = [];

function showServerError(show) {
  const el = document.getElementById("serverError");
  el.classList.toggle("d-none", !show);
}

function showMessage(type, text) {
  const el = document.getElementById("uiMessage");
  el.className = `alert alert-${type} m-3`;
  el.textContent = text;
  el.classList.remove("d-none");

  // auto-hide after 3 seconds
  setTimeout(() => {
    el.classList.add("d-none");
  }, 3000);
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

async function apiPost(url, bodyObj) {
  try {
    showServerError(false);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj)
    });

    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // If server returns HTML like "Cannot POST ...", show it
      data = { error: text };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    showServerError(true);
    return { ok: false, status: 0, data: { error: "Network error" } };
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

function getSortedLogs(logs) {
  const sortMode = document.getElementById("logSort").value;

  const copy = [...logs];
  copy.sort((a, b) => {
    if (sortMode === "oldest") return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date); // newest first
  });

  return copy;
}function getSortedLogs(logs) {
  const sortMode = document.getElementById("logSort").value;

  const copy = [...logs];
  copy.sort((a, b) => {
    if (sortMode === "oldest") return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date); // newest first
  });

  return copy;
}
function renderSelectedExercise(exercise) {
  document.getElementById("selectedTitle").textContent = `${exercise.name} (${exercise.id})`;
  document.getElementById("selectedMuscle").textContent = exercise.muscleGroup;

  const tbody = document.getElementById("logsTableBody");
  tbody.innerHTML = "";


    const statsEl = document.getElementById("statsPanel");

  if (exercise.logs.length === 0) {
    statsEl.textContent = "No stats yet — add your first log.";
  } else {
    const heaviest = Math.max(...exercise.logs.map(l => l.weightKg));
    const bestReps = Math.max(...exercise.logs.map(l => l.reps));

    // most recent by date
    const mostRecent = [...exercise.logs].sort((a, b) => b.date.localeCompare(a.date))[0];

    statsEl.textContent = `PB: ${heaviest} kg • Best reps: ${bestReps} • Last: ${mostRecent.date}`;
  }

    // If no logs yet then add a message displaying this
  if (exercise.logs.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="4" class="text-muted">
        No logs yet. Add one below.
      </td>
    `;
    tbody.appendChild(tr);

    // Still allow adding logs
    document.getElementById("addLogBtn").disabled = false;
    return;
  }


    const sortedLogs = getSortedLogs(exercise.logs);

    for (const log of sortedLogs) {

    const tr = document.createElement("tr");

    //create edit button for each log entry
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEditLogModal(log));

    //create delete button for each log entry
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger ms-2";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
    if (!confirm("Delete this log?")) return;

    const result = await apiPost(`/api/logs/${log.id}/delete`, {});
    if (!result.ok) {
      alert(result.data?.error || "Failed to delete log");
      return;
    }

    await selectExercise(selectedExerciseId);
  });



    tr.innerHTML = `
      <td>${log.date}</td>
      <td>${log.weightKg}</td>
      <td>${log.reps}</td>
    `;

    const tdActions = document.createElement("td");
    tdActions.className = "text-end";
    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  }


  // enable add-log button once an exercise is selected
  document.getElementById("addLogBtn").disabled = false;
}

async function loadExercises() {
  const result = await apiGet("/api/exercises");
  if (!result.ok) return;

  allExercises = result.data;
  applyExerciseFilter();
}
function applyExerciseFilter() {
  const query = document.getElementById("exerciseSearch").value.toLowerCase().trim();

  const filtered = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(query)
  );

  renderExerciseList(filtered);
}

async function selectExercise(id) {
  selectedExerciseId = id;

  const result = await apiGet(`/api/exercises/${id}`);
  if (!result.ok) return;

  renderSelectedExercise(result.data);
}

function openEditLogModal(log) {
  document.getElementById("editLogId").value = log.id;
  document.getElementById("editLogDate").value = log.date;
  document.getElementById("editLogWeight").value = log.weightKg;
  document.getElementById("editLogReps").value = log.reps;

  editModal.show();
}


document.addEventListener("DOMContentLoaded", () => {
  loadExercises();
  document.getElementById("exerciseSearch").addEventListener("input", applyExerciseFilter);
    const addExerciseForm = document.getElementById("addExerciseForm");

    document.getElementById("logSort").addEventListener("change", async () => {
    if (selectedExerciseId) {
      await selectExercise(selectedExerciseId);
    }
  });


  addExerciseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("exName").value;
    const muscleGroup = document.getElementById("exMuscle").value;

    const result = await apiPost("/api/exercises", {
      name,
      muscleGroup
    });

    if (!result.ok) {
      showMessage("danger", result.data?.error || "Failed to add exercise");
      return;
    }

    // Clear inputs
    addExerciseForm.reset();

    // Refresh list
    await loadExercises();
    showMessage("success", "Exercise added.");

  });

      editModal = new bootstrap.Modal(document.getElementById("editLogModal"));

  const editLogForm = document.getElementById("editLogForm");
  editLogForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const logId = document.getElementById("editLogId").value;
    if (!logId) {
      alert("No log selected to edit (logId missing).");
      return;
    }
    const date = document.getElementById("editLogDate").value;
    const weightKg = Number(document.getElementById("editLogWeight").value);
    const reps = Number(document.getElementById("editLogReps").value);

    const result = await apiPost(`/api/logs/${logId}`, { date, weightKg, reps });

    if (!result.ok) {
      showMessage("danger", result.data?.error || "Failed to update log");
      return;
    }

    editModal.hide();

    // Refresh selected exercise so table updates immediately
    if (selectedExerciseId) {
      await selectExercise(selectedExerciseId);
    }
  });

    const addLogForm = document.getElementById("addLogForm");

  addLogForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedExerciseId) {
      alert("Select an exercise first.");
      return;
    }

    const date = document.getElementById("logDate").value;
    const weightKg = Number(document.getElementById("logWeight").value);
    const reps = Number(document.getElementById("logReps").value);

    const result = await apiPost("/api/logs", {
      exerciseId: selectedExerciseId,
      date,
      weightKg,
      reps
    });

    if (!result.ok) {
      alert(result.data?.error || "Failed to add log");
      return;
    }

    addLogForm.reset();

    // Refresh the selected exercise details so the new log appears in the table
    await selectExercise(selectedExerciseId);
    showMessage("success", "Log added.");

  });

});
