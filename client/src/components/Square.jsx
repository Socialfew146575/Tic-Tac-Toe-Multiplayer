import React, { useEffect, useState } from 'react';


const Square = ({ row, col, gameState, setGameState, currentPlayer, setCurrentPlayer, winner, winningBoxes, socket, shape }) => {
  const [icon, setIcon] = useState(null);

  const handleClick = () => {
    if (currentPlayer !== shape) return;
    if (winner || icon || gameState[row][col] !== '') return;

    const turn = currentPlayer === 'circle' ? 'O' : 'X';

    setGameState(prev => {
      const copyState = [...prev];
      copyState[row][col] = turn;
      return copyState;
    });

    socket.emit("changeTurn", {
      turn: currentPlayer === "circle" ? "cross" : "circle"
    });

    socket.emit("PlayerMove", {
      row: row,
      col: col,
      turn: turn
    });

    setCurrentPlayer(prev => (prev === "circle" ? "cross" : "circle"));
    setIcon(true);
  };

  const color = currentPlayer === "circle" ? "bg-[#DE7EA1]" : "bg-[#3FA7F2]";

  return (
    <div className={`h-20 w-20 rounded-md flex items-center justify-center ${shape !== currentPlayer ? "opponentTurnPointer" : ""} ${winningBoxes.includes(row * 3 + col) ? color : "bg-[#4b495f] "} ${winner !== null ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-500"} `} onClick={handleClick}>
      {gameState[row][col] !== '' && (
        <span className='bg-transparent text-5xl font-white font-bold'>
          {gameState[row][col]}
        </span>
      )}
    </div>
  );
};

export default Square;
