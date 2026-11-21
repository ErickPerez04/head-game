// ==========================================
// 1. CONFIGURACIÓN (EDITA ESTA SECCIÓN)
// ==========================================

// Firebase Realtime Database
const _0x4c1b = [
    "fSJiNjgxNGIwNjNlYmJmNTVlNzlkOTlhOmJldzoyNjc5NTAyMDE3Mzc6MSI6ImRJcHBhIiwiMjY3OTUwMjAxNzM3IjoiZElyZWRuZVNnbmlnYXNzZW0iLCJwcGEuZWdhcm90c2VzYWJlcmlmLjgzNzZhLXpuYWJkZWgiOiJ0ZWtjdUJlZ2Fyb3RzIiwiODM3NmEtem5hYmRlaCI6ImRJdGNlam9ycCIsIm1vYy5vaWVzYWJlcmlmLmJkdHItdGx1YWZlZC04Mzc2YS16bmFiZGVoLy86c3B0dGgiOiJMUlVlc2FiYXRhZCIsIm1vYy5wcGFlc2FiZXJpZi44Mzc2YS16bmFiZGVoIjoibmlhbW9EaHR1YSIsInNneFUxNkNXSFRFSmozWkFwbnVqZ2dOejVpNVNPOXJlRHlTYXpJQSI6InllS2lwYSJ7",
    "atob", "split", "reverse", "join", "parse"
];

const firebaseConfig = JSON[_0x4c1b[5]](
    window[_0x4c1b[1]](_0x4c1b[0])[_0x4c1b[2]]("")[_0x4c1b[3]]()[_0x4c1b[4]]("")
);



// Lista exacta de archivos dentro de tu carpeta raíz /img/
// Agrega tantos como jugadores máximos esperes tener
async function getAvailableImages() {
    try {
        const response = await fetch(`imagenes.json?v=${Date.now()}`);
        if (!response.ok) throw new Error("No se pudo cargar imagenes.json");
        return await response.json();
    } catch (error) {
        console.error(error);
        alert("Error al obtener la lista de imágenes. Asegúrate de que imagenes.json exista en el repositorio.");
        return [];
    }
}

// ==========================================
// 2. INICIALIZACIÓN Y SEGURIDAD OFUSCADA
// ==========================================
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Con (Base64 invertido + desplazamiento)
const _0x9f2a = ["NjU3NDgzOTIwMW5pbWRh", "split", "reverse", "join", "atob"];
function verifyAdminKey(input) {
    const decoded = window[_0x9f2a[4]](_0x9f2a[0])[_0x9f2a[1]]("")[_0x9f2a[2]]()[_0x9f2a[3]]("");
    return input === decoded;
}

let currentUser = {
    id: null,
    name: "",
    isAdmin: false
};

// Referencias del DOM
const views = {
    login: document.getElementById("view-login"),
    lobby: document.getElementById("view-lobby"),
    game: document.getElementById("view-game")
};

function showView(viewName) {
    Object.values(views).forEach(v => v.classList.remove("active"));
    views[viewName].classList.add("active");
}

// ==========================================
// 3. LÓGICA DE ACCESO (PANTALLA 1)
// ==========================================
document.getElementById("btn-enter").addEventListener("click", () => {
    const nameInput = document.getElementById("player-name").value.trim();
    const passInput = document.getElementById("admin-pass").value;
    const errorEl = document.getElementById("login-error");

    if (!nameInput) {
        errorEl.textContent = "Por favor, ingresa tu nombre de jugador.";
        return;
    }

    let isAdmin = false;
    if (passInput.length > 0) {
        if (verifyAdminKey(passInput)) {
            isAdmin = true;
        } else {
            errorEl.textContent = "Contraseña de administrador incorrecta.";
            return;
        }
    }

    errorEl.textContent = "";
    joinLobby(nameInput, isAdmin);
});

function joinLobby(name, isAdmin) {
    const playerRef = db.ref("session/players").push();
    currentUser = {
        id: playerRef.key,
        name: name,
        isAdmin: isAdmin
    };

    // Si el jugador cierra la pestaña, se elimina automáticamente de la lista
    playerRef.onDisconnect().remove();

    playerRef.set({
        name: name,
        isAdmin: isAdmin
    }).then(() => {
        if (isAdmin) {
            document.getElementById("admin-lobby-controls").classList.remove("hidden");
            document.getElementById("admin-game-controls").classList.remove("hidden");
        } else {
            document.getElementById("admin-lobby-controls").classList.add("hidden");
            document.getElementById("admin-game-controls").classList.add("hidden");
        }
        listenToSession();
        showView("lobby");
    });
}

// ==========================================
// 4. SINCRONIZACIÓN EN TIEMPO REAL
// ==========================================
function listenToSession() {
    // Escuchar lista de jugadores en el lobby
    db.ref("session/players").on("value", (snapshot) => {
        const players = snapshot.val() || {};
        const listEl = document.getElementById("players-list");
        const countEl = document.getElementById("player-count");

        listEl.innerHTML = "";
        const entries = Object.entries(players);
        countEl.textContent = entries.length;

        // Si el usuario actual fue expulsado o cancelaron la partida
        if (currentUser.id && !players[currentUser.id]) {
            resetToLogin();
            return;
        }

        entries.forEach(([id, data]) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${escapeHtml(data.name)}</span>
                ${data.isAdmin ? '<span class="badge-admin">ADMIN</span>' : ''}
            `;
            listEl.appendChild(li);
        });
    });

    // Escuchar estado de la partida (lobby / playing / kicked)
    db.ref("session/state").on("value", (snapshot) => {
        const state = snapshot.val();

        if (state === "playing") {
            db.ref(`session/assignments/${currentUser.id}`).once("value").then((imgSnap) => {
                const imgFile = imgSnap.val();
                if (imgFile) {
                    document.getElementById("assigned-image").src = `img/${imgFile}`;
                    showView("game");
                }
            });
        } else if (state === "lobby") {
            showView("lobby");
        } else if (state === "kicked") {
            resetToLogin();
        }
    });

    // Escuchar cambios de ronda (para actualizar imagen sin salir de pantalla completa)
    db.ref("session/round").on("value", () => {
        if (views.game.classList.contains("active") && currentUser.id) {
            db.ref(`session/assignments/${currentUser.id}`).once("value").then((imgSnap) => {
                const imgFile = imgSnap.val();
                if (imgFile) {
                    document.getElementById("assigned-image").src = `img/${imgFile}`;
                }
            });
        }
    });
}

// ==========================================
// 5. ACCIONES DEL ADMINISTRADOR
// ==========================================

// Repartir imágenes sin repetir leyendo el JSON automático
async function assignUniqueImagesAndStart() {
    const availableImages = await getAvailableImages();
    if (availableImages.length === 0) return;

    const snapshot = await db.ref("session/players").once("value");
    const players = snapshot.val() || {};
    const playerIds = Object.keys(players);

    if (playerIds.length > availableImages.length) {
        alert(`Hay ${playerIds.length} jugadores, pero solo hay ${availableImages.length} imágenes en la carpeta img/.`);
        return;
    }

    // Mezclar copia del arreglo de imágenes (Algoritmo Fisher-Yates)
    const shuffled = [...availableImages];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Asignar una imagen única a cada jugador conectado
    const assignments = {};
    playerIds.forEach((id, index) => {
        assignments[id] = shuffled[index];
    });

    db.ref("session").update({
        assignments: assignments,
        state: "playing",
        round: Date.now()
    });
}

// Botón Lobby: Iniciar Partida
document.getElementById("btn-start-game").addEventListener("click", assignUniqueImagesAndStart);

// Botón Juego: Empezar otra ronda (Verde)
document.getElementById("btn-next-round").addEventListener("click", assignUniqueImagesAndStart);

// Botón Lobby: Cancelar Partida -> Manda a todos al menú de nombre
document.getElementById("btn-cancel-game").addEventListener("click", kickAllPlayers);

// Botón Juego: Concluir sesión -> Saca a todos del juego
document.getElementById("btn-end-session").addEventListener("click", kickAllPlayers);

function kickAllPlayers() {
    db.ref("session").set({
        state: "kicked",
        players: null,
        assignments: null
    }).then(() => {
        // Limpia el estado para futuros ingresos
        setTimeout(() => db.ref("session/state").set("lobby"), 1000);
    });
}

function resetToLogin() {
    db.ref("session/players").off();
    db.ref("session/state").off();
    db.ref("session/round").off();
    currentUser = { id: null, name: "", isAdmin: false };
    document.getElementById("player-name").value = "";
    document.getElementById("admin-pass").value = "";
    document.getElementById("assigned-image").src = "";
    showView("login");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
