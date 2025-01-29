"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import GameHeaderPot from "@/app/components/gameHeaderPot";
import { PlayerHand } from "../../play-bot/PlayerHand";
import { MeldedCards } from "../../play-bot/MeldedCards";
import { Deck } from "../../play-bot/Deck";
import { DiscardPile } from "../../play-bot/DiscardPile";
import GameFooter from "@/app/components/GameFooter";
import DealingAnimation from "@/app/components/DealingCard";
import Sidebar from "@/app/components/Sidebar";
import ChatSideBar from "@/app/components/ChatSideBar";
import ScoreDashboard from "@/app/components/ScoreDashboard";
import NetworkStatus from "@/app/components/NetworkStatus";
import { calculateCardPoints } from "@/utils/card-utils";
import GameRound from "@/app/components/GameRound";
import PlayerPoints from "@/app/components/PlayerPoints";
import Bet from "@/app/components/Bet";
import Discardpile from "@/app/components/Discardpile";
import Image from "next/image";
import { isValidMeld } from "@/utils/card-utils";
import { useSearchParams, useRouter } from "next/navigation";
import CircularCountdown from "@/app/components/CircularCountdown";
import ActionText from "@/app/components/ActionText";
import FightModal from "@/app/components/FightChallengeModal";
import ChallengeModal from "@/app/components/ChanllengeModal";

const Game = () => {
  const [gameState, setGameState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [isWaiting, setIsWaiting] = useState(true);
  const [playersCount, setPlayersCount] = useState(0);
  const [error, setError] = useState(null);
  const [isDealingDone, setIsDealingDone] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDiscardPileOpen, setIsDiscardPileOpen] = useState(false);
  const [selectedSapawTarget, setSelectedSapawTarget] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [discardingIndex, setDiscardingIndex] = useState(null);
  const [isScoreboardVisible, setIsScoreboardVisible] = useState(false);
  const [paramValue, setParamValue] = useState();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isFightModalOpen, setIsFightModalOpen] = useState(false);
  const [fightInitiator, setFightInitiator] = useState(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeInitiator, setChallengeInitiator] = useState(null);
  const [challengeTarget, setChallengeTarget] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const [timer, setTimer] = useState(20);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const value = searchParams.get("betAmount");
    if (!value) {
      router.push("/TongitsGame/Gamebet");
    }
    setParamValue(value);
  }, [searchParams, router]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    // const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("player-joined", (data) => {
      setPlayersCount(data.playersCount);
      if (data.playersCount < 3) {
        setIsWaiting(true);
      }
    });

    newSocket.on("game-started", () => {
      setIsWaiting(false);
      setGameStarted(true);
      if (!isDealingDone) {
        setIsDealingDone(false);
        setTimeout(() => setIsDealingDone(true), 2000);
      }
    });

    newSocket.on("game-state", (newGameState) => {
      setGameState(newGameState);

      if (newGameState.lastAction) {
        setCurrentAction(
          `Players ${newGameState.lastAction.player} ${newGameState.lastAction.type}`
        );
      }
    });

    newSocket.on("player-left", (data) => {
      setPlayersCount(data.playersCount);
      if (data.playersCount < 3) {
        setIsWaiting(true);
      }
    });

    newSocket.on('fight-initiated', (data) => {
      setFightInitiator(data.initiator);
      setIsFightModalOpen(true);
    });

    newSocket.on('fight-response-received', (data) => {
      setCurrentAction(`${data.responder} has ${data.accepted ? 'accepted' : 'declined'} the fight.`);
    });

    newSocket.on('fight-resolved', (data) => {
      setIsFightModalOpen(false);
      if (data.winner) {
        setCurrentAction(`${data.winner} won the fight!`);
      } else {
        setCurrentAction(`The fight was declined.`);
      }
    });

    newSocket.on('challenge-initiated', (data) => {
      setChallengeInitiator(data.initiator);
      setChallengeTarget(data.target);
      setIsChallengeModalOpen(true);
    });

    newSocket.on('challenge-resolved', (data) => {
      setIsChallengeModalOpen(false);
      setCurrentAction(`${data.winner} won the challenge!`);
    });

    newSocket.on("connect_error", (err) => {
      setError("Failed to connect to game server");
      console.error("Connection error:", err);
    });

    newSocket.on("timer-update", (timer) => {
      setTimer(timer);
    });

    if (!socket) return;
    // create game-reset
    socket.on('game-reset', ({ newGameId, message }) => {
      // Reset all game state except playersCount
      setGameState(null);
      setIsWaiting(true);
      setGameStarted(false);
      setIsDealingDone(false);
      setSelectedIndices([]);
      setDiscardingIndex(null);
      setSelectedSapawTarget(null);
      setIsAutoPlaying(false);
      setCurrentAction(null);
      setIsFightModalOpen(false);
      setIsChallengeModalOpen(false);
      setIsDiscardPileOpen(false);
      setIsScoreboardVisible(false);
      setTimer(20); // Reset timer
  
      // Re-join with the same player name
      if (playerName) {
        socket.emit('join-game', playerName);
      }
    });
  
    return () => {
      socket.off('game-reset');
      socket.off('game-started');
      socket.off('game-state');
      socket.off('timer-update');
      socket.off('player-joined');
      socket.off('player-disconnected');
      socket.off('fight-initiated');
      socket.off('fight-response-received');
      socket.off('fight-resolved');
    };
  }, []);

  useEffect(() => {
    const isPlayerTurn =
      gameState &&
      gameState.currentPlayerIndex ===
        gameState.players.findIndex((p) => p.id === socket?.id);
  
    if (isPlayerTurn && !gameState?.gameEnded) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              setTimerExpired(true);
              handleAutoPlay();
              return 20;
            }
            return prevTimer - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerExpired(false);
    }
  
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, socket?.id]);

  const isAnimatingRef = useRef(false);
  const discardTimeoutRef = useRef(null);

  const handleAutoPlay = useCallback(() => {
    if (gameState && socket && !isAutoPlaying) {
      setIsAutoPlaying(true);

      // Auto draw from deck
      socket.emit("player-action", { type: "draw", fromDeck: true });

      setTimeout(() => {
        const currentPlayerHand = gameState.players.find(
          (p) => p.id === socket.id
        )?.hand;

        if (currentPlayerHand && currentPlayerHand.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * currentPlayerHand.length
          );

          if (!isAnimatingRef.current) {
            isAnimatingRef.current = true;
            setDiscardingIndex(randomIndex);

            discardTimeoutRef.current = setTimeout(() => {
              socket.emit("player-action", {
                type: "discard",
                cardIndex: randomIndex,
              });
              setDiscardingIndex(null);
              isAnimatingRef.current = false;
              setIsAutoPlaying(false);
            }, 400);
          }
        } else {
          setIsAutoPlaying(false);
        }
      }, 500);
    }
  }, [gameState, socket, isAutoPlaying]);

  const handleJoinGame = (e) => {
    e?.preventDefault();
    if (playerName.trim() && socket) {
      console.log("Joining game with name:", playerName);
      socket.emit("join-game", playerName);
    }
  };

  const nextRound = () => {
    handleAction({ type: "nextGame" });
  };

  const handleAction = useCallback(
    (action) => {
      if (gameState && socket) {
        if (action.type === "discard" && selectedIndices.length === 1) {
          setDiscardingIndex(selectedIndices[0]);
          setTimeout(() => {
            socket.emit("player-action", action);
            setSelectedIndices([]);
            setDiscardingIndex(null);
          }, 300);
        } else if (action.type === "shuffle") {
          // Emit the shuffle action with the current player's index
          socket.emit("player-action", {
            type: "shuffle",
            playerIndex: gameState.players.findIndex((p) => p.id === socket.id),
          });
        } else if (action.type === "fight") {
          socket.emit("player-action", { type: "fight" });
          setIsFightModalOpen(true);
        } else if (action.type === "challenge") {
          socket.emit("player-action", { type: "challenge", targetIndex: action.targetIndex });
        } else {
          socket.emit("player-action", action);
        }
      }
    },
    [gameState, socket, selectedIndices]
  );

  const handleFightResponse = (accept) => {
    if (gameState && socket) {
      socket.emit('player-action', { type: 'fight-response', accept });
    }
    setIsFightModalOpen(false);
  };

  const handleChallengeResponse = (accept) => {
    if (gameState && socket) {
      socket.emit('player-action', { type: 'challenge-response', accept });
    }
    setIsChallengeModalOpen(false);
  };

  const canDrawFromDiscard = useCallback(() => {
    try {
      if (!gameState || gameState.discardPile.length === 0) return false;
      const topDiscardCard =
        gameState.discardPile[gameState.discardPile.length - 1];
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
      for (let i = 0; i < currentPlayer?.hand.length; i++) {
        for (let j = i + 1; j < currentPlayer?.hand.length; j++) {
          if (
            isValidMeld([
              topDiscardCard,
              currentPlayer?.hand[i],
              currentPlayer?.hand[j],
            ])
          ) {
            return true;
          }
        }
      }
  
      for (const meld of currentPlayer?.exposedMelds) {
        if (isValidMeld([...meld, topDiscardCard])) {
          return true;
        }
      }
  
      return false;
    } catch (error) {
      router.push("/TongitsGame/Gamebet");
    }
  }, [gameState,router]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const animateClick = () => {
    setScale(0.99);
    setTimeout(() => setScale(1), 300);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleJoinGame}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4">Join Tongits Game</h2>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-2 border rounded mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Join Game
          </button>
        </form>
      </div>
    );
  }

  if (isWaiting && playersCount < 3) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Players</h2>
          <p className="mb-4">Players joined: {playersCount}/3</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (gameStarted && !isDealingDone) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[url('/image/TableBot.svg')] bg-no-repeat bg-cover bg-center relative">
        <DealingAnimation onComplete={() => setIsDealingDone(true)} />
      </div>
    );
  }

  const DiscardPileModal = () => {
    setIsDiscardPileOpen(!isDiscardPileOpen);
  };

  const resetGame = () => {
    socket.emit('player-action', { type: 'resetGame' });
    router.push(`/TongitsGame/Gamebet`);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const ContinueGame = () => {
    // Reset all relevant state variables except playersCount
    setGameState(null);
    setIsWaiting(true);
    setGameStarted(false);
    setIsDealingDone(false);
    setSelectedIndices([]);
    setDiscardingIndex(null);
    setSelectedSapawTarget(null);
    setIsAutoPlaying(false);
    setCurrentAction(null);
    setIsFightModalOpen(false);
    setIsChallengeModalOpen(false);
    setIsDiscardPileOpen(false);
    setIsScoreboardVisible(false);
    setTimer(20)
    setGameState(null);
    setIsFightModalOpen(false)
    setIsChallengeModalOpen(false)
    setIsDiscardPileOpen(false)
    setChallengeTarget(null)
    setPlayersCount(0)
    // ITO LANG MUNA APPROACH KO FOR NOW RESET NEXT GAME ENCOUNTER ERROR 
    // IF WALA REFRESH NAIIWAN UNG MGA DATA KAHIT NAG RESET NA
    const value = searchParams.get("betAmount");
    router.push(`/TongitsGame/live-game/multiplayer?betAmount=20000`);
    window.location.reload();
    socket.emit('player-action', { type: 'resetGame' });
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const playerIndex = gameState.players.findIndex((p) => p.id === socket.id);
  const player = gameState.players[playerIndex];
  console.log(gameState);
  const isPlayerTurn =
    gameState.currentPlayerIndex ===
    gameState.players.findIndex((p) => p.id === socket.id);
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[url('/image/TableBot.svg')] bg-no-repeat bg-cover bg-center relative">
      <div className="absolute w-screen h-16 top-0 bg-custom-gradient">
        <div className="flex flex-row h-full w-full justify-between">
          <button onClick={toggleSidebar}>
            <img
              onClick={animateClick}
              src="/image/sideBarButton.svg"
              alt="Sidebar"
              className="w-full h-full"
              style={{
                transform: `scale(${scale})`,
                transition: "transform 0.3s ease-in-out",
              }}
            />
          </button>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          {/* <NetworkStatus /> */}
        </div>
      </div>

      <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
        <GameHeaderPot
          betAmout={paramValue}
          gameState={gameState}
          socket={socket}
        />
      </div>

      <div className="flex w-full max-w-7xl gap-4">
        <div className="w-full flex flex-col justify-between items-center gap-10">
          <div className="absolute z-10">
            <MeldedCards
              contextText={`text-3xl`}
              gameState={gameState}
              socket={socket.id}
              players={gameState.players}
              onSapawSelect={setSelectedSapawTarget}
              currentPlayerIndex={gameState.currentPlayerIndex}
              selectedSapawTarget={selectedSapawTarget}
              socketId={socket.id}
              game={gameState}
            />
          </div>

          <div className="p-4 2xl:px-8 rounded-md flex justify-center space-x-2 mb-10 mt-10 relative">
            <Deck
              cardsLeft={gameState.deck.length}
              onDraw={() =>
                isPlayerTurn &&
                !gameState.gameEnded &&
                handleAction({ type: "draw", fromDeck: true })
              }
              disabled={
                gameState.hasDrawnThisTurn ||
                !isPlayerTurn ||
                gameState.gameEnded
              }
            />
            <DiscardPile
              currentPlayer={isPlayerTurn}
              topCard={gameState.discardPile[gameState.discardPile.length - 1]}
              onDraw={() =>
                isPlayerTurn &&
                !gameState.gameEnded &&
                handleAction({ type: "draw", fromDeck: false })
              }
              disabled={
                gameState.hasDrawnThisTurn ||
                !isPlayerTurn ||
                gameState.gameEnded ||
                !canDrawFromDiscard()
              }
              canDraw={canDrawFromDiscard()}
              setPosition={setPosition}
            />
            <Discardpile
              discardCard={gameState.discardPile}
              isOpen={isDiscardPileOpen}
              onClose={() => setIsDiscardPileOpen(false)}
            />
            <button
              className="absolute -right-3 top-12 text-white text-xl"
              onClick={DiscardPileModal}
            >
              <div className="w-full h-10">
                <Image
                  onClick={animateClick}
                  src="/image/viewdiscardButton.svg"
                  alt="My image"
                  width={1000}
                  height={1000}
                  className="w-5 h-5 animate-pulse"
                  style={{
                    transform: `scale(${scale})`,
                    transition: "transform 0.3s ease-in-out",
                  }}
                />
              </div>
            </button>
          </div>

          <div className="pb-6 mt-10 pr-20 2xl:py-24 2xl:pr-0 ">
            <PlayerHand
              position={position}
              cardSize={" w-1.5 h-22 p-2 text-4xl"}
              hand={gameState.players.find((p) => p.id === socket.id)?.hand}
              onCardClick={(index) => {
                if (isPlayerTurn && !gameState.gameEnded) {
                  const newSelectedIndices = selectedIndices.includes(index)
                    ? selectedIndices.filter((i) => i !== index)
                    : [...selectedIndices, index];
                  setSelectedIndices(newSelectedIndices);
                  handleAction({
                    type: "updateSelectedIndices",
                    indices: newSelectedIndices,
                  });
                }
              }}
              selectedIndices={selectedIndices}
              isCurrentPlayer={isPlayerTurn && !gameState.gameEnded}
              discardingIndex={discardingIndex}
            />
          </div>
        </div>
      </div>

      <div className="absolute right-0 bottom-64 w-24 h-24 ">
        <PlayerPoints
          socket={socket}
          gameState={gameState}
          getCardValue={calculateCardPoints}
        />
      </div>
      <div className="absolute right-0 bottom-0 w-24 h-24 ">
        <button onClick={toggleChat}>
          <img
            onClick={animateClick}
            src="/image/chatButton.svg"
            alt="My image"
            className="w-24 h-24 absolute right-2 2xl:right-10 bottom-28"
            style={{
              transform: `scale(${scale})`,
              transition: "transform 0.3s ease-in-out",
            }}
          />
        </button>
      </div>

      <div className="absolute left-5 bottom-56">
        <GameRound gameState={gameState} />
        <div
          className={`absolute top-16 left-1/2 transform -translate-x-1/2  w-14 h-14 flex justify-center items-center p-2`}
        >
          <CircularCountdown
            timer={timer}
            gameState={gameState}
            isPlayerTurn={isPlayerTurn}
          />
        </div>
      </div>

      <GameFooter
        timer={timer}
        onShuffle={() => handleAction({ type: "shuffle" })}
        onMeld={() => {
          if (
            isPlayerTurn &&
            selectedIndices.length >= 3 &&
            !gameState.gameEnded
          ) {
            handleAction({ type: "meld", cardIndices: selectedIndices });
          }
          selectedIndices.length > 0 && setSelectedIndices([]);
        }}
        onDiscard={() => {
          if (
            isPlayerTurn &&
            selectedIndices.length === 1 &&
            !gameState.gameEnded
          ) {
            setDiscardingIndex(selectedIndices[0]);
            setTimeout(() => {
              handleAction({ type: "discard", cardIndex: selectedIndices[0] });
              setSelectedIndices([]);
              setDiscardingIndex(null);
            }, 200);
          }
        }}
        onSapaw={() => {
          if (
            isPlayerTurn &&
            selectedSapawTarget &&
            selectedIndices.length > 0 &&
            !gameState.gameEnded
          ) {
            handleAction({
              type: "sapaw",
              target: selectedSapawTarget,
              cardIndices: selectedIndices,
            });
            setSelectedSapawTarget(null);
          }
          selectedIndices.length > 0 && setSelectedIndices([]);
        }}
        onCallDraw={() => {
          if (
            isPlayerTurn &&
            !gameState.gameEnded &&
            currentPlayer.exposedMelds.length > 0
          ) {
            handleAction({ type: "callDraw" });
          }
        }}
        onFight={() => {
          if (isPlayerTurn && !gameState.gameEnded && gameState.hasDrawnThisTurn) {
            handleAction({ type: 'fight' });
          }
        }}
        onChallenge={() => {
          if (isPlayerTurn && !gameState.gameEnded) {
            // Open a modal to select which player to challenge
            // For simplicity, we'll just challenge the next player
            const targetIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            handleAction({ type: 'challenge', targetIndex });
          }
        }}

        isPlayerTurn={isPlayerTurn}
        gameEnded={gameState.gameEnded}
        hasDrawnThisTurn={gameState.hasDrawnThisTurn}
        selectedIndices={selectedIndices}
        selectedSapawTarget={selectedSapawTarget}
      />

      {gameState.gameEnded && (
        <ScoreDashboard
          ContinueGame={ContinueGame}
          socketId={socket.id}
          gameState={gameState}
          onClose={() => setIsScoreboardVisible(false)}
          Reset={nextRound}
          resetGame={resetGame}
          setPlayersCount={setPlayersCount}
        />
      )}

      <ChatSideBar  isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      {currentAction && <ActionText action={currentAction} />}

      <FightModal
        isOpen={isFightModalOpen}
        onClose={() => setIsFightModalOpen(false)}
        onAccept={() => handleFightResponse(true)}
        onDecline={() => handleFightResponse(false)}
        initiator={fightInitiator}
        currentPlayer={player?.name}
      />

      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onAccept={() => handleChallengeResponse(true)}
        onDecline={() => handleChallengeResponse(false)}
        initiator={challengeInitiator}
        target={challengeTarget}
      />

    </div>
  );
};

export default Game;

