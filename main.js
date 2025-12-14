// Name: Conor Davis
// Student Number: C20441826
// Course: TU856/4
// Module: RWAT
// Work: Assigment 2
// Description: Memory Card Game with Flippable Elements

// Function Imports from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase Configuration
// JS SDK v7.20.0 & Later
const firebaseConfig = 
{
    apiKey: "AIzaSyDeHx882cAKs0ZeQyqGDR3miC2tcbfv4xM",
    authDomain: "rwat-assignment2-89c49.firebaseapp.com",
    projectId: "rwat-assignment2-89c49",
    storageBucket: "rwat-assignment2-89c49.firebasestorage.app",
    messagingSenderId: "272312402822",
    appId: "1:272312402822:web:19e362fb20391f01dca207",
    measurementId: "G-XV7R4NMBNH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Import Untouched ShapeCard Element
import { ShapeCard } from './shapecard.js';
// Import Helpers (Used in Unit Testing)
import { matchingCheckHelper, gameOverHelper } from './mainHelpers.js';

// ~~~~~~~~~~~~
// Game Element
// ~~~~~~~~~~~~
class Game extends HTMLElement 
{

    // ~~~~~~~~~~~~~~~~
    // Game Constructor
    // ~~~~~~~~~~~~~~~~
    constructor() 
    {

        // Game State
        // Call Superclass
        super();
        // Card One
        this.cardOne = null;
        // Card Two
        this.cardTwo = null;
        // Maximum Pairs
        this.maximumPairs = 0;
        // Matching Pairs Counter
        this.matchingPairs = 0;
        // Click Counter
        this.clicks = 0;

    }

    // Called when <game-mem> is added to the DOM
    connectedCallback() 
    {

        // Clear Inner HTML
        this.innerHTML = '';

        // Accessibility Navigation Message --> Appear First
        const accNav = document.createElement('p');
        accNav.id = 'accNavCurrent';
        accNav.textContent = 'Welcome to the Memory Card Game!';
        accNav.setAttribute('aria-live','polite');
        accNav.setAttribute('role','status');
        // Accesibility Navigation Message Styling --> Centering & Small Margin
        accNav.style.textAlign = 'center';
        // Append
        this.appendChild(accNav);
        
        // Initialise Game --> Appear In Middle
        this.initializeGame();
        
        // Button Container --> Appear Last
        const buttonContainer = document.createElement('div');
        // Button Container Styling --> Centering & Small Margin
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.marginTop = '1vh';
        // Button Container Accessibility
        buttonContainer.setAttribute('aria-label', 'Button Area.');

        // Button Initialization
        const viewAvgClicksButton = document.createElement('button');
        viewAvgClicksButton.id = "viewAvgClicksButton";
        viewAvgClicksButton.textContent = "View Average Clicks";
        // Button Accessibility
        viewAvgClicksButton.type = 'button';
        viewAvgClicksButton.setAttribute('aria-label','View Average Clicks To Finish Game.');

        // Button Output
        const viewAvgClicksOutput = document.createElement('p');
        viewAvgClicksOutput.id = "viewAvgClicksOutput";
        // Button Output Styling --> Small Margin
        viewAvgClicksOutput.style.marginTop = '1vh';
        // Button Output Accessibility
        viewAvgClicksOutput.setAttribute('aria-live','polite');

        // Append Button & Output to Container
        buttonContainer.appendChild(viewAvgClicksButton);
        buttonContainer.appendChild(viewAvgClicksOutput);
        this.appendChild(buttonContainer);

        // Button Event Listener
        viewAvgClicksButton.addEventListener('click', () => this.viewAverageClicks());

    }

    // ~~~~~~~~~~~~~~~~~~~
    // Game Initialization
    // ~~~~~~~~~~~~~~~~~~~
    initializeGame() 
    {

        // Get Game Size Attribute
        const gameSize = this.getAttribute('size');
        // Parse Game Size Attribute
        const [rowString, columnString] = gameSize.split('x').map(s => s.trim());
        // Convert to Numbers
        const row = Number(rowString);
        const col = Number(columnString);
        // Calculate Product (Total Cards)
        const product = row * col;
        // Calculate Maximum Pairs (half of Total Cards)
        this.maximumPairs = product / 2;

        // Create Game Container
        const gameContainer = document.createElement('p');
        // Game Container Styling --> Grid Layout
        gameContainer.style.display = 'inline-grid';
        gameContainer.style.gridTemplateColumns = `repeat(${col}, 100px)`;
        gameContainer.style.gridTemplateRows = `repeat(${row}, 100px)`;
        gameContainer.style.gap = '2vh 2vw';
        // Game Container Accessibility
        gameContainer.setAttribute('role','grid');
        gameContainer.setAttribute('aria-label', 'Memory Card Game Grid');
        gameContainer.setAttribute('aria-rowcount', row);
        gameContainer.setAttribute('aria-colcount', col);

        // Initialize Cards
        gameContainer.innerHTML = ShapeCard.getUniqueRandomCardsAsHTML(this.maximumPairs, true);

        // Append Game Container To Game Element
        this.appendChild(gameContainer);
        // Game Element Styling --> Centering
        this.style.display = 'block';
        this.style.width = 'fit-content';
        this.style.margin = '2vh auto 2vh';

        // Reset Game State
        this.cardOne = null;
        this.cardTwo = null;
        this.matchingPairs = 0;
        this.clicks = 0;

        // Old Code: Event Listeners for Card Clicks
        // gameContainer.querySelectorAll('shape-card').forEach(card => { card.addEventListener('click', () => this.gameLogic(card));});

        // Event Listeners for Card Clicks (Added Keyboard Support)
        gameContainer.querySelectorAll('shape-card').forEach((card, index) => 
        { 
        
            // Keyboard Functionality --> Navigate with Tab & Shift + Tab
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-pressed', 'false');
            card.setAttribute('aria-disabled', 'false');

            // Accessibility Label
            card.setAttribute('aria-label', `Card: Unknown`);

            // Mouse Click Check
            card.addEventListener('click', () => this.gameLogic(card));

            // Enter Key & Spacebar Functionality
            card.addEventListener('keydown', (event) => 
            {

                // If Enter / Spacebar Hit
                if (event.key === 'Enter' || event.key === ' ') 
                {

                    // Event Handler --> Avoid Default Action Being Taken (Default Key Associated Behavior --> Scrolling with Spacebar)
                    // https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
                    event.preventDefault();

                    // Call Game Logic --> Pass Card
                    this.gameLogic(card);

                }

            });

        });

    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~
    // Firebase Async Functions
    // ~~~~~~~~~~~~~~~~~~~~~~~~~

    // Save Game Result to Firestore
    async saveGameResult(clicks) 
    {

        // Attempt to Save Game Result
        try 
        {

            // Add Document to Collection
            await addDoc(collection(db, "game-results-data"), { clicks: clicks, completedAt: serverTimestamp() });
            // Success Message
            console.log("Game Result Saved Successfully!");

        } 

        // Error Handling
        catch (err) 
        {

            // Failure Message
            console.error("Error Saving! Message:", err);

        }

    }

    // Calculate and display average clicks using Firestore data
    async viewAverageClicks() 
    {

        // Attempt to Read Game Results
        try 
        {

            // Get All Game Results from Firestore
            const getGameResults = await getDocs(collection(db, "game-results-data"));

            // Define Variables for Calculation
            let clicksTotal = 0;
            let N = 0;

            // Iterate Through Game Results
            getGameResults.forEach(doc => 
            {

                // Get Documented Data
                const data = doc.data();

                // If Valid Clicks Data (Clicks Counter)
                if (typeof data.clicks === "number") 
                {

                    // Add to total clicks across games
                    clicksTotal += data.clicks;
                    // Increment Counter
                    N++;

                }

            });

            // Get Output Element
            const viewAverageClicksOutput = this.querySelector("#viewAvgClicksOutput");

            // No Completed Games Check
            if (N == 0) 
            {

                // No Completed Games
                viewAverageClicksOutput.textContent = "No Games Completed.";
                return;

            }

            // Calculate Average Clicks
            const clicksAverage = clicksTotal / N;
            // Display Average Clicks
            viewAverageClicksOutput.textContent = `Average Clicks for Completion: ${clicksAverage.toFixed(2)} (${N} Games Recorded)`;

        } 

        // Error Handling
        catch (err) 
        {

            // Failure Message
            console.error("Error Reading! Message:", err);
            // Get Output Element
            const viewAverageClicksOutput = this.querySelector("#viewAvgClicksOutput");
            // Display Error Message
            viewAverageClicksOutput.textContent = "Error! Could not load data from Firestore.";
        
        }

    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~
    // Original Helper Functions
    // ~~~~~~~~~~~~~~~~~~~~~~~~~

    // Old Code: Check For Matching Cards
    // matchingCheck(one, two) 
    // {

        // Compare Type & Colour
        // return (one.getAttribute('type') === two.getAttribute('type') && one.getAttribute('colour') === two.getAttribute('colour'));

    // }

    // Old Code: Game Over Handler
    // gameOver() 
    // {
        
        // Save Game Result
        // this.saveGameResult(this.clicks);

        // Delay After Last Match
        // setTimeout(() => 
        // {

            // Prompt to Play Again
            // const restartGame = confirm(`Game Over!\n\nYou are victorious with ${this.clicks} clicks!\n\nDo you want to play again?`);
            // Restart Game if Confirmed
            // if (restartGame) { window.location.reload(); }

        // }, 1000); // One Second Delay

    // }

    // ~~~~~~~~~~~~~~~~
    // New Helper Functions
    // ~~~~~~~~~~~~~~~~

    // Refactored Helper Function Calls (from mainHelpers.js)
    // Check For Matching Cards
    matchingCheck(one, two) 
    {
        return matchingCheckHelper(one, two);
    }

    // Game Over Handler
    gameOver() 
    {
        gameOverHelper(this.clicks, this.saveGameResult.bind(this), confirm, () => window.location.reload());
    }

    // ~~~~~~~~~~~~~~~~~~~~
    // Accessibility Helper
    // ~~~~~~~~~~~~~~~~~~~~

    // Update Accessibility Navigation Text
    accessibilityStatusHelper(message)
    {

        // Get Current Accessibility Navigation Message
        const updateAccNav = this.querySelector('#accNavCurrent');
        // Update With Newly Passed Message
        if (updateAccNav && typeof message === 'string') { updateAccNav.textContent = message };

    }

    // ~~~~~~~~~~
    // Game Logic
    // ~~~~~~~~~~
    gameLogic(card) 
    {

        // Ignore --> Already Matched Card
        if (card.dataset.matched === 'true') return;

        // Ignore --> Same Card Clicked Twice
        if (card === this.cardOne) return;

        // Ignore --> Two Cards Already Selected
        if (this.cardTwo) return;

        // Count Clicker Increment
        this.clicks++;

        // Flip Card
        card.flip();

        // First Card Check
        if (!this.cardOne) 
        {

            // Set First Card
            this.cardOne = card;

            // Accessibility --> Card Selection
            this.accessibilityStatusHelper('First Card Selected. Select Another Card To Try & Match.')
            // Card Accessibility Labels --> Get Shape & Colour
            const type = card.getAttribute('type') || 'shape';
            const colour = card.getAttribute('colour') || 'colour';
            // Card Accessibility Labels --> Capitalize
            const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
            const typeC = cap(type);
            const colourC = cap(colour);
            // Card Accessibility Labels --> Set Label
            card.setAttribute('aria-label', `Card: ${colourC} ${typeC}`);

            // Continue
            return;

        }

        // Second Card
        this.cardTwo = card;

        // Card Accessibility Labels --> Get Shape & Colour
        const type = card.getAttribute('type') || 'shape';
        const colour = card.getAttribute('colour') || 'colour';
        // Card Accessibility Labels --> Capitalize
        const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        const typeC = cap(type);
        const colourC = cap(colour);
        // Card Accessibility Labels --> Set Label
        card.setAttribute('aria-label', `Card: ${colourC} ${typeC}`);

        // Matching Cards
        if (this.matchingCheck(this.cardOne, this.cardTwo)) 
        {

            // Set As Matched
            this.cardOne.dataset.matched = 'true';
            this.cardTwo.dataset.matched = 'true';

            // Accessibility --> Mark As Pressed / Disabled
            this.cardOne.setAttribute('aria-pressed','true');
            this.cardTwo.setAttribute('aria-pressed','true');
            this.cardOne.setAttribute('aria-disabled','true');
            this.cardTwo.setAttribute('aria-disabled','true');
            // Accessibility --> Match Found
            this.accessibilityStatusHelper('You Have Found A Match! Onto The Next Pair!')

            // Increment Matching Pairs Counter
            this.matchingPairs++;

            // Reset Selection
            this.cardOne = null;
            this.cardTwo = null;

            // Game Over Check --> Matching Pairs == Total Pairs
            if (this.matchingPairs === this.maximumPairs) 
            {

                // Accessibility --> Game Is Ending
                this.accessibilityStatusHelper('You Have Won!\n\nA Popup Will Appear.')
                // Trigger Game Over
                this.gameOver();
                
            }

        } 

        // Not Matching Cards
        else 
        {

            // Accessibility --> Match Not Found
            this.accessibilityStatusHelper('You Have Found No Match - The Cards Will Now Reset.')

            // Flip Back After Delay
            setTimeout(() => 
            {

                // Accessibility --> Reset Pressed Key
                this.cardOne.setAttribute('aria-pressed','false');
                this.cardTwo.setAttribute('aria-pressed','false');
                // Accessibility --> Reset Labels
                this.cardOne.setAttribute('aria-label', `Card: Unknown`);
                this.cardTwo.setAttribute('aria-label', `Card: Unknown`);

                // First Card
                this.cardOne.flip();
                // Second Card
                this.cardTwo.flip();

                // Reset Selection
                this.cardOne = null;
                this.cardTwo = null;

            }, 500); // Half Second Delay
        }

    }
}

// Custom Game Element Definition
customElements.define('game-mem', Game);
