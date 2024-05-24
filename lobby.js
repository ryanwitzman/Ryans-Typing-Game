const lobbies = {};
const hostToLobbyMap = {};

function createLobby(username, isPublic) {
  // Check if the user is already hosting a lobby
  if (hostToLobbyMap[username]) {
    // Get the old lobby ID
    const oldLobbyId = hostToLobbyMap[username];
    // Delete the old lobby
    delete lobbies[oldLobbyId];
    // Remove the old lobby from the hostToLobbyMap
    delete hostToLobbyMap[username];
  }

  // Generate a new lobby ID and create the new lobby
  const lobbyId = generateLobbyId();
  lobbies[lobbyId] = {
    players: [],
    gameStarted: false,
    currentImageUrl: "",
    results: [],
    isPublic: isPublic,
    host: username,
    chat: [],
  };

  // Map the host to the new lobby ID
  hostToLobbyMap[username] = lobbyId;
  return lobbyId;
}

function joinLobby(socketId, username, lobbyId) {
  const lobby = lobbies[lobbyId];
  
  if (lobby) {
    const existingPlayer = lobby.players.find(
      (player) => player.id === socketId,
    );
    if (!existingPlayer) {
      lobby.players.push({ id: socketId, username });
      console.log(
        `Player ${username} with socket ID ${socketId} joined lobby ${lobbyId}`,
      );
      console.log("Current players in lobby:", lobby.players);
    }
    return lobbyId;
  } else {
    throw new Error("Lobby does not exist.");
  }
}

function generateLobbyId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // Ensure the generated ID is unique
  if (lobbies[id]) {
    return generateLobbyId();
  }
  return id;
}

function generatePlayerId() {
  return "player_" + Math.random().toString(36).substr(2, 9);
}

function addMessageToChat(lobbyId, username, message) {
  if (lobbies[lobbyId]) {
    const chatMessage = { username, message, timestamp: new Date() };
    lobbies[lobbyId].chat.push(chatMessage);
    return chatMessage;
  } else {
    throw new Error("Lobby does not exist.");
  }
}

function getPublicLobbies() {
  return Object.entries(lobbies)
    .filter(([lobbyId, lobby]) => lobby.isPublic)
    .map(([lobbyId, lobby]) => ({
      id: lobbyId,
      host: lobby.host,
    }))
    .sort(() => Math.random() - 0.5);
}

function getLobbyIdByUsername(username) {
  console.log(hostToLobbyMap)
  return hostToLobbyMap[username];
}

function getLobbyMessageHistory(lobbyId) {
  return lobbies[lobbyId].chat;
}

module.exports = {
  createLobby,
  joinLobby,
  lobbies,
  hostToLobbyMap,
  addMessageToChat,
  getPublicLobbies,
  getLobbyIdByUsername,
  getLobbyMessageHistory,
  hostToLobbyMap
};
