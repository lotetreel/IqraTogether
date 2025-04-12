import React, { useState, useEffect, useCallback } from 'react';
import ReactCardFlip from 'react-card-flip';

// Import images
import AlAziz from '../assets/CardMatchingImages/AlAziz.png';
import AlJabbar from '../assets/CardMatchingImages/AlJabbar.png';
import AlKhaliq from '../assets/CardMatchingImages/AlKhaliq.png';
import AlMalik from '../assets/CardMatchingImages/AlMalik.png';
import AlMuhaymin from '../assets/CardMatchingImages/AlMuhaymin.png';
import AlMumin from '../assets/CardMatchingImages/AlMumin.png';
import AlQuddus from '../assets/CardMatchingImages/AlQuddus.png';
import AlRaheem from '../assets/CardMatchingImages/AlRaheem.png';
import AlRahman from '../assets/CardMatchingImages/AlRahman.png';
import AlSalam from '../assets/CardMatchingImages/AlSalam.png';

// Default emojis if images are not enough
const defaultEmojis = ['😊', '🍎', '🚗', '★', '❤️', '☀️', '🚀', '⭐', '🎈', '🎁', '🎉', '🍕', '🍦', '🎲'];

// Array of imported images
const gameImages = [
    AlAziz, AlJabbar, AlKhaliq, AlMalik, AlMuhaymin,
    AlMumin, AlQuddus, AlRaheem, AlRahman, AlSalam
];

const TileMatchingGame = () => {
    const [difficulty, setDifficulty] = useState(12); // Default: 12 cards (6 pairs)
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [canFlip, setCanFlip] = useState(true);
    const [isGameWon, setIsGameWon] = useState(false);

    const requiredPairs = difficulty / 2;

    const shuffle = useCallback((array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }, []);

    const createBoard = useCallback(() => {
        setMoves(0);
        setMatchedPairs(0);
        setFlippedCards([]);
        setIsGameWon(false);
        setCanFlip(true);

        const availableImages = gameImages.slice(0, requiredPairs);
        const neededEmojis = requiredPairs - availableImages.length;
        const emojisToUse = defaultEmojis.slice(0, neededEmojis);

        const symbols = [...availableImages, ...emojisToUse];
        const gameSymbols = [...symbols, ...symbols];

        const shuffledCards = shuffle(gameSymbols).map((symbol, index) => ({
            id: index,
            symbol: symbol,
            isImage: availableImages.includes(symbol),
            isFlipped: false,
            isMatched: false,
        }));

        setCards(shuffledCards);
    }, [requiredPairs, shuffle]);

    useEffect(() => {
        createBoard();
    }, [difficulty, createBoard]);

    const handleCardClick = (clickedCard) => {
        if (!canFlip || clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) {
            return;
        }

        const updatedCards = cards.map(card =>
            card.id === clickedCard.id ? { ...card, isFlipped: true } : card
        );
        setCards(updatedCards);

        const newFlippedCards = [...flippedCards, clickedCard];
        setFlippedCards(newFlippedCards);

        if (newFlippedCards.length === 2) {
            setCanFlip(false);
            setMoves(prevMoves => prevMoves + 1);
            checkForMatch(newFlippedCards);
        }
    };

    const checkForMatch = (currentFlipped) => {
        const [card1, card2] = currentFlipped;

        if (card1.symbol === card2.symbol) {
            const newMatchedCount = matchedPairs + 1;
            setMatchedPairs(newMatchedCount);
            const updatedCards = cards.map(card =>
                card.symbol === card1.symbol ? { ...card, isMatched: true, isFlipped: true } : card
            );
            setCards(updatedCards);
            setFlippedCards([]);
            setCanFlip(true);

            if (newMatchedCount === requiredPairs) {
                setIsGameWon(true);
            }
        } else {
            setTimeout(() => {
                const updatedCards = cards.map(card =>
                    card.id === card1.id || card.id === card2.id ? { ...card, isFlipped: false } : card
                );
                setCards(updatedCards);
                setFlippedCards([]);
                setCanFlip(true);
            }, 1200);
        }
    };

    const resetGame = () => {
        createBoard();
    };

    const gridCols = Math.ceil(Math.sqrt(difficulty));
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gap: '0.75rem',
        width: '100%',
        maxWidth: '32rem'
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-150px)]">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-dark-text-primary mb-6 text-center">
                Tile Matching Game
            </h1>

            <div className="mb-4">
                <label htmlFor="difficulty" className="mr-2 dark:text-dark-text-secondary">Difficulty:</label>
                <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="input-sm dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                >
                    <option value="8">Easy (4 pairs)</option>
                    <option value="12">Medium (6 pairs)</option>
                    <option value="16">Hard (8 pairs)</option>
                    <option value="20">Expert (10 pairs)</option>
                </select>
            </div>

            <div className="flex justify-around w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 text-gray-700 dark:text-dark-text-secondary text-lg md:text-xl">
                <p>Moves: <span className="font-semibold">{moves}</span></p>
                <p>Matched: <span className="font-semibold">{matchedPairs}</span> / {requiredPairs}</p>
            </div>

            <div id="game-board" style={gridStyle}>
                {cards.map((card) => (
                    <div key={card.id} className="card-container" style={{ aspectRatio: '1 / 1' }}> {/* Apply aspect ratio inline */}
                        {/* Use ReactCardFlip for animation, ensure it fills container */}
                        <ReactCardFlip
                            isFlipped={card.isFlipped}
                            flipDirection="horizontal"
                            containerStyle={{ width: '100%', height: '100%' }} // Force flip container size
                        >
                            {/* Back Face */}
                            <div
                                className={`card-face back ${card.isMatched ? 'matched' : ''}`}
                                onClick={() => handleCardClick(card)}
                                style={{ /* Keep necessary styles like size, bg, etc. */
                                    width: '100%', height: '100%',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    borderRadius: '0.5rem',
                                    background: 'linear-gradient(45deg, #60a5fa, #a78bfa)',
                                    color: 'white', fontSize: '3rem', fontWeight: 'bold',
                                    cursor: card.isFlipped || card.isMatched ? 'default' : 'pointer',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    border: card.isMatched ? '3px solid #4ade80' : 'none'
                                }}
                            >
                                ?
                            </div>

                            {/* Front Face */}
                            <div
                                className={`card-face front ${card.isMatched ? 'matched' : ''}`}
                                onClick={() => handleCardClick(card)} // Keep onClick here too if needed, or handle on container
                                style={{ /* Keep necessary styles */
                                    width: '100%', height: '100%',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#ffffff', // Tailwind bg-white
                                    cursor: 'default', // Front is only visible when flipped/matched
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    border: card.isMatched ? '3px solid #4ade80' : 'none',
                                    overflow: 'hidden' // Ensure image cropping works correctly
                                }}
                            >
                                {card.isImage ? (
                                     <img src={card.symbol} alt="Card" className="object-cover w-full h-full" /> // Use object-cover and fill dimensions
                                ) : (
                                    <span className="text-3xl md:text-4xl lg:text-5xl">{card.symbol}</span>
                                )}
                            </div>
                        </ReactCardFlip>
                    </div>
                ))}
            </div>

            <button
                onClick={resetGame}
                className="mt-6 px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition duration-200"
            >
                Reset Game
            </button>

            {isGameWon && (
                 <div id="message-box" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"> {/* Removed animation classes */}
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 p-8 rounded-xl shadow-2xl text-center text-white max-w-sm mx-auto"> {/* Removed animation classes */}
                        <h2 className="text-3xl font-bold mb-4">You Win! 🎉</h2>
                        <p className="text-xl mb-6">You matched all the cards in <span id="final-moves">{moves}</span> moves!</p>
                        <button
                            onClick={resetGame}
                            className="px-6 py-3 bg-yellow-400 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-75 transition duration-200"
                        >
                            Play Again?
                        </button>
                    </div>
                </div>
            )}

            {/* <style jsx> block removed entirely to fix syntax errors */}
        </div>
    );
};

export default TileMatchingGame;
