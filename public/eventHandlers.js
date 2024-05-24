import { handleLoginSuccess, handleRegisterSuccess } from "./utils.js";

export function setupEventHandlers(socket, currentLobbyId) {
  const elements = {
    loginBtn: document.getElementById("login-btn"),
    registerBtn: document.getElementById("register-btn"),
    createPublicLobbyBtn: document.getElementById("create-public-lobby-btn"),
    createPrivateLobbyBtn: document.getElementById("create-private-lobby-btn"),
    joinLobbyBtn: document.getElementById("join-lobby-btn"),
    startGameBtn: document.getElementById("start-game-btn"),
    sendChatBtn: document.getElementById("send-chat-btn"),
    submitBtn: document.getElementById("submit-btn"),
    backToLobbyBtn: document.getElementById("back-to-lobby-btn"),
    startNewGameBtn: document.getElementById("start-new-game-btn"),
    refreshLobbiesBtn: document.getElementById("refresh-lobbies-btn"),
    copyBtn: document.getElementById("copy-btn"),
    logoutBtn: document.getElementById("logout-btn"),
    lobbyLink: document.getElementById("lobby-link"),
    lobbyId: document.getElementById("lobby-id"),
    leaveLobbyBtn: document.getElementById("leave-lobby-btn"),
    usernameInput: document.getElementById("username-input"),
    passwordInput: document.getElementById("password-input"),
    lobbyIdInput: document.getElementById("lobby-id-input"),
    chatInput: document.getElementById("chat-input"),
    typingInput: document.getElementById("typing-input"),
  };

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", async () => {
      const username = elements.usernameInput.value;
      const password = elements.passwordInput.value;
      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (response.ok) {
          handleLoginSuccess(data.token);
        } else {
          alert("Login failed: " + data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });
  }

  if (elements.registerBtn) {
    elements.registerBtn.addEventListener("click", async () => {
      const username = elements.usernameInput.value;
      const password = elements.passwordInput.value;
      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (response.ok) {
          handleRegisterSuccess(data.token);
        } else {
          alert("Registration failed: " + data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });
  }

  if (elements.createPublicLobbyBtn) {
    elements.createPublicLobbyBtn.addEventListener("click", () =>
      socket.emit("createLobby", { isPublic: true }),
    );
  }

  if (elements.createPrivateLobbyBtn) {
    elements.createPrivateLobbyBtn.addEventListener("click", () =>
      socket.emit("createLobby", { isPublic: false }),
    );
  }

  if (elements.joinLobbyBtn) {
    elements.joinLobbyBtn.addEventListener("click", () => {
      const lobbyId = elements.lobbyIdInput.value;
      if (lobbyId) {
        socket.emit("joinLobby", lobbyId);
      }
    });
  }

  if (elements.lobbyLink) {
    elements.lobbyLink.value = window.location.href;
  }

  if (elements.lobbyId) {
    elements.lobbyId.textContent = currentLobbyId;
  }

  if (elements.startGameBtn) {
    elements.startGameBtn.addEventListener("click", () => {
      if (currentLobbyId) {
        socket.emit("startGame", currentLobbyId);
      }
    });
  }

  if (elements.sendChatBtn) {
    elements.sendChatBtn.addEventListener("click", () => {
      const msg = elements.chatInput.value.trim();
      if (msg) {
        socket.emit("sendMessage", msg);
        elements.chatInput.value = "";
      }
    });
  }

  if (elements.chatInput) {
    elements.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        elements.sendChatBtn.click();
      }
    });
  }

  if (elements.submitBtn) {
    elements.submitBtn.addEventListener("click", () => {
      const typedText = elements.typingInput.value;
      if (currentLobbyId) {
        socket.emit("submitResults", { lobbyId: currentLobbyId, typedText });
      }
    });
  }

  if (elements.backToLobbyBtn) {
    elements.backToLobbyBtn.addEventListener("click", () => {
      window.location.href = "lobby_container.html";
    });
  }

  if (elements.startNewGameBtn) {
    elements.startNewGameBtn.addEventListener("click", () => {
      if (currentLobbyId) {
        socket.emit("startGame", currentLobbyId);
      }
    });
  }

  if (elements.refreshLobbiesBtn) {
    elements.refreshLobbiesBtn.addEventListener("click", () => {
      socket.emit("refreshPublicLobbies");
    });
  }

  if (elements.copyBtn) {
    elements.copyBtn.addEventListener("click", () => {
      const lobbyLink = document.getElementById("lobby-link");
      lobbyLink.select();
      document.execCommand("copy");
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }

  if (elements.leaveLobbyBtn) {
    elements.leaveLobbyBtn.addEventListener("click", () => {
      if (currentLobbyId) {
        socket.emit("leaveLobby", currentLobbyId);
        currentLobbyId = null;
        localStorage.removeItem("currentLobbyId");
        window.location.href = "lobby.html";
      }
    });
  }
}
