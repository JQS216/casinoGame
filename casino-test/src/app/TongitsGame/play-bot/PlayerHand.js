import React, { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import { motion } from "framer-motion";
import gsap from 'gsap';
import { autoGroupWinningCards } from "./cardGrouping"; // Import the grouping function

export function PlayerHand({
  position,
  cardSize,
  hand,
  onCardClick,
  selectedIndices,
  isCurrentPlayer,
  discardingIndex
}) {
  const containerRef = useRef(null);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const animationTriggered = useRef(false);
  const [groupedHand, setGroupedHand] = useState({
    straightFlushes: [],
    fourOfAKinds: [],
    threeOfAKinds: [],
    remainingCards: []
  });

  // Group cards when the hand changes
  useEffect(() => {
    if (hand && hand.length > 0) {
      setGroupedHand(autoGroupWinningCards(hand));
    }
  }, [hand]);

  // Reset selected cards when selectedIndices changes
  useEffect(() => {
    setSelectedCards(new Set(selectedIndices));
  }, [selectedIndices]);

  // Animation for card spread
  useEffect(() => {
    if (!animationTriggered.current && containerRef.current && hand?.length > 0) {
      const cards = containerRef.current.children;
      gsap.set(cards, {
        x: 3,
        y: 0,
        opacity: 0,
      });

      gsap.to(cards, {
        x: (index) => index * -45,
        opacity: 1,
        stagger: 0.05,
        duration: 0.8,
        ease: 'power2.out',
      });

      animationTriggered.current = true;
    }
  }, [hand]);

  // Handler for card selection
  const handleCardClick = (index) => {
    if (isCurrentPlayer) {
      onCardClick(index); // Ensure this doesn’t update state during render
      setSelectedCards(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }
  };

 // Render a group of cards with proper group spacing
const renderCardGroup = (cards, groupType, startIndex) => {
  return (
    <div className="flex relative" style={{ marginRight: `${cards.length * 10}px` }}>
      {cards.map((card, index) => (
        <motion.div
          key={`${groupType}-${card.suit}-${card.rank}-${index}`}
          layout
          initial={false}
          animate={{
            y: selectedIndices.includes(startIndex + index) ? -16 : 0,
            x: index * -45, // Overlap within the group
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ rotate: 5 }}
          style={{
            position: "relative", // Use relative positioning within the group
            zIndex: cards.length - index,
          }}
        >
          <Card
            border={'1px solid black'}
            position={position}
            opacityCard={`${selectedCards.size === 0 || selectedCards.has(startIndex + index) ? 'opacity-100' : 'opacity-85'}`}
            cardSize={cardSize}
            card={card}
            onClick={() => handleCardClick(startIndex + index)}
            isDiscarding={discardingIndex === startIndex + index}
          />
        </motion.div>
      ))}
    </div>
  );
};

return (
  <div
    ref={containerRef}
    className={`flex flex-wrap justify-start p-4 rounded-lg relative overflow-x-auto ${
      isCurrentPlayer ? "bg-opacity-10 shadow-lg h-60 w-[66rem] 2xl:w-[75rem]" : "bg-opacity-10 shadow-lg h-60 w-[66rem] 2xl:w-[75rem]"
    }`}
  >
    {/* Render Straight Flushes */}
    {groupedHand.straightFlushes.map((group, groupIndex) => (
      <div key={`straightFlush-${groupIndex}`} className="mr-8">
        {renderCardGroup(group, 'straightFlush', groupIndex * 5)}
      </div>
    ))}

    {/* Render Four of a Kinds */}
    {groupedHand.fourOfAKinds.map((group, groupIndex) => (
      <div key={`fourOfAKind-${groupIndex}`} className="mr-8">
        {renderCardGroup(group, 'fourOfAKind', groupedHand.straightFlushes.length * 5 + groupIndex * 4)}
      </div>
    ))}

    {/* Render Three of a Kinds */}
    {groupedHand.threeOfAKinds.map((group, groupIndex) => (
      <div key={`threeOfAKind-${groupIndex}`} className="mr-8">
        {renderCardGroup(group, 'threeOfAKind', groupedHand.straightFlushes.length * 5 + groupedHand.fourOfAKinds.length * 4 + groupIndex * 3)}
      </div>
    ))}

    {/* Render Remaining Cards */}
    <div className="mr-8">
      {renderCardGroup(groupedHand.remainingCards, 'remaining', 
        groupedHand.straightFlushes.length * 5 + 
        groupedHand.fourOfAKinds.length * 4 + 
        groupedHand.threeOfAKinds.length * 3)}
    </div>

    {/* "Your Turn" message */}
    {isCurrentPlayer && (
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
          Your Turn!
        </div>
      </div>
    )}
  </div>
);

}