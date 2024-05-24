export function handleLoginSuccess(token) {
  localStorage.setItem("token", token);
  window.location.href = "lobby.html";
}

export function handleRegisterSuccess(token) {
  localStorage.setItem("token", token);
  window.location.href = "lobby.html";
}

export function saveState() {
  const currentLobbyId = localStorage.getItem("currentLobbyId");
  if (currentLobbyId) {
    localStorage.setItem("currentLobbyId", currentLobbyId);
  }
}

export function updateLeaderboard(results) {
  const leaderboardList = document.getElementById("leaderboard-list");
  leaderboardList.innerHTML = "";
  results.forEach((result) => {
    const resultItem = document.createElement("li");
    resultItem.textContent = `${result.username} - WPM: ${result.wpm}, Accuracy: ${result.accuracy}%`;
    leaderboardList.appendChild(resultItem);
  });
}
