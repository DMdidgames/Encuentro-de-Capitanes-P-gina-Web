const stations = [
  "Hippos",
  "Llenala",
  "Palos samuray",
  "Mision espuma",
  "Torre infinita",
  "Alfombra magica",
  "Vasos al aire",
  "Deslizate",
].map((name, index) => ({
  id: `E${String(index + 1).padStart(2, "0")}`,
  name,
}));

const officialTeams = ["Tierra 1", "Tierra 2", "Agua 1", "Agua 2", "Aire 1", "Aire 2", "Fuego 1", "Fuego 2"];

const evaluatorUsers = [
  { username: "eval.tierra1", password: "tierra1", role: "evaluator", name: "Marisol Herrera" },
  { username: "eval.tierra2", password: "tierra2", role: "evaluator", name: "Eduardo Carrillo" },
  { username: "eval.agua1", password: "agua1", role: "evaluator", name: "Patricia Molina" },
  { username: "eval.agua2", password: "agua2", role: "evaluator", name: "Javier Serrano" },
  { username: "eval.aire1", password: "aire1", role: "evaluator", name: "Gabriela Cantu" },
  { username: "eval.aire2", password: "aire2", role: "evaluator", name: "Roberto Salinas" },
  { username: "eval.fuego1", password: "fuego1", role: "evaluator", name: "Elisa Mendoza" },
  { username: "eval.fuego2", password: "fuego2", role: "evaluator", name: "Arturo Delgado" },
];

const users = [
  { username: "admin", password: "admin2026", role: "admin", name: "Administrador" },
  ...evaluatorUsers,
];

const criteria = [
  {
    id: "comunicacion",
    name: "Comunicacion",
    weight: 20,
    description: "Explica ideas con claridad, escucha, confirma acuerdos y adapta su mensaje al equipo.",
  },
  {
    id: "trabajoEquipo",
    name: "Trabajo en equipo",
    weight: 20,
    description: "Integra voces, reparte tareas, sostiene la colaboracion y evita excluir participantes.",
  },
  {
    id: "liderazgo",
    name: "Liderazgo",
    weight: 25,
    description: "Toma iniciativa, ordena prioridades, mantiene calma y moviliza al equipo hacia el objetivo.",
  },
  {
    id: "resolucion",
    name: "Resolucion de problemas",
    weight: 20,
    description: "Analiza restricciones, propone alternativas, aprende del error y decide con informacion incompleta.",
  },
  {
    id: "responsabilidad",
    name: "Responsabilidad y criterio",
    weight: 15,
    description: "Actua con respeto, cuida reglas y personas, reconoce limites y asume consecuencias.",
  },
];

const storageKey = "capitanes-rally-simulacion-v3";
const sessionKey = "capitanes-rally-session";
const fallbackStorage = new Map();
const simulatedNames = [
  "Ana Sofia Martinez",
  "Diego Alejandro Ruiz",
  "Valeria Hernandez",
  "Santiago Lopez",
  "Camila Torres",
  "Mateo Ramirez",
  "Regina Flores",
  "Emiliano Garcia",
  "Ximena Castro",
  "Leonardo Morales",
  "Isabella Navarro",
  "Sebastian Vargas",
  "Mariana Reyes",
  "Nicolas Mendoza",
  "Fernanda Silva",
  "Joaquin Ortega",
  "Renata Aguilar",
  "Andres Castillo",
  "Paula Jimenez",
  "Rodrigo Santos",
  "Daniela Rojas",
  "Gael Medina",
  "Lucia Herrera",
  "Pablo Cardenas",
  "Victoria Salazar",
  "Ivan Dominguez",
  "Carolina Vega",
  "Alan Pineda",
  "Sofia Luna",
  "Bruno Cabrera",
  "Natalia Fuentes",
  "Hector Valdez",
  "Aitana Cruz",
  "Mauricio Pena",
  "Elena Robles",
  "Tomas Ibarra",
  "Andrea Solis",
  "Luis Fernando Campos",
  "Jimena Palacios",
  "Kevin Acosta",
  "Montserrat Arias",
  "Rafael Montoya",
  "Claudia Espinoza",
  "Oscar Benitez",
  "Mia Pacheco",
  "Carlos Rangel",
  "Sara Quiroz",
  "Miguel Angel Soto",
  "Daniela Becerra",
  "Adrian Estrada",
];
const defaultCandidates = simulatedNames.map((name, index) => ({
  id: uid(),
  name,
  team: officialTeams[index % officialTeams.length],
  enrollment: `SIM-${String(index + 1).padStart(3, "0")}`,
}));
const defaultRatings = createSimulatedRatings(defaultCandidates);

let state = loadState();
let currentUser = loadSession();
let selectedCandidateId = "";
let applyingRemoteState = false;
let pendingSharedSave = null;
const sharedApi = {
  enabled: false,
  updatedAt: "",
};

const $ = (selector) => document.querySelector(selector);
const loginScreen = $("#loginScreen");
const appShell = $("#appShell");
const stationSelect = $("#stationSelect");
const teamSelect = $("#teamSelect");
const searchInput = $("#searchInput");
const candidateList = $("#candidateList");
const candidateTemplate = $("#candidateTemplate");
const scoreForm = $("#scoreForm");
const criteriaFields = $("#criteriaFields");
const notesInput = $("#notesInput");
const thresholdInput = $("#thresholdInput");

function loadState() {
  try {
    const parsed = JSON.parse(readStorage(localStorage, storageKey));
    if (parsed?.candidates?.length) {
      return {
        candidates: parsed.candidates,
        ratings: parsed.ratings || {},
        messages: parsed.messages || [],
        threshold: parsed.threshold || 80,
      };
    }
  } catch (error) {
    console.warn("No se pudo cargar el respaldo local.", error);
  }

  return {
    candidates: defaultCandidates,
    ratings: defaultRatings,
    messages: [],
    threshold: 80,
  };
}

function saveState() {
  writeStorage(localStorage, storageKey, JSON.stringify(state));
  if (!applyingRemoteState) {
    queueSharedStateSave();
  }
}

function loadSession() {
  try {
    const session = JSON.parse(readStorage(sessionStorage, sessionKey));
    if (session?.username && session?.role) {
      return session;
    }
  } catch (error) {
    console.warn("No se pudo cargar la sesion.", error);
  }
  return null;
}

function saveSession(user) {
  const session = { username: user.username, role: user.role, name: user.name };
  writeStorage(sessionStorage, sessionKey, JSON.stringify(session));
  currentUser = session;
}

function clearSession() {
  removeStorage(sessionStorage, sessionKey);
  currentUser = null;
}

function readStorage(storage, key) {
  try {
    return storage.getItem(key) ?? fallbackStorage.get(key) ?? null;
  } catch (error) {
    console.warn("El navegador bloqueo el almacenamiento local.", error);
    return fallbackStorage.get(key) ?? null;
  }
}

function writeStorage(storage, key, value) {
  fallbackStorage.set(key, value);
  try {
    storage.setItem(key, value);
  } catch (error) {
    console.warn("El navegador bloqueo el almacenamiento local. Se usara memoria temporal.", error);
  }
}

function removeStorage(storage, key) {
  fallbackStorage.delete(key);
  try {
    storage.removeItem(key);
  } catch (error) {
    console.warn("El navegador bloqueo el almacenamiento local.", error);
  }
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function ratingKey(candidateId, stationId) {
  return `${candidateId}:${stationId}`;
}

function currentStationId() {
  return stationSelect.value || stations[0].id;
}

function getSelectedCandidate() {
  return state.candidates.find((candidate) => candidate.id === selectedCandidateId);
}

function getRating(candidateId = selectedCandidateId, stationId = currentStationId()) {
  return state.ratings[ratingKey(candidateId, stationId)] || {};
}

function setRating(candidateId, stationId, rating) {
  const existing = getRating(candidateId, stationId);
  const baseRating = {
    ...rating,
    updatedAt: new Date().toISOString(),
  };

  if (isAdmin()) {
    state.ratings[ratingKey(candidateId, stationId)] = {
      ...baseRating,
      evaluator: existing.evaluator || null,
      evaluatedAt: existing.evaluatedAt || existing.updatedAt || null,
      adjustedBy: currentUser
        ? {
            username: currentUser.username,
            name: currentUser.name,
            role: currentUser.role,
          }
        : null,
      adjustedAt: new Date().toISOString(),
    };
    saveState();
    return;
  }

  state.ratings[ratingKey(candidateId, stationId)] = {
    ...baseRating,
    evaluator: currentUser
      ? {
          username: currentUser.username,
          name: currentUser.name,
          role: currentUser.role,
        }
      : null,
    evaluatedAt: existing.evaluatedAt || new Date().toISOString(),
    adjustedBy: null,
    adjustedAt: null,
  };
  saveState();
}

function calculateScore(rating) {
  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
  const weighted = criteria.reduce((sum, item) => {
    const value = Number(rating[item.id] || 0);
    return sum + (value / 5) * item.weight;
  }, 0);
  return totalWeight ? (weighted / totalWeight) * 100 : 0;
}

function candidateAverage(candidateId) {
  const scores = stations
    .map((station) => getRating(candidateId, station.id))
    .filter((rating) => criteria.some((item) => Number(rating[item.id]) > 0))
    .map(calculateScore);

  if (!scores.length) {
    return { average: 0, completed: 0 };
  }

  return {
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    completed: scores.length,
  };
}

function init() {
  bindAuthEvents();
  renderStations();
  renderOfficialTeamOptions();
  renderCriteria();
  renderRubric();
  thresholdInput.value = state.threshold;
  bindEvents();
  updateAuthView();
  connectSharedServer();
}

function bindAuthEvents() {
  $("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = $("#usernameInput").value.trim();
    const password = $("#passwordInput").value;
    const user = users.find((item) => item.username === username && item.password === password);

    if (!user) {
      $("#loginError").textContent = "Credenciales invalidas.";
      return;
    }

    $("#loginError").textContent = "";
    saveSession(user);
    updateAuthView();
  });

  $("#logoutBtn").addEventListener("click", () => {
    clearSession();
    updateAuthView();
  });
}

function bindEvents() {
  stationSelect.addEventListener("change", () => {
    $("#stationPill").textContent = stations.find((station) => station.id === currentStationId())?.name || "Estacion";
    renderCandidateList();
    renderScoreForm();
  });

  teamSelect.addEventListener("change", renderCandidateList);
  searchInput.addEventListener("input", renderCandidateList);

  $("#addCandidateBtn").addEventListener("click", addCandidate);
  $("#clearScoreBtn").addEventListener("click", clearCurrentRating);
  $("#submitScoreBtn").addEventListener("click", submitCurrentRating);
  $("#backToSearchBtn").addEventListener("click", () => switchView("captureView"));
  $("#exportCsvBtn").addEventListener("click", exportCsv);
  $("#exportJsonBtn").addEventListener("click", exportJson);
  $("#importCsvInput").addEventListener("change", importCsv);
  $("#messageForm").addEventListener("submit", sendMessage);

  thresholdInput.addEventListener("input", () => {
    state.threshold = Number(thresholdInput.value || 80);
    saveState();
    renderSummary();
  });

  notesInput.addEventListener("input", handleScoreDraftChange);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  $("#summaryTable").addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-detail-candidate]");
    if (!button || !isAdmin()) return;
    openEvaluationDetail(button.dataset.detailCandidate, button.dataset.detailStation);
  });

  $("#closeDetailBtn").addEventListener("click", closeEvaluationDetail);
  $("#detailModal").addEventListener("click", (event) => {
    if (event.target.id === "detailModal") {
      closeEvaluationDetail();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#detailModal").hidden) {
      closeEvaluationDetail();
    }
  });
}

function updateAuthView() {
  const authenticated = Boolean(currentUser);
  loginScreen.hidden = authenticated;
  appShell.hidden = !authenticated;

  if (!authenticated) {
    $("#passwordInput").value = "";
    $("#usernameInput").focus();
    return;
  }

  $("#userBadge").textContent = `${currentUser.name} | ${currentUser.role === "admin" ? "Administrador" : "Evaluador"}`;
  $("#captureTab").textContent = isAdmin() ? "Correcciones" : "Captura";
  $("#candidatePanelTitle").textContent = isAdmin() ? "Participantes" : "Candidatos";
  $("#clearScoreBtn").textContent = isAdmin() ? "Limpiar calificacion" : "Limpiar evaluacion";
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !isAdmin();
  });

  const activeAdminView = $(".tab.active")?.dataset.view === "summaryView";
  if (!isAdmin() && activeAdminView) {
    switchView("captureView");
  }

  renderAll();
  appShell.dataset.activeView = $(".view.active")?.id || "captureView";
}

function renderStations() {
  stationSelect.innerHTML = stations
    .map((station) => `<option value="${station.id}">${station.name}</option>`)
    .join("");
  $("#stationPill").textContent = stations[0].name;
}

function renderOfficialTeamOptions() {
  $("#newTeamInput").innerHTML = officialTeams
    .map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`)
    .join("");
}

function renderTeams() {
  const extraTeams = [...new Set(state.candidates.map((candidate) => candidate.team).filter(Boolean))]
    .filter((team) => !officialTeams.includes(team))
    .sort();
  const teams = officialTeams.concat(extraTeams);
  teamSelect.innerHTML = [`<option value="all">Todos los equipos</option>`]
    .concat(teams.map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`))
    .join("");
}

function renderCriteria() {
  criteriaFields.innerHTML = criteria
    .map(
      (item) => `
        <section class="criterion">
          <div class="criterion-header">
            <strong>${item.name}</strong>
            <small>${item.weight}%</small>
          </div>
          <div class="scale" role="radiogroup" aria-label="${item.name}">
            ${[1, 2, 3, 4, 5]
              .map(
                (value) => `
                  <label title="${scaleLabel(value)}">
                    <input type="radio" name="${item.id}" value="${value}" />
                    ${value}
                  </label>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");

  criteriaFields.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", handleScoreDraftChange);
  });
}

function renderRubric() {
  $("#rubricCards").innerHTML = criteria
    .map(
      (item) => `
        <article class="rubric-card">
          <h3>${item.name} (${item.weight}%)</h3>
          <p>${item.description}</p>
          <p><strong>Escala:</strong> 1 insuficiente, 2 bajo, 3 aceptable, 4 solido, 5 sobresaliente.</p>
        </article>
      `
    )
    .join("");
}

function renderAll() {
  renderTeams();
  renderCandidateList();
  renderScoreForm();
  renderStats();
  renderSummary();
  renderMessages();
}

function renderCandidateList() {
  const candidates = filteredCandidates();
  $("#candidateListMeta").textContent = `${candidates.length} participante(s) visibles. Usa Evaluar para abrir el formulario.`;
  candidateList.innerHTML = "";

  if (!candidates.length) {
    candidateList.innerHTML = `<div class="empty">No hay candidatos con ese filtro.</div>`;
    return;
  }

  candidates.forEach((candidate) => {
    const node = candidateTemplate.content.firstElementChild.cloneNode(true);
    const score = calculateScore(getRating(candidate.id, currentStationId()));
    node.classList.toggle("active", candidate.id === selectedCandidateId);
    node.querySelector(".avatar").textContent = initials(candidate.name);
    node.querySelector(".candidate-name").textContent = candidate.name;
    node.querySelector(".candidate-meta").textContent = [candidate.team, candidate.enrollment].filter(Boolean).join(" | ");
    node.querySelector(".candidate-score").textContent = score ? score.toFixed(0) : "S/C";
    const evaluateButton = node.querySelector(".evaluate-button");
    evaluateButton.textContent = isAdmin() ? "Corregir" : "Evaluar";
    evaluateButton.addEventListener("click", () => openCandidateEvaluation(candidate.id));
    candidateList.appendChild(node);
  });
}

function openCandidateEvaluation(candidateId) {
  selectedCandidateId = candidateId;
  renderCandidateList();
  renderScoreForm();
  switchView("evaluationView");
}

function filteredCandidates() {
  const team = teamSelect.value || "all";
  const query = searchInput.value.trim().toLowerCase();

  return state.candidates
    .filter((candidate) => team === "all" || candidate.team === team)
    .filter((candidate) => {
      const haystack = `${candidate.name} ${candidate.team} ${candidate.enrollment}`.toLowerCase();
      return !query || haystack.includes(query);
    })
    .sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
}

function renderScoreForm() {
  const candidate = getSelectedCandidate();
  const station = stations.find((item) => item.id === currentStationId());

  if (!candidate) {
    $("#scoreTitle").textContent = isAdmin() ? "Selecciona un participante para corregir" : "Selecciona un participante para evaluar";
    $("#scoreSubtitle").textContent = "Busca en la lista y pulsa el boton correspondiente para abrir este formulario.";
    scoreForm.setAttribute("aria-disabled", "true");
    setScoreFormLocked(true);
    $("#submitScoreBtn").hidden = true;
    $("#adminCorrectionNote").hidden = true;
    $("#lockedEvaluationNote").hidden = true;
    return;
  }

  scoreForm.removeAttribute("aria-disabled");
  $("#scoreTitle").textContent = candidate.name;
  $("#scoreSubtitle").textContent = `${candidate.team}${candidate.enrollment ? ` | ${candidate.enrollment}` : ""}`;
  $("#stationPill").textContent = station?.name || "Estacion";

  const rating = getRating();
  const locked = isEvaluationLocked(rating);
  $("#submitScoreBtn").hidden = isAdmin();
  setScoreFormLocked(locked);
  renderAdminCorrectionNote(rating);
  renderLockedEvaluationNote(rating);
  criteria.forEach((item) => {
    const value = String(rating[item.id] || "");
    document.querySelectorAll(`input[name="${item.id}"]`).forEach((input) => {
      input.checked = input.value === value;
    });
  });
  notesInput.value = rating.notes || "";
  updateStationScore();
}

function isEvaluationLocked(rating) {
  return !isAdmin() && criteria.some((item) => Number(rating[item.id]) > 0);
}

function setScoreFormLocked(locked) {
  scoreForm.querySelectorAll("input, textarea, button").forEach((element) => {
    element.disabled = locked;
  });
  scoreForm.classList.toggle("locked", locked);
}

function renderAdminCorrectionNote(rating) {
  const note = $("#adminCorrectionNote");
  if (!isAdmin()) {
    note.hidden = true;
    note.textContent = "";
    return;
  }

  const evaluator = rating.evaluator?.name || rating.evaluator?.username || "sin evaluador registrado";
  const evaluatedAt = rating.evaluatedAt || rating.updatedAt;
  const adjusted = rating.adjustedBy?.name || rating.adjustedBy?.username;
  const adjustedText = adjusted ? ` Ultimo ajuste: ${adjusted}${rating.adjustedAt ? `, ${formatDateTime(rating.adjustedAt)}` : ""}.` : "";
  note.hidden = false;
  note.textContent = `Modo correccion administrativa. Evaluador original: ${evaluator}${evaluatedAt ? `, ${formatDateTime(evaluatedAt)}` : ""}.${adjustedText}`;
}

function renderLockedEvaluationNote(rating) {
  const note = $("#lockedEvaluationNote");
  if (!isEvaluationLocked(rating)) {
    note.hidden = true;
    note.textContent = "";
    return;
  }

  const evaluator = rating.evaluator?.name || rating.evaluator?.username || "otro evaluador";
  const evaluatedAt = rating.evaluatedAt || rating.updatedAt;
  const score = calculateScore(rating).toFixed(2);
  note.hidden = false;
  note.textContent = `Esta evaluacion ya fue registrada por ${evaluator}${evaluatedAt ? ` el ${formatDateTime(evaluatedAt)}` : ""}. Calificacion: ${score}. Solo un administrador puede corregirla.`;
}

function handleScoreDraftChange() {
  updateStationScore();
  if (isAdmin()) {
    persistCurrentRating();
  }
}

async function submitCurrentRating() {
  const candidate = getSelectedCandidate();
  if (!candidate || isAdmin()) return;
  if (isEvaluationLocked(getRating(candidate.id, currentStationId()))) return;

  const rating = getCurrentRatingFromForm();
  const complete = criteria.every((item) => Number(rating[item.id]) > 0);
  if (!complete) {
    alert("Selecciona una calificacion del 1 al 5 en todos los criterios antes de enviar.");
    return;
  }

  setRating(candidate.id, currentStationId(), rating);
  await sendSharedStateNow();
  renderAll();
  alert("Calificacion enviada.");
}

function getCurrentRatingFromForm() {
  const rating = { notes: notesInput.value.trim() };
  criteria.forEach((item) => {
    const selected = document.querySelector(`input[name="${item.id}"]:checked`);
    rating[item.id] = selected ? Number(selected.value) : 0;
  });
  return rating;
}

function persistCurrentRating() {
  const candidate = getSelectedCandidate();
  if (!candidate) return;
  if (isEvaluationLocked(getRating(candidate.id, currentStationId()))) return;

  setRating(candidate.id, currentStationId(), getCurrentRatingFromForm());
  updateStationScore();
  renderCandidateList();
  renderStats();
  renderSummary();
}

function updateStationScore() {
  const rating = {};
  criteria.forEach((item) => {
    const selected = document.querySelector(`input[name="${item.id}"]:checked`);
    rating[item.id] = selected ? Number(selected.value) : 0;
  });
  $("#stationScore").textContent = calculateScore(rating).toFixed(2);
}

function clearCurrentRating() {
  const candidate = getSelectedCandidate();
  if (!candidate) return;
  if (isEvaluationLocked(getRating(candidate.id, currentStationId()))) return;
  if (isAdmin()) {
    const existing = getRating(candidate.id, currentStationId());
    state.ratings[ratingKey(candidate.id, currentStationId())] = {
      notes: "",
      ...criteria.reduce((rating, item) => {
        rating[item.id] = 0;
        return rating;
      }, {}),
      evaluator: existing.evaluator || null,
      evaluatedAt: existing.evaluatedAt || existing.updatedAt || null,
      adjustedBy: currentUser
        ? {
            username: currentUser.username,
            name: currentUser.name,
            role: currentUser.role,
          }
        : null,
      adjustedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    delete state.ratings[ratingKey(candidate.id, currentStationId())];
  }
  saveState();
  renderAll();
}

function addCandidate() {
  if (!isAdmin()) return;
  const team = $("#newTeamInput").value.trim();
  const name = $("#newNameInput").value.trim();
  if (!team || !name) return;

  const candidate = {
    id: uid(),
    name,
    team,
    enrollment: "",
  };
  state.candidates.push(candidate);
  selectedCandidateId = candidate.id;
  $("#newTeamInput").value = "";
  $("#newNameInput").value = "";
  saveState();
  renderAll();
}

function renderStats() {
  const teams = new Set(state.candidates.map((candidate) => candidate.team));
  const ratingCount = Object.values(state.ratings).filter((rating) =>
    criteria.some((item) => Number(rating[item.id]) > 0)
  ).length;
  const possible = state.candidates.length * stations.length;
  $("#candidateCount").textContent = state.candidates.length;
  $("#teamCount").textContent = teams.size;
  $("#ratingCount").textContent = ratingCount;
  $("#completionRate").textContent = possible ? `${Math.round((ratingCount / possible) * 100)}%` : "0%";
}

function sendMessage(event) {
  event.preventDefault();
  if (!currentUser || isAdmin()) return;

  const subject = $("#messageSubjectInput").value.trim();
  const body = $("#messageBodyInput").value.trim();
  if (!subject || !body) return;

  state.messages.unshift({
    id: uid(),
    subject,
    body,
    sender: {
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
    },
    createdAt: new Date().toISOString(),
    status: "open",
    replies: [],
  });

  $("#messageSubjectInput").value = "";
  $("#messageBodyInput").value = "";
  saveState();
  renderMessages();
}

function renderMessages() {
  const list = $("#messageList");
  if (!list || !currentUser) return;

  $("#messagesTitle").textContent = isAdmin() ? "Mensajes de evaluadores" : "Contactar administradores";
  $("#messagesSubtitle").textContent = isAdmin()
    ? "Lee reportes, dudas y fallas enviadas por evaluadores."
    : "Envia un reporte y revisa aqui las respuestas administrativas.";
  $("#messageForm").hidden = isAdmin();

  const messages = isAdmin()
    ? state.messages
    : state.messages.filter((message) => message.sender?.username === currentUser.username);

  if (!messages.length) {
    list.innerHTML = `<div class="empty">${isAdmin() ? "Aun no hay mensajes de evaluadores." : "Aun no has enviado mensajes."}</div>`;
    return;
  }

  list.innerHTML = messages.map(renderMessageCard).join("");
  if (isAdmin()) {
    list.querySelectorAll("[data-reply-message]").forEach((button) => {
      button.addEventListener("click", () => replyToMessage(button.dataset.replyMessage));
    });
  }
}

function renderMessageCard(message) {
  const replies = message.replies || [];
  return `
    <article class="message-card">
      <div class="message-heading">
        <div>
          <h3>${escapeHtml(message.subject)}</h3>
          <p class="subtle">${escapeHtml(message.sender?.name || message.sender?.username || "Evaluador")} | ${formatDateTime(message.createdAt)}</p>
        </div>
        <span class="status ${replies.length ? "pass" : "review"}">${replies.length ? "Respondido" : "Pendiente"}</span>
      </div>
      <p class="message-body">${escapeHtml(message.body)}</p>
      <div class="reply-list">
        ${replies
          .map(
            (reply) => `
              <div class="reply-card">
                <strong>${escapeHtml(reply.sender?.name || "Administrador")}</strong>
                <small>${formatDateTime(reply.createdAt)}</small>
                <p>${escapeHtml(reply.body)}</p>
              </div>
            `
          )
          .join("")}
      </div>
      ${
        isAdmin()
          ? `
            <div class="reply-box">
              <textarea data-reply-body="${escapeHtml(message.id)}" rows="3" placeholder="Escribe una respuesta para el evaluador."></textarea>
              <button class="button primary" type="button" data-reply-message="${escapeHtml(message.id)}">Responder</button>
            </div>
          `
          : ""
      }
    </article>
  `;
}

function replyToMessage(messageId) {
  if (!isAdmin()) return;
  const message = state.messages.find((item) => item.id === messageId);
  const textarea = document.querySelector(`[data-reply-body="${CSS.escape(messageId)}"]`);
  const body = textarea?.value.trim();
  if (!message || !body) return;

  message.replies = message.replies || [];
  message.replies.push({
    id: uid(),
    body,
    sender: {
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
    },
    createdAt: new Date().toISOString(),
  });
  message.status = "answered";
  message.updatedAt = new Date().toISOString();
  saveState();
  renderMessages();
}

function renderSummary() {
  if (!isAdmin()) return;
  const threshold = Number(thresholdInput.value || state.threshold || 80);
  const rows = state.candidates
    .map((candidate) => ({ candidate, ...candidateAverage(candidate.id) }))
    .sort((a, b) => b.average - a.average || b.completed - a.completed);

  $("#summaryTable").innerHTML = rows
    .map((row, index) => {
      const pass = row.completed > 0 && row.average >= threshold;
      const status = pass ? "Apto" : "Revision";
      return `
        <tr>
          <td data-label="#">${index + 1}</td>
          <td data-label="Candidato">${escapeHtml(row.candidate.name)}</td>
          <td data-label="Equipo">${escapeHtml(row.candidate.team)}</td>
          <td data-label="Promedio">${row.completed ? row.average.toFixed(2) : "S/C"}</td>
          <td data-label="Estaciones">${row.completed}/${stations.length}</td>
          <td data-label="Detalle por estacion">${stationBreakdown(row.candidate.id)}</td>
          <td data-label="Estatus"><span class="status ${pass ? "pass" : "review"}">${status}</span></td>
        </tr>
      `;
    })
    .join("");
}

function stationBreakdown(candidateId) {
  return `
    <div class="station-breakdown">
      ${stations
        .map((station, index) => {
          const rating = getRating(candidateId, station.id);
          const hasScore = criteria.some((item) => Number(rating[item.id]) > 0);
          const score = hasScore ? calculateScore(rating).toFixed(0) : "S/C";
          const evaluator = rating.evaluator?.name || rating.evaluator?.username || "Sin registro";
          const adjustedBy = rating.adjustedBy?.name || rating.adjustedBy?.username || "";
          const updated = rating.adjustedAt || rating.updatedAt ? formatDateTime(rating.adjustedAt || rating.updatedAt) : "";
          const auditLabel = adjustedBy ? `${evaluator} / Ajuste: ${adjustedBy}` : evaluator;
          return `
            <button class="station-chip ${hasScore ? "" : "empty-score"}" type="button" data-detail-candidate="${escapeHtml(candidateId)}" data-detail-station="${escapeHtml(station.id)}" title="${escapeHtml(station.name)} | Evaluo: ${escapeHtml(evaluator)}${adjustedBy ? ` | Ajusto: ${escapeHtml(adjustedBy)}` : ""}${updated ? ` | ${escapeHtml(updated)}` : ""}">
              <strong>E${index + 1}: ${score}</strong>
              <small>${hasScore ? escapeHtml(auditLabel) : adjustedBy ? `Ajuste: ${escapeHtml(adjustedBy)}` : "Pendiente"}</small>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function openEvaluationDetail(candidateId, stationId) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  const station = stations.find((item) => item.id === stationId);
  if (!candidate || !station || !isAdmin()) return;

  const rating = getRating(candidateId, stationId);
  const hasScore = criteria.some((item) => Number(rating[item.id]) > 0);
  const score = hasScore ? calculateScore(rating).toFixed(2) : "Sin calificacion";
  const evaluator = rating.evaluator?.name || rating.evaluator?.username || "Sin registro";
  const adjustedBy = rating.adjustedBy?.name || rating.adjustedBy?.username || "";

  $("#detailMeta").textContent = `${station.name} | ${candidate.team}`;
  $("#detailTitle").textContent = candidate.name;
  $("#detailBody").innerHTML = `
    <div class="detail-summary">
      <div class="detail-stat">
        <span>Calificacion</span>
        <strong>${score}</strong>
      </div>
      <div class="detail-stat">
        <span>Evaluador</span>
        <strong>${escapeHtml(evaluator)}</strong>
      </div>
      <div class="detail-stat">
        <span>Fecha evaluacion</span>
        <strong>${rating.evaluatedAt || rating.updatedAt ? escapeHtml(formatDateTime(rating.evaluatedAt || rating.updatedAt)) : "Sin registro"}</strong>
      </div>
      <div class="detail-stat">
        <span>Ajuste admin</span>
        <strong>${adjustedBy ? escapeHtml(adjustedBy) : "Sin ajuste"}</strong>
      </div>
    </div>
    <section class="detail-section">
      <h3>Calificacion por criterio</h3>
      <div class="detail-criteria">
        ${criteria
          .map((item) => {
            const value = Number(rating[item.id] || 0);
            const percent = value ? Math.round((value / 5) * 100) : 0;
            return `
              <div class="criterion-detail">
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <small>${item.weight}% del total</small>
                </div>
                <span>${value || "S/C"}/5</span>
                <div class="criterion-bar" aria-hidden="true"><i style="width: ${percent}%"></i></div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
    <section class="detail-section">
      <h3>Comentarios del evaluador</h3>
      <p class="feedback-text">${rating.notes ? escapeHtml(rating.notes) : "No hay comentarios registrados para esta estacion."}</p>
    </section>
    ${
      adjustedBy
        ? `
          <section class="detail-section audit-note">
            <h3>Correccion administrativa</h3>
            <p>${escapeHtml(adjustedBy)} ajusto esta evaluacion${rating.adjustedAt ? ` el ${escapeHtml(formatDateTime(rating.adjustedAt))}` : ""}.</p>
          </section>
        `
        : ""
    }
  `;
  $("#detailModal").hidden = false;
}

function closeEvaluationDetail() {
  $("#detailModal").hidden = true;
}

function switchView(viewId) {
  if (viewId === "summaryView" && !isAdmin()) {
    viewId = "captureView";
  }
  document.querySelectorAll(".tab").forEach((tab) => {
    const activeView = viewId === "evaluationView" ? "captureView" : viewId;
    tab.classList.toggle("active", tab.dataset.view === activeView);
  });
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  appShell.dataset.activeView = viewId;
  if (viewId === "summaryView") renderSummary();
}

function importCsv(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(String(reader.result || ""));
    const imported = rows
      .map((row, index) => ({
        id: uid(),
        team: row.equipo || row.team || officialTeams[index % officialTeams.length],
        name: row.nombre || row.name || "",
        enrollment: row.matricula || row.id || row.clave || "",
      }))
      .filter((candidate) => candidate.name.trim());

    if (imported.length) {
      state.candidates = imported;
      state.ratings = {};
      selectedCandidateId = imported[0].id;
      saveState();
      renderAll();
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = (values[index] || "").trim();
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  const result = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  result.push(value);
  return result;
}

function exportCsv() {
  if (!isAdmin()) return;
  const header = [
    "equipo",
    "nombre",
    "matricula",
    "estacion",
    "evaluador",
    "usuario_evaluador",
    "ajustado_por",
    "usuario_ajuste",
    ...criteria.map((item) => item.id),
    "calificacion",
    "observaciones",
    "actualizado",
    "fecha_ajuste",
  ];

  const rows = [];
  state.candidates.forEach((candidate) => {
    stations.forEach((station) => {
      const rating = getRating(candidate.id, station.id);
      const hasAuditTrail = rating.evaluator || rating.adjustedBy || rating.evaluatedAt || rating.adjustedAt;
      if (!criteria.some((item) => Number(rating[item.id]) > 0) && !rating.notes && !hasAuditTrail) return;
      rows.push([
        candidate.team,
        candidate.name,
        candidate.enrollment,
        station.name,
        rating.evaluator?.name || "",
        rating.evaluator?.username || "",
        rating.adjustedBy?.name || "",
        rating.adjustedBy?.username || "",
        ...criteria.map((item) => rating[item.id] || ""),
        calculateScore(rating).toFixed(2),
        rating.notes || "",
        rating.updatedAt || "",
        rating.adjustedAt || "",
      ]);
    });
  });

  downloadFile("evaluaciones-capitanes.csv", [header, ...rows].map(csvRow).join("\n"), "text/csv");
}

function exportJson() {
  if (!isAdmin()) return;
  downloadFile("respaldo-evaluaciones-capitanes.json", JSON.stringify(state, null, 2), "application/json");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvRow(values) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
    .join(",");
}

async function connectSharedServer() {
  try {
    const payload = await fetchJson("/api/state");
    sharedApi.enabled = true;
    sharedApi.updatedAt = payload.updatedAt || "";

    if (payload.state?.candidates?.length) {
      applyRemoteState(payload.state);
    } else {
      await sendSharedStateNow();
    }

    window.setInterval(syncSharedState, 2000);
  } catch (error) {
    sharedApi.enabled = false;
  }
}

async function syncSharedState() {
  if (!sharedApi.enabled || !currentUser) return;

  try {
    const payload = await fetchJson("/api/state");
    if (!payload.state?.candidates?.length) return;
    if (payload.updatedAt && payload.updatedAt !== sharedApi.updatedAt) {
      sharedApi.updatedAt = payload.updatedAt;
      applyRemoteState(payload.state);
    }
  } catch (error) {
    sharedApi.enabled = false;
  }
}

function applyRemoteState(remoteState) {
  applyingRemoteState = true;
  state = {
    candidates: remoteState.candidates || defaultCandidates,
    ratings: remoteState.ratings || {},
    messages: remoteState.messages || [],
    threshold: remoteState.threshold || 80,
  };
  saveState();
  applyingRemoteState = false;
  thresholdInput.value = state.threshold;
  renderAll();
}

function queueSharedStateSave() {
  if (!sharedApi.enabled) return;
  window.clearTimeout(pendingSharedSave);
  pendingSharedSave = window.setTimeout(sendSharedStateNow, 300);
}

async function sendSharedStateNow() {
  if (!sharedApi.enabled) return;

  try {
    const payload = await fetchJson("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    sharedApi.updatedAt = payload.updatedAt || sharedApi.updatedAt;
  } catch (error) {
    sharedApi.enabled = false;
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function createSimulatedRatings(candidates) {
  const notes = [
    "Comunica instrucciones con claridad y ayuda a ordenar la participacion del equipo.",
    "Muestra iniciativa, aunque necesita escuchar mas antes de decidir.",
    "Integra al equipo y reparte tareas con buen criterio durante la dinamica.",
    "Resuelve el reto con calma, pero puede mejorar el seguimiento de acuerdos.",
    "Se mantiene respetuoso y cuida las reglas, con participacion constante.",
    "Asume liderazgo cuando el grupo se bloquea y propone una ruta concreta.",
    "Aporta ideas utiles, aunque requiere mayor seguridad al defenderlas.",
    "Facilita la colaboracion y reconoce aportaciones de otros integrantes.",
  ];
  const ratings = {};

  candidates.forEach((candidate, candidateIndex) => {
    if (candidateIndex >= Math.ceil(candidates.length / 2)) {
      return;
    }
    const profile = 3 + ((candidateIndex * 7) % 3);
    stations.forEach((station, stationIndex) => {
      const rating = { notes: notes[(candidateIndex + stationIndex) % notes.length] };
      criteria.forEach((item, criterionIndex) => {
        const variation = ((candidateIndex + stationIndex + criterionIndex) % 3) - 1;
        rating[item.id] = clampScore(profile + variation);
      });

      const date = new Date(2026, 4, 5, 9 + Math.floor(stationIndex / 2), (stationIndex * 7 + candidateIndex) % 60);
      ratings[ratingKey(candidate.id, station.id)] = {
        ...rating,
        evaluator: publicUser(evaluatorUsers[(stationIndex + candidateIndex) % evaluatorUsers.length]),
        evaluatedAt: date.toISOString(),
        updatedAt: date.toISOString(),
        adjustedBy: null,
        adjustedAt: null,
      };
    });
  });

  return ratings;
}

function publicUser(user) {
  return {
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

function clampScore(value) {
  return Math.max(1, Math.min(5, value));
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function scaleLabel(value) {
  return {
    1: "Insuficiente",
    2: "Bajo",
    3: "Aceptable",
    4: "Solido",
    5: "Sobresaliente",
  }[value];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function uid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

init();
