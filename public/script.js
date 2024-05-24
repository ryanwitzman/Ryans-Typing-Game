import { handleLoginSuccess, handleRegisterSuccess, saveState, updateLeaderboard } from './utils.js';
import { setupEventHandlers } from './eventHandlers.js';
import { setupSocketEvents, initializeSocket } from './socketEvents.js';

let socket;
let currentLobbyId = localStorage.getItem("currentLobbyId");
const token = localStorage.getItem("token");

let gameStarted = false;

if (token) {
  socket = initializeSocket(token);

  socket.on("connect", () => {
    if (window.location.href.includes("game.html") && !gameStarted) {
      const lobbyId = new URLSearchParams(window.location.search).get("lobbyId");
      gameStarted = true;

      setTimeout(() => {
        socket.emit("startGame", lobbyId);
      }, 50);
    }
  });

  setupSocketEvents(socket, currentLobbyId, (newLobbyId) => {
    currentLobbyId = newLobbyId;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupEventHandlers(socket, currentLobbyId);
});
