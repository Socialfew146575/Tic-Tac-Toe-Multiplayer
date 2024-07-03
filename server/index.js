require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8000; // Default port 8000 if PORT is not defined in .env

const app = express(); // Create an instance of Express
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://tic-tac-toe-multiplayer-client-smoky.vercel.app",
      "https://tic-tac-toe-multiplayer-server-sepia.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});




const PLAYERS_PER_GAME = 2;
const playerQueue = [];

class Player {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
    this.username = ""; // Initialize username property
    this.opponent = null; // Initialize opponent property
  }
}

function matchPlayers() {
  if (playerQueue.length < PLAYERS_PER_GAME) {
    return false;
  }

  const players = playerQueue.splice(0, PLAYERS_PER_GAME);

  const match = { players };

  match.players.forEach((player, index) => {
    const opponent = match.players.find((p, idx) => idx !== index);
    player.opponent = opponent.socket;
    const shape = index === 0 ? "circle" : "cross";
    player.socket.emit("match", {
      opponentName: opponent.username,
      shape: shape,
    });
  });
}

io.on("connection", (socket) => {
  console.log("User has connected");

  const player = new Player(socket.id, socket);
  playerQueue.push(player);

  socket.on("request_to_play", (data) => {
    player.username = data.playerName;

    if (playerQueue.length >= PLAYERS_PER_GAME) {
      matchPlayers();
    }

    socket.on("playAgain", () => {
      delete player.opponent;
      playerQueue.push(player);

      if (playerQueue.length >= PLAYERS_PER_GAME) {
        matchPlayers();
      }
    });

    socket.on("PlayerMove", (data) => {
      if (player.opponent) {
        player.opponent.emit("updateGameState", { ...data });
      }
    });

    player.opponent?.on("PlayerMove", (data) => {
      socket.emit("updateGameState", { ...data });
    });

    socket.on("changeTurn", (data) => {
      if (player.opponent) {
        player.opponent.emit("changeTurn", { turn: data.turn });
      }
    });

    socket.on("disconnect", () => {
      console.log("User has been disconnected");

      const index = playerQueue.findIndex((p) => p.id === player.id);

      if (index !== -1) {
        playerQueue.splice(index, 1);
      } else if (player.opponent) {
        player.opponent.emit("opponentWithdraw", {});
        delete player.opponent;
      }
    });
  });
});

// Define a route to send some text on the '/' page
app.get("/", (req, res) => {
  res.send("Welcome to the Tic-Tac-Toe Multiplayer Server!");
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
