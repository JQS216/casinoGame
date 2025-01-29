"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useTongitGame } from "../../../hooks/use-tongit-game";
// import { PlayerHand } from "./PlayerHand";
// import { Deck } from "./Deck";
// import { DiscardPile } from "./DiscardPile";
// import { GameBoard } from "./GameBoard";
// import { ActivityLog } from "./ActivityLog";
// import { MeldedCards } from "./MeldedCards";
// import { motion, AnimatePresence } from "framer-motion";
// import { isValidMeld, shuffleDeck, sortCards } from "../../../utils/card-utils";
import NetworkStatus from "@/app/components/NetworkStatus";
import PercentageLoader from "@/app/components/PercentageLoad";
import Sidebar from "@/app/components/Sidebar";
// import ScoreDashboard from "@/app/components/ScoreDashboard";
import ChatSideBar from "@/app/components/ChatSideBar";
import DealingAnimation from "@/app/components/DealingCard";
import { gsap } from 'gsap';


export default function TongitGame() {
  const [playerHand, setPlayerHande] = useState();
  const [isAutoSort, setIsAutoSort] = useState();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [gameMode, setGameMode] = useState("Bot");
  const [selectedSapawTarget, setSelectedSapawTarget] = useState(null);
  
  // Open left bar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // open right bar
  const toggleChat = () => {
    setIsChatOpen(!isSidebarOpen);
  };

  const [isDealingDone, setIsDealingDone] = useState(false);

  useEffect(() => {
    // Simulate fetching game state
    const fetchGameState = async () => {
      // Replace this with your actual game state fetching logic
      await new Promise(resolve => setTimeout(resolve, 1000));
    };

    fetchGameState();

    // Simulate the dealing animation duration with a timeout
    const timer = setTimeout(() => {
      setIsDealingDone(true);
    }, 900); // 3 seconds animation duration

    return () => clearTimeout(timer);
  }, []);

  if (!isDealingDone) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[url('/image/TableBot.svg')] bg-no-repeat bg-cover bg-center relative">
        <DealingAnimation />
      </div>
    );
  }

  const animateClick = () => {
    setScale(0.99);
    setTimeout(() => {
      setScale(1);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full  min-h-screen bg-[url('/image/TableBot.svg')]  bg-no-repeat bg-cover bg-center relative">
      {/* User border */}

      {/* header game */}
      <div className="absolute w-screen h-16 top-0  bg-gradient-to-r from-[#9AD0C2] rgba(112,35,28,0.8)  rgba(91,36,36,1) via-[#583332] to-[#4E6A63]">
        <div className="flex flex-row h-full w-full justify-between">
          <button onClick={toggleSidebar}>
            <img
              onClick={animateClick}
              src="/image/sideBarButton.svg"
              alt="My image"
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
      <img
        src="/image/headerGame.svg"
        alt="My image"
        className="w-auto absolute h-36 2xl:h-40 top-0"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.3s ease-in-out",
        }}
      />
      <div>
        <button className="absolute bottom-0 left-96 2xl:left-[36rem] transform translate-x-1/2 mb-4">
          <img
            onClick={animateClick}
            src="/image/userBorder.svg"
            alt="My image"
            className="w-30 h-36 2xl:h-40"
            style={{
              transform: `scale(${scale})`,
              transition: "transform 0.3s ease-in-out",
            }}
          />
        </button>
        <button onClick={toggleChat}>
          <img
            onClick={animateClick}
            src="/image/chatButton.svg"
            alt="My image"
            className="w-32 h-32 absolute right-0 2xl:right-10 bottom-20" // Explicit width and height
            style={{
              transform: `scale(${scale})`,
              transition: "transform 0.3s ease-in-out",
            }}
          />
        </button>
        <ChatSideBar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        <div className="px-28 2xl:px-36 flex w-screen items-center gap-11 h-32 absolute bottom-0 left-0 justify-between">
          {/* Left button */}
          <div>
            {" "}
            {/* left button */}
            <button
              // onClick={handleMeld}
              // disabled={
              //   !isPlayerTurn ||
              //   gameState.selectedCardIndices.length < 3 ||
              //   !gameState.hasDrawnThisTurn ||
              //   gameState.gameEnded
              // }
            >
              <img
                onClick={animateClick}
                src="/image/dropButton.svg"
                alt="My image"
                className="w-[115px] 2xl:w-[145px] h-full"
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
            <button
              // onClick={handleDiscard}
              // disabled={
              //   !isPlayerTurn ||
              //   gameState.selectedCardIndices.length !== 1 ||
              //   !gameState.hasDrawnThisTurn ||
              //   gameState.gameEnded
              // }
            >
              <img
                onClick={animateClick}
                src="/image/dumpButton.svg"
                alt="My image"
                className="w-[115px] 2xl:w-[145px] h-full"
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
            <button
              // onClick={handleCallDraw}
              // disabled={
              //   !isPlayerTurn ||
              //   gameState.selectedCardIndices.length < 3 ||
              //   !gameState.hasDrawnThisTurn ||
              //   gameState.gameEnded
              // }
            >
              <img
                // onClick={handleSapaw}
                src="/image/sapawButton.svg"
                alt="My image"
                className="w-[125px] 2xl:w-[160px] h-full"
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
            <button
              // onClick={handleCallDraw}
              // disabled={
              //   !isPlayerTurn ||
              //   gameState.selectedCardIndices.length < 3 ||
              //   !gameState.hasDrawnThisTurn ||
              //   gameState.gameEnded
              // }
            >
              <img
                onClick={animateClick}
                src="/image/fightButton.svg"
                alt="My image"
                className="w-[115px] 2xl:w-[145px] h-full"
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
          </div>
          {/* right button */}

          <div className="h-full flex justify-center items-center">
            <button
            // onClick={autoSort}
            >
              <img
                onClick={animateClick}
                src="/image/auoSort.svg"
                alt="My image"
                className="w-32 h-32" // Explicit width and height
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
            <button
            //  onClick={shuffleDecks}
             >
              <img
                onClick={animateClick}
                src="/image/shuffleButton.svg"
                alt="My image"
                className="w-32 h-32" // Explicit width and height
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
            <button
            //  onClick={shuffleDecks}
            >
              <img
                onClick={animateClick}
                src="/image/withdrawButton.svg"
                alt="My image"
                className="w-32 h-32" // Explicit width and height
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
            <button 
              // onClick={shuffleDecks}
            >
              <img
                onClick={animateClick}
                src="/image/depositButton.svg"
                alt="My image"
                className="w-32 h-32" // Explicit width and height
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
