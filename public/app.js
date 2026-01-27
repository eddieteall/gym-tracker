/*
LLM ASSISTANCE (ChatGPT 5.2):
Used for: overall client-side structure (API helpers with fetch, rendering exercises/logs, Bootstrap modals, and form handlers).

Prompt used:
"Help me structure a vanilla JS + Bootstrap frontend for a gym tracker.
Include fetch helpers, render exercise list + selected exercise logs, add/edit/delete logs, add/edit/delete exercises, and show UI messages."
*/
// Note: VS Code AI auto-completion was used to suggest some inline comments and wording.
// No functional logic was generated solely by auto-completion.

// Global state
let selectedExerciseId = null;
let editModal = null;
let allExercises = [];
let editExerciseModal = null;


// UI helper functions
function showServerError(show) {
  const el = document.getElementById("serverError");
  el.classList.toggle("d-none", !show);
}

// type is one of "success", "danger", "warning", "info"
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

/*
LLM ASSISTANCE (ChatGPT 5.2):
Used for: fetch wrapper helpers (GET/POST) with JSON parsing + basic error handling.

Prompt used:
"Write apiGet(url) and apiPost(url, body) helpers using fetch that return {ok,status,data},
parse JSON safely, and show a server error banner on network failure."
*/
// API helper functions
async function apiGet(url) {
  try {
    showServerError(false);
    const res = await fetch(url);
    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text };
    }

    if (!res.ok) {
      showMessage("danger", data?.error || `Request failed (${res.status})`);
    }

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

// Exercise edit modal helper ---
async function openEditExerciseModal(exerciseId) {
  const result = await apiGet(`/api/exercises/${exerciseId}`);
  if (!result.ok) return;

  const ex = result.data;

  document.getElementById("editExerciseId").value = ex.id;
  document.getElementById("editExerciseName").value = ex.name;
  document.getElementById("editExerciseMuscle").value = ex.muscleGroup;

  editExerciseModal.show();
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

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await openEditExerciseModal(ex.id);
    });
    /*
    LLM ASSISTANCE (ChatGPT 5.2):
    Used for: adding "Delete exercise" button in list and calling POST /api/exercises/:id/delete with confirm + UI refresh.

    Prompt used:
    "Add a Delete button next to each exercise that confirms, calls /api/exercises/:id/delete,
    handles 400 errors (e.g., has logs), refreshes the list, and shows a message."
    */

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger ms-2";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!confirm("Delete this exercise?")) return;

      const result = await apiPost(`/api/exercises/${ex.id}/delete`, {});
      if (!result.ok) {
      showMessage("danger", result.data?.error || "Failed to delete exercise");
      return;
      }

      if (selectedExerciseId === ex.id) {
      selectedExerciseId = null;
      }

      await loadExercises();
      showMessage("success", "Exercise deleted.");
    });


    li.appendChild(btn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
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
}

/*
LLM ASSISTANCE (ChatGPT 5.2):
Used for: rendering selected exercise panel, logs table with edit/delete actions, and stats summary.

Prompt used:
"Render selected exercise details and a logs table in vanilla JS.
Include Edit/Delete buttons per log (Bootstrap modal for edit), confirm before delete,
and show simple stats like heaviest weight, best reps, and most recent date."
*/
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
      showMessage("danger", result.data?.error || "Failed to delete log");
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


/*
LLM ASSISTANCE (ChatGPT 5.2):
Used for: wiring DOMContentLoaded handlers (forms, modals, sorting, add/edit flows).

Prompt used:
"On DOMContentLoaded, wire up Bootstrap modals and form submit handlers:
add exercise, edit exercise, add log, edit log, and refresh UI after successful requests."
*/
document.addEventListener("DOMContentLoaded", () => {
  loadExercises();
  editExerciseModal = new bootstrap.Modal(document.getElementById("editExerciseModal"));
  // Handle "Edit Exercise" form submit
document.getElementById("editExerciseForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("editExerciseId").value;
  const name = document.getElementById("editExerciseName").value;
  const muscleGroup = document.getElementById("editExerciseMuscle").value;

  const result = await apiPost(`/api/exercises/${id}`, { name, muscleGroup });

  if (!result.ok) {
    showMessage("danger", result.data?.error || "Failed to update exercise");
    return;
  }

  editExerciseModal.hide();

  await loadExercises();
  if (selectedExerciseId === id) {
    await selectExercise(id);
  }

  showMessage("success", "Exercise updated.");
});

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
      showMessage("danger", result.data?.error || "Failed to add log");
      return;
    }

    addLogForm.reset();

    // Refresh the selected exercise details so the new log appears in the table
    await selectExercise(selectedExerciseId);
    showMessage("success", "Log added.");

  });

});
