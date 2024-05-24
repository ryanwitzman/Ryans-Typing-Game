import { saveState, updateLeaderboard } from './utils.js';

export function initializeSocket(token) {
  return io({ auth: { token } });
}

export function setupSocketEvents(socket, currentLobbyId, setCurrentLobbyId) {
  socket.on("connect_error", (err) => {
    if (err.message === "invalid token") {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    }
  });

  socket.on("lobbyMessageHistory", (messages) => {
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = "";
    messages.forEach((message) => {
      const chatItem = document.createElement("li");
      chatItem.textContent = `${message.username}: ${message.message}`;
      chatMessages.appendChild(chatItem);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  socket.on("loginSuccess", (token) => handleLoginSuccess(token));
  socket.on("registerSuccess", (token) => handleRegisterSuccess(token));

  socket.on("lobbyCreated", (lobbyId) => {
    setCurrentLobbyId(lobbyId);
    saveState();
    window.location.href = "lobby_container.html?lobbyId=" + lobbyId;
  });

  socket.on("lobbyJoined", (lobbyId) => {
    setCurrentLobbyId(lobbyId);
    saveState();
  });

  socket.on("playerJoined", (data) => {
    const playerList = document.getElementById("lobby-players");
    const playerItem = document.createElement("div");
    playerItem.textContent = data.username;
    playerItem.id = `player-${data.id}`;
    playerList.appendChild(playerItem);
  });

  socket.on("playerLeft", (data) => {
    const playerItem = document.getElementById(`player-${data.id}`);
    if (playerItem) playerItem.remove();
  });

  socket.on("gameStarted", (data) => {
    const lobbyId = data.lobbyId;
    window.location.href = "game.html?lobbyId=" + data.lobbyId;
    document.getElementById("game-text").textContent = data.text;
  });

  socket.on("playerFinished", (results) => {
    updateLeaderboard(results);
    window.location.href = "leaderboard.html";
  });

  socket.on("opponentFinished", (results) => updateLeaderboard(results));

  socket.on("messageReceived", (message) => {
    const chatMessages = document.getElementById("chat-messages");
    const chatItem = document.createElement("li");
    chatItem.textContent = `${message.username}: ${message.message}`;
    chatMessages.appendChild(chatItem);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  socket.on("publicLobbiesUpdated", (publicLobbies) => {
    const publicLobbiesList = document.getElementById("public-lobbies-list");
    publicLobbiesList.innerHTML = "";
    publicLobbies.forEach((lobby) => {
      const lobbyItem = document.createElement("li");
      lobbyItem.textContent = `Lobby ID: ${lobby.id}, Host: ${lobby.host}`;
      publicLobbiesList.appendChild(lobbyItem);
    });
  });
}
