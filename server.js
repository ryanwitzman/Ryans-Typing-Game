const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const Database = require("@replit/database");
let hostToLobbyMap = {};
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json()); // for parsing application/json
app.use(express.static("public"));
app.use(cookieParser());

const db = new Database();
const userModule = require("./user")(db);
const lobbyModule = require("./lobby");
const gameModule = require("./game");

const lobbyTimeouts = {};

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await userModule.login(username, password);
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await userModule.register(username, password);
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  console.log(token);
  try {
    const username = jwt.verify(token, process.env.JWT_SECRET).username;

    if (username) {
      const lobbyId = lobbyModule.getLobbyIdByUsername(username);
      if (lobbyId) {
        clearTimeout(lobbyTimeouts[lobbyId]);
        delete lobbyTimeouts[lobbyId];
        socket.join(lobbyId);
        socket.emit("reconnectSuccess", {
          lobbyId,
          lobby: lobbyModule.lobbies[lobbyId],
        });
      }
    } else {
      console.log("User is not authenticated.");
    }

    socket.on("login", async ({ username, password }) => {
      try {
        const token = await userModule.login(username, password);
        socket.emit("loginSuccess", { token });
        socket.username = username;
      } catch (err) {
        socket.emit("loginError", err.message);
      }
    });

    socket.on("register", async ({ username, password }) => {
      try {
        const token = await userModule.register(username, password);
        socket.emit("registerSuccess", { token });
      } catch (err) {
        socket.emit("registerError", err.message);
      }
    });

    socket.on("createLobby", ({ isPublic }) => {
      try {
        const lobbyId = lobbyModule.createLobby(username, isPublic);
        socket.join(lobbyId);
        io.to(lobbyId).emit("lobbyCreated", lobbyId);
        hostToLobbyMap[username] = lobbyId;

        if (isPublic)
          io.emit("publicLobbiesUpdated", lobbyModule.getPublicLobbies());
      } catch (err) {
        socket.emit("createLobbyError", err.message);
      }
    });

    socket.on("joinLobby", (lobbyId) => {
      try {
        const lobbyMessageHistory = lobbyModule.getLobbyMessageHistory(lobbyId);
        console.log("Emitting lobbyMessageHistory", lobbyMessageHistory); // Add this line for debugging
        socket.emit("lobbyMessageHistory", lobbyMessageHistory);
        clearTimeout(lobbyTimeouts[lobbyId]);
        delete lobbyTimeouts[lobbyId];
        lobbyModule.joinLobby(socket.id, username, lobbyId);
        socket.join(lobbyId);
        io.to(lobbyId).emit("playerJoined", { id: socket.id, username });
        socket.emit("lobbyJoined", lobbyId);
      } catch (err) {
        socket.emit("joinLobbyError", err.message);
      }
    });

    socket.on("startGame", async (lobbyId) => {
      if (lobbyModule.lobbies[lobbyId].host === username) {
        lobbyModule.lobbies[lobbyId].gameStarted = true;
        try {
          const text = await getRandomTextFromFile("books.txt");
          lobbyModule.lobbies[lobbyId].originalText = text;
          io.to(lobbyId).emit("gameStarted", { text, lobbyId });
        } catch (err) {
          console.error("Error generating text:", err);
        }
      } else {
        socket.emit("startGameError", "Only the host can start the game.");
      }
    });

    socket.on("submitResults", ({ lobbyId, typedText }) => {
      const lobby = lobbyModule.lobbies[lobbyId];
      if (lobby) {
        const player = lobby.players.find((p) => p.id === socket.id);
        if (player && lobby.originalText) {
          const results = gameModule.calculateResults(typedText, lobbyId);
          lobby.results.push({
            playerId: socket.id,
            username: player.username,
            ...results,
          });
          socket.emit("playerFinished", lobby.results);
          io.to(lobbyId).emit("opponentFinished", lobby.results);
          if (lobby.results.length === lobby.players.length)
            lobby.gameStarted = false;
        } else {
          socket.emit("submitResultsError", "Game not properly initialized.");
        }
      } else {
        socket.emit("submitResultsError", "Lobby not found.");
      }
    });

    socket.on("sendMessage", (message) => {
      const lobbyId = hostToLobbyMap[username];
      if (lobbyId) {
        const chatMessage = lobbyModule.addMessageToChat(
          lobbyId,
          username,
          message,
        );
        io.to(lobbyId).emit("messageReceived", chatMessage);
      } else {
        console.error(`Lobby not found for user ${username}`);
      }
    });

    socket.on("disconnect", () => {
      for (const [lobbyId, lobby] of Object.entries(lobbyModule.lobbies)) {
        const player = lobby.players.find((p) => p.id === socket.id);
        if (player) {
          lobby.players = lobby.players.filter((p) => p.id !== socket.id);
          io.to(lobbyId).emit("playerLeft", player);
          if (lobby.host === player.username)
            delete lobbyModule.hostToLobbyMap[player.username];
          if (!lobby.players.length) {
            lobbyTimeouts[lobbyId] = setTimeout(
              () => {
                delete lobbyModule.lobbies[lobbyId];
              },
              10 * 60 * 1000,
            );
          }
        }
      }
    });
  } catch {
    socket.disconnect();
  }
  socket.on("joinGame", (lobbyId) => {
    const lobby = lobbyModule.lobbies[lobbyId];
    if (lobby && lobby.gameStarted) {
      const player = lobby.players.find((p) => p.id === socket.id);
      if (player) {
        socket.emit("gameJoined", {
          text: lobby.originalText,
          players: lobby.players,
        });
      } else {
        socket.emit("joinGameError", "You are not in the lobby.");
      }
    } else {
      socket.emit("joinGameError", "Game not found.");
    }
  });
});

const getRandomTextFromFile = async (filePath) => {
  const fileContent = await fs.readFile(filePath, "utf-8");
  const excerpts = fileContent.split(/\r?\n\n/);
  return formatText(excerpts[Math.floor(Math.random() * excerpts.length)]);
};

const formatText = (text) => text.replace(/[^a-zA-Z0-9 ,.?!]/g, "");

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
