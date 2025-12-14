// Name: Conor Davis
// Student Number: C20441826
// Course: TU856/4
// Module: RWAT
// Work: Assigment 2
// Description: Memory Card Game with Flippable Elements

// Helper Functions for Memory Card Game - Based on original main.js code

// Check for Matching Cards Helper
export function matchingCheckHelper(one, two) 
{
    // Compare Type & Colour
    return (one.getAttribute('type') === two.getAttribute('type') && one.getAttribute('colour') === two.getAttribute('colour'));
}

// Game Over Handler Helper
export function gameOverHelper(clicks, saveGameResult, confirm, reload, delayMs = 1000) 
{

    // Save Game Result
    saveGameResult(clicks);

    // Delay After Last Match
    setTimeout(() => 
    {

        // Prompt to Play Again
        const restartGame = confirm(`Game Over!\n\nYou are victorious with ${clicks} clicks!\n\nDo you want to play again?`);

        // Restart Game if Confirmed
        if (restartGame) { reload(); }

    }, delayMs); // One Second Delay

}