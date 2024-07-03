import React, { useEffect, useRef, useState } from 'react';
import Square from './components/Square';

import { io } from "socket.io-client"

import Swal from 'sweetalert2'



const renderForm = [

    ['', '', '',],
    ['', '', '',],
    ['', '', '',],


]


const App = () => {


    const [gameState, setGameState] = useState(renderForm)
    const [currentPlayer, setCurrentPlayer] = useState("circle")
    const [winner, setWinner] = useState(null)
    const [draw, setDraw] = useState(false)

    const [myShape, setMyShape] = useState(null)

    const [winningBoxes, setWinngBoxes] = useState([])

    const [playOnline, setPlayOnline] = useState(false)


    const [name, setName] = useState("")

    const [opponentName, setOpponentName] = useState(null)

    const [opponentWithdraw, setOpponentWithdraw] = useState(false)

    const socket = useRef(null)



    useEffect(() => {


        const checkForWinner = () => {


            // Check rows
            for (let i = 0; i < 3; i++) {
                if (gameState[i][0] === gameState[i][1] && gameState[i][2] === gameState[i][1]) {
                    return gameState[i][1]; // Winner found
                }
            }

            // Check columns
            for (let j = 0; j < 3; j++) {
                if (gameState[0][j] === gameState[1][j] && gameState[2][j] === gameState[1][j]) {
                    return gameState[1][j]; // Winner found
                }
            }

            // Check diagonals
            if ((gameState[0][0] === gameState[1][1] && gameState[2][2] === gameState[1][1]) ||
                (gameState[0][2] === gameState[1][1] && gameState[2][0] === gameState[1][1])) {
                return gameState[1][1]; // Winner found
            }

            const isDraw = gameState.flat().every(e => {

                if (e === 'O' || e === 'X') return true;




            })


            setDraw(isDraw)



            return null; // No winner found yet
        };


        const winner = checkForWinner()

        if (winner === "O")
            setWinner("circle")
        else if (winner === 'X') {
            setWinner("cross")
        }


        if (winner) {

            for (let i = 0; i < 3; i++) {
                if (gameState[i][0] === gameState[i][1] && gameState[i][2] === gameState[i][1]) {
                    setWinngBoxes([i * 3, i * 3 + 1, i * 3 + 2]);// Winner found
                    return;
                }
            }

            // Check columns
            for (let j = 0; j < 3; j++) {
                if (gameState[0][j] === gameState[1][j] && gameState[2][j] === gameState[1][j]) {
                    setWinngBoxes([j, 3 + j, 6 + j]);// Winner found
                    return;
                }
            }

            // Check diagonals
            if (gameState[0][0] === gameState[1][1] && gameState[2][2] === gameState[1][1]) {
                setWinngBoxes([0, 4, 8]);// Winner found
                return;
            }
            if (gameState[0][2] === gameState[1][1] && gameState[2][0] === gameState[1][1]) {
                setWinngBoxes([2, 4, 6]);// Winner found
                return;

            }



        }






    }, [gameState])


    const handlePlayAgain = () => {

        setOpponentWithdraw(false)
        setOpponentName(null)
        setWinner(null)
        setWinngBoxes([])
        setGameState(prev => {

            const copyState = [

                ['', '', '',],
                ['', '', '',],
                ['', '', '',],


            ]
            // console.log(copyState)

            return copyState

        });
        setCurrentPlayer('circle')
        setMyShape(null)
        setDraw(false)

        console.log(gameState)

        socket.current?.emit("playAgain", {

        });




    }

    socket.current?.on("changeTurn", (data) => {

        setCurrentPlayer(data.turn);

    })

    socket.current?.on("updateGameState", (data) => {
        const row = data.row;
        const col = data.col;
        const turn = data.turn


        setGameState(prev => {
            const copyState = [...prev];
            copyState[row][col] = turn;
            return copyState;
        });

    })

    socket.current?.on("connect_error", (err) => {
        console.log("Connection Error: ", err.message);
    });

    socket.current?.on("connect", () => {
        setPlayOnline(true);


    });

    socket.current?.on("match", (data) => {

        setOpponentName(data.opponentName)
        setMyShape(data.shape)


    })

    socket.current?.on("opponentWithdraw", () => {

        // console.log("withdrawal")
        setOpponentWithdraw(true)



    })




    const handlePlayOnline = async () => {

        const result = await takePlayerName()

        if (!result.isConfirmed) return

        const username = result.value
        setName(username)



        const newSocket = io("wss://tic-tac-toe-multiplayer-server-sepia.vercel.app", {
            autoConnect: true,
            transports: ['websocket']

        });

        socket.current = newSocket;



        socket.current?.emit("request_to_play", {
            playerName: username
        });


    }

    const takePlayerName = async () => {
        try {
            const result = await Swal.fire({
                title: "Enter your name",
                input: "text",
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) {
                        return "You need to write something!";
                    }
                },
            });

            return result;
        } catch (error) {
            console.error("Error while taking player name:", error);
            return { isConfirmed: false };
        }
    };




    if (!playOnline) {

        return (

            <div className='flex items-center justify-center h-[100vh]'>

                <button className='bg-[#E5CA57] p-5 text-5xl font-bold rounded-lg' onClick={handlePlayOnline}>
                    Play Online
                </button>



            </div>


        )


    }

    if (playOnline && !opponentName) {

        return (
            <>

                <div className='flex items-center justify-center h-[100vh]'>

                    <p className='p-10 bg-white border-2 border-purple-300 rounded-md text-xl'> Waiting for Opponent...</p>

                </div>


            </>
        )


    }




    return (
        <div className=' mt-[10vh] text-white font-happyMonkey flex   items-center justify-center select-none'>


            <div className='flex flex-col  items-center justify-center gap-4'>


                {myShape && <>

                    <div className='flex justify-center items-center w-full font-bold text-xl'>
                        You are Playing as&nbsp;&nbsp;
                        <span className={`${myShape === 'circle' ? "text-[#3FA7F2]" : "text-[#DE7EA1]"} text-4xl`}>
                            "{myShape === 'circle' ? 'O' : 'X'}"
                        </span>


                    </div>

                </>}

                <div className='flex justify-between items-center w-full'>

                    <div className={` ${(currentPlayer === myShape) ? (myShape === "circle") ? "bg-[#3FA7F2]" : "bg-[#DE7EA1]" : "bg-[#4b495f]"} font-[seriff] text-base flex items-center justify-center h-8 w-24  rounded-3xl rounded-tl-none rounded-br-none translate-x-[-15]`}>
                        You
                    </div>

                    <div className={`  ${(currentPlayer !== myShape) ? (currentPlayer === "circle") ? "bg-[#3FA7F2]" : "bg-[#DE7EA1]" : "bg-[#4b495f]"} font-[seriff] text-base flex items-center justify-center h-8 w-24 rounded-3xl rounded-tr-none rounded-bl-none`}>
                        {opponentName}
                    </div>


                </div>

                <div className='bg-[#4b495f] w-full  py-2 rounded-sm flex items-center justify-center '>

                    <h1 className='text-white font-bold text-2xl bg-transparent'>Tic Tac Toe</h1>

                </div>

                <div className='flex flex-col items-center justify-center gap-2'>
                    {gameState.map((row, rowIndex) => (
                        <div key={rowIndex} className='flex gap-2'>
                            {row.map((col, colIndex) => (
                                <Square key={`${rowIndex}-${colIndex}`} row={rowIndex} col={colIndex} gameState={gameState} setGameState={setGameState} currentPlayer={currentPlayer} setCurrentPlayer={setCurrentPlayer} setWinner={setWinner} winner={winner} winningBoxes={winningBoxes} socket={socket.current} shape={myShape} />
                            ))}
                        </div>
                    ))}
                </div>


                {winner && <>
                    <p className='font-semibold text-md tracking-wider '>{winner === myShape ? "You Won" : "You lose"}  !!!</p> <button className='bg-[#E5CA57] p-5 text-5xl font-bold rounded-lg' onClick={handlePlayAgain}>Play Again</button></>}

                {opponentWithdraw && !winner && <>

                    <p className='font-semibold text-md tracking-wider '>You Won !! {opponentName} Withdrawed from the match !!! </p>
                    <button className='bg-[#E5CA57] p-5 text-5xl font-bold rounded-lg' onClick={handlePlayAgain}>Play Again</button>
                </>}
                {!opponentWithdraw && !winner && !draw && <p className='font-semibold text-md tracking-wider '>You are playing against {opponentName}</p>}
                {!opponentWithdraw && draw && <p className='font-semibold text-md tracking-wider '>Draw !!!</p>}


            </div>




        </div>
    );

};

export default App;
