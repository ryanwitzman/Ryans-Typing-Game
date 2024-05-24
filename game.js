const lobbies = require('./lobby').lobbies;

function calculateResults(typedText, lobbyId) {
  const lobby = lobbies[lobbyId];
  const correctText = lobby.originalText;
  const typedWords = typedText.trim().split(/\s+/);
  const correctWords = correctText.trim().split(/\s+/);
  const startTime = lobby.startTime; // Use the stored start time from the lobby
  const endTime = Date.now();
  const minutes = (endTime - startTime) / 60000;
  const wpm = typedWords.length / minutes;
  let correctCount = 0;
  for (let i = 0; i < typedWords.length; i++) {
    if (typedWords[i] === correctWords[i]) {
      correctCount++;
    }
  }
  const accuracy = (correctCount / correctWords.length) * 100;
  return { wpm: Math.round(wpm), accuracy: Math.round(accuracy) };
}

module.exports = {
  calculateResults
};
