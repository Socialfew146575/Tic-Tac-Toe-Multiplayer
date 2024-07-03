const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const PLAYERS_PER_GAME = 2;

class Player {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
  }
}

const playerQueue = [];

function matchPlayers() {
  if (playerQueue.length < PLAYERS_PER_GAME) {
    return false;
  }

  const players = playerQueue.splice(0, PLAYERS_PER_GAME);

  const match = { players };

  match.players.forEach((player, index) => {
    const opponent = match.players.find((p, idx) => idx !== index);
    player.opponent = opponent.socket;
    const shape = index == 0 ? "circle" : "cross";
    player.socket.emit("match", {
      opponentName: opponent.username,
      shape: shape,
    });
  });
}

io.on("connection", (socket) => {
  console.log("user has connected");

  const player = new Player(socket.id, socket);

  playerQueue.push(player);

  socket.on("request_to_play", (data) => {
    player.username = data.playerName;

    if (playerQueue.length >= PLAYERS_PER_GAME) {
      matchPlayers();
    }

    socket.on("playAgain", () => {
      delete player.opponent
      
      playerQueue.push(player);

      if (playerQueue.length >= PLAYERS_PER_GAME) {
        matchPlayers();
      }
    });

    socket.on("PlayerMove", (data) => {
      //  console.log(data);
      player.opponent.emit("updateGameState", {
        ...data
      });
    });

    player.opponent?.on("PlayerMove",(data)=>{

      // console.log(data)
      socket.emit("updateGameState", {
        ...data,
      });
    })

    socket.on("changeTurn", (data) => {
      player.opponent.emit("changeTurn", {
        turn: data.turn,
      });
    });

    socket.on("disconnect", () => {
      console.log("User has been disconnected");

      const index = playerQueue.findIndex((p) => p.id === player.id);

      console.log(index);

      if (index !== -1) {
        playerQueue.splice(index, 1);
      } else {
        // console.log(player.opponent);
        player.opponent.emit("opponentWithdraw", {});

        delete player.opponent;
      }
    });
  });
});

httpServer.listen(8000, () => {
  console.log("Server running on port 8000");
});
