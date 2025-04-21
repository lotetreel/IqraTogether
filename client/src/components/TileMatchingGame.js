import React, { useState, useEffect, useCallback } from 'react'; // Removed useRef
import ReactCardFlip from 'react-card-flip';
import Particles, { initParticlesEngine } from "@tsparticles/react"; // Updated import
import { loadConfettiPreset } from "@tsparticles/preset-confetti"; // Import confetti preset
import { tsParticles } from "@tsparticles/engine"; // Import base engine
// Removed Plus, Minus icons

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

const gameImages = [
    AlAziz, AlJabbar, AlKhaliq, AlMalik, AlMuhaymin,
    AlMumin, AlQuddus, AlRaheem, AlRahman, AlSalam
];

// Default emojis if images are not enough
const defaultEmojis = ['😊', '🍎', '🚗', '★', '❤️', '☀️', '🚀', '⭐', '🎈', '🎁', '🎉', '🍕', '🍦', '🎲'];

const TileMatchingGame = () => {
    const [init, setInit] = useState(false);
    // Removed particlesContainerRef

    // this should be run only once per application lifetime
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            // console.log("Initializing particles engine");
            await loadConfettiPreset(engine); // Load confetti preset
            // console.log("Confetti preset loaded");
        }).then(() => {
            // console.log("Particles engine initialized");
            setInit(true);
        });
    }, []);


    // Removed particlesLoaded callback

    // Options for the confetti preset - transparent bg, wider spread
    const particlesOptions = {
        preset: "confetti", // Use confetti preset
        background: {
            opacity: 0 // Ensure background is transparent
        },
        particles: {
            number: {
                value: 100 // Particle count
            },
            life: { // Increase particle lifespan yet again
                duration: 15, // Particles last for 15 seconds (13 + 2)
                count: 1 // Each particle lives once
            },
            move: { // Ensure gravity makes them fall down
                gravity: {
                    enable: true,
                    acceleration: 9.81 // Standard gravity
                },
                decay: 0.05 // Slow down slightly over time
            }
        },
        emitters: { // Configure the emitter for wider spread
            position: {
                x: 50, // Center horizontally
                y: 0   // Start from the top
            },
            life: { // Ensure emitter only fires once
                count: 1,
                duration: 0.1, // Emit for a very short duration
                delay: 0.1
            },
            rate: {
                quantity: 100 // Emit all particles at once
            },
            size: {
                width: 100, // Spread across the full width
                height: 0
            },
            spread: 90 // Increase spread angle (default might be smaller)
        }
    }; // Correctly closed the object


    const [difficulty, setDifficulty] = useState(12); // Default: 12 cards (6 pairs)
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [canFlip, setCanFlip] = useState(true);
    const [isGameWon, setIsGameWon] = useState(false);
    const [celebrationCardSymbol, setCelebrationCardSymbol] = useState(null);
    const [showCelebrationPopup, setShowCelebrationPopup] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false); // Combined state for fade-out
    // Removed card size state

    // Removed useEffect for pausing particles

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

            // Show celebration popup
            setCelebrationCardSymbol(card1.symbol);
            setShowCelebrationPopup(true);
            setIsFadingOut(false); // Reset fade state

            // Synchronized fade-out timers - Further Adjusted duration
            const displayDuration = 6000; // 8s previous - 2s reduction = 6000ms
            const fadeDuration = 500; // 0.5s fade

            setTimeout(() => {
                setIsFadingOut(true); // Start fading after extended display duration
            }, displayDuration);
            // Hide popup after fade completes
            setTimeout(() => {
                setShowCelebrationPopup(false);
                setCelebrationCardSymbol(null);
            }, displayDuration + fadeDuration); // Total time = 6.5s

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

    // Calculate grid columns dynamically based on difficulty
    const gridCols = Math.ceil(Math.sqrt(difficulty));

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
                {/* Removed Card Size Controls */}
            </div>

            <div className="flex justify-around w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 text-gray-700 dark:text-dark-text-secondary text-lg md:text-xl">
                <p>Moves: <span className="font-semibold">{moves}</span></p>
                <p>Matched: <span className="font-semibold">{matchedPairs}</span> / {requiredPairs}</p>
            </div>

            {/* Responsive Grid: Fixed large size */}
            <div
                id="game-board"
                className="grid w-full px-1 lg:max-w-4xl xl:max-w-5xl gap-6 lg:gap-8" // Fixed large size & gaps
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
                {cards.map((card) => (
                    // Use aspect-square for consistent tile shape
                    <div key={card.id} className="card-container aspect-square">
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
                                     <img src={card.symbol} alt="Card" className="object-cover w-full h-full" />
                                ) : (
                                    // Fixed large emoji size
                                    <span className="text-7xl md:text-8xl lg:text-9xl"> {/* Fixed large text size */}
                                        {card.symbol}
                                    </span>
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

            {/* Celebration Popup with Fireworks */}
            {init && showCelebrationPopup && celebrationCardSymbol && ( // Only render if engine is initialized and popup should be shown
                // Overlay background with synchronized fade-out transition
                <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black transition-opacity duration-500 ease-in-out ${isFadingOut ? 'bg-opacity-0' : 'bg-opacity-60'}`}>
                    {/* Confetti Container - Conditionally render based on !isFadingOut */}
                    {!isFadingOut && (
                        <Particles
                            // Removed key prop
                            id="tsparticles-celebration"
                            // Removed loaded prop
                            options={particlesOptions}
                            // Removed fade class
                            style={{
                                position: 'absolute',
                                top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 51
                        }}
                        />
                    )}
                    {/* Card Container - Apply fade based on isFadingOut */}
                    <div className={`relative z-[52] bg-white dark:bg-dark-bg-secondary p-4 rounded-lg shadow-xl max-w-xs w-full aspect-square flex items-center justify-center transform scale-100 pointer-events-auto transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}> {/* Card fade class (500ms) */}
                        {gameImages.includes(celebrationCardSymbol) ? (
                            <img src={celebrationCardSymbol} alt="Matched Card" className="object-contain max-w-full max-h-full" />
                        ) : (
                            <span className="text-8xl md:text-9xl lg:text-[10rem]"> {/* Even larger emoji */}
                                {celebrationCardSymbol}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* <style jsx> block removed entirely to fix syntax errors */}
        </div>
    );
};

export default TileMatchingGame;
