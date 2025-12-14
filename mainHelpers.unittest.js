// Name: Conor Davis
// Student Number: C20441826
// Course: TU856/4
// Module: RWAT
// Work: Assigment 2
// Description: Memory Card Game with Flippable Elements

// Import Jest Globals
import { jest, test, expect } from '@jest/globals';

// Import Helper Functions
import { matchingCheckHelper, gameOverHelper } from './mainHelpers.js';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Unit Test 1: matchingCheckHelper()
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
test('matchingCheckHelper returns true --> when type and colour match', () => 
{
    
    // Test Card Objects --> For getAttribute Testing
    // Card One
    const cardOne = 
    {

        getAttribute: (name) => 
        {   

            // Value Return --> Blue Circle
            if (name === 'type') { return 'circle'; }
            if (name === 'colour') { return 'blue'; }
            // Otherwise --> Return Null
            return null;

        }

    };  

    // Validity Test --> Card Two Same As Card One
    const cardTwoSame = 
    {

        getAttribute: (name) => 
        {

            // Value Return --> Blue Circle --> Same As Card One
            if (name === 'type') { return 'circle'; }
            if (name === 'colour') { return 'blue'; }
            // Otherwise --> Return Null
            return null;

        }

    };

    // Invalidity Test --> Card Two Different From Card One
    const cardTwoDifferent = 
    {

        getAttribute: (name) => 
        {

            // Value Return --> Blue Square --> Not Same As Card One
            if (name === 'type') { return 'square'; }
            if (name === 'colour') { return 'blue'; }
            // Otherwise --> Return Null
            return null;

        }

    };

    // Same Type & Colour --> Return True
    expect(matchingCheckHelper(cardOne, cardTwoSame)).toBe(true);

    // Different Type / Colour --> Return False
    expect(matchingCheckHelper(cardOne, cardTwoDifferent)).toBe(false);

});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Unit Test 2: gameOverHelper()
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
test('gameOverHelper saves result & reloads --> confirm is true', () => 
{
    
    // Fake Times for Timeout
    jest.useFakeTimers();

    // Testing for saveGameResult, confirm & reload
    const saveGameResultTesting = jest.fn();
    const confirmTesting = jest.fn().mockReturnValue(true);
    const reloadTesting = jest.fn();

    // Number of Clicks (20 - 30 Clicks Usually From My Testing)
    const clicks = 30;

    // Call Helper (gameOverHelper)
    gameOverHelper(clicks, saveGameResultTesting, confirmTesting, reloadTesting);

    // Immediately After GameOverHelper Is Called --> saveGameResult Called Once With Click
    expect(saveGameResultTesting).toHaveBeenCalledTimes(1);
    expect(saveGameResultTesting).toHaveBeenCalledWith(clicks);

    // Before Timers --> Confirm / Reload Not Yet Called
    expect(confirmTesting).not.toHaveBeenCalled();
    expect(reloadTesting).not.toHaveBeenCalled();

    // Fast-Forward All Timers --> Test 1000ms Delay
    jest.runAllTimers();

    // Confirm Correct Prompt Called
    expect(confirmTesting).toHaveBeenCalledTimes(1);
    expect(confirmTesting).toHaveBeenCalledWith(`Game Over!\n\nYou are victorious with ${clicks} clicks!\n\nDo you want to play again?`);

    // Confirm Returns True --> Reload Should Be Called Once
    expect(reloadTesting).toHaveBeenCalledTimes(1);

    // Clean --> Restore Real Timers
    jest.useRealTimers();

});