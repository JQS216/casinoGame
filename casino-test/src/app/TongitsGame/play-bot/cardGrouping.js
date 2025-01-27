function groupCardsBySuit(cards) {
    return cards.reduce((acc, card) => {
      if (!acc[card.suit]) {
        acc[card.suit] = [];
      }
      acc[card.suit].push(card);
      return acc;
    }, {});
  }
  
  function groupCardsByRank(cards) {
    return cards.reduce((acc, card) => {
      if (!acc[card.rank]) {
        acc[card.rank] = [];
      }
      acc[card.rank].push(card);
      return acc;
    }, {});
  }
  
  function isStraightFlush(cards) {
    if (cards.length < 3) return false;
  
    // Define ranks for standard poker, with Ace appearing twice for edge cases.
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
    // Map card ranks to their indices in the `ranks` array.
    const cardRanks = cards.map(card => ranks.indexOf(card.rank));
    cardRanks.sort((a, b) => a - b); // Sort the indices.
  
    // Check for consecutive indices to determine if it's a straight.
    for (let i = 0; i < cardRanks.length - 1; i++) {
      if (cardRanks[i + 1] !== cardRanks[i] + 1) {
        return false;
      }
    }
  
    return true;
  }
  
  
  export function autoGroupWinningCards(cards, previousGroups = null) {
    let straightFlushes = previousGroups?.straightFlushes || [];
    let fourOfAKinds = previousGroups?.fourOfAKinds || [];
    let threeOfAKinds = previousGroups?.threeOfAKinds || [];
    let remainingCards = [...cards]; // Start with all cards in remainingCards
  
    // Helper function to remove used cards
    const removeUsedCards = (usedCards) => {
      usedCards.forEach(card => {
        const index = remainingCards.findIndex(
          c => c.suit === card.suit && c.rank === card.rank
        );
        if (index !== -1) remainingCards.splice(index, 1);
      });
    };
  
    // Group by suit and detect straight flushes
    const suits = groupCardsBySuit(remainingCards);
    Object.values(suits).forEach(suitCards => {
      suitCards.sort((a, b) => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        .indexOf(a.rank) - ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        .indexOf(b.rank)
      );
  
      for (let i = 0; i < suitCards.length - 2; i++) {
        for (let j = i + 2; j < suitCards.length; j++) {
          const potentialStraightFlush = suitCards.slice(i, j + 1);
          if (isStraightFlush(potentialStraightFlush)) {
            straightFlushes.push(potentialStraightFlush);
            removeUsedCards(potentialStraightFlush);
            i--; // Restart check from current position
            break;
          }
        }
      }
    });
  
    // Group by rank and detect four-of-a-kinds and three-of-a-kinds
    const rankGroups = groupCardsByRank(remainingCards);
  
    Object.values(rankGroups).forEach(rankCards => {
      if (rankCards.length === 4) {
        fourOfAKinds.push(rankCards);
        removeUsedCards(rankCards);
      } else if (rankCards.length === 3) {
        threeOfAKinds.push(rankCards);
        removeUsedCards(rankCards);
      }
    });
  
    // Return grouped hand
    return {
      straightFlushes,
      fourOfAKinds,
      threeOfAKinds,
      remainingCards,
    };
  }
  
  
  