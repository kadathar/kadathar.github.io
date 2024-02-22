// GameLogic.js

import React, { Component } from 'react';
import { GridGenerator, HexGrid, Layout, Path, Text, Hexagon, HexUtils } from 'react-hexgrid';
import './App.css';
import ConfirmationModal from './ConfirmationModal'; // Import the ConfirmationModal component


// Calculate the player's score (number of hexagons they own)
function calculatePlayerScore(currentPlayer, hexagons) {
  return hexagons.reduce((count, hex) => {
    return hex.owner === currentPlayer.id ? count + 1 : count;
  }, 0);
}

// Update the player's score
function updatePlayerScore(players, currentPlayer, playerScore) {
  return players.map(player => {
    if (player.id === currentPlayer.id) {
      return { ...player, score: player.score + playerScore };
    }
    return player;
  });
}

// Check for victory condition (score >= 100)
function checkVictoryCondition(currentPlayer, playerScore) {
  return currentPlayer.score + playerScore >= 100;
}

// Find the next valid player that is not player 0
function findNextPlayerIndex(currentPlayerIndex, players) {
  let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  while (players[nextPlayerIndex].id === 0) {
    nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
  }
  return nextPlayerIndex;
}

// Resets the "moved" status of all units
function resetMovedUnits(hexagons) {
  const updatedHexagons = hexagons.map(hex => {
    return { ...hex, moved: false, attack: false, count: null};
  });
  return updatedHexagons;
}


// Function to check if a hexagon is adjacent to to an enemy unit or surrounded by hexagons with a different owner
function checkSurroundedHexagons(hexagons) {
  const updatedHexagons = hexagons.map(hex => {
    const adjacentHexagons = hexagons.filter(adjHex => {
      if (HexUtils.distance(hex, adjHex) === 1) {
        return adjHex;
      }
      return null;
    });
	
	
   const adjacentHexagons2 = hexagons.filter(adjHex2 => { //this is not being used anymore?
      if (HexUtils.distance(hex, adjHex2) === 2) {
        return adjHex2;
      }
      return null;
 });	  
		
	const adjacentByDifferentPlayer = 
	adjacentHexagons.length > 0 &&
      adjacentHexagons.some(
        adjHex => adjHex.hasUnit && hex.hasUnit && adjHex.owner !== hex.owner
      );	  
	  
	if (!adjacentByDifferentPlayer) {
		hex.adjacent = false;
	}	

  const pushBlock = adjacentHexagons.filter(adjHex => adjHex.hasUnit && hex.hasUnit && hex.owner != adjHex.owner);
 
  for (const pushHex of pushBlock) {
    // Calculate the direction separately for each axis
    const direction = {
      q: pushHex.q - hex.q,
      r: pushHex.r - hex.r,
      s: pushHex.s - hex.s,
    };

    // Calculate the position of the unit behind the adjacent hexagon
    const behindHex = {
      q: pushHex.q + direction.q,
      r: pushHex.r + direction.r,
      s: pushHex.s + direction.s,
    };

    // Find the hexagon at the behindHex position
    const behindHexagon = hexagons.find(hex => HexUtils.equals(hex, behindHex));

	if (behindHexagon == undefined) {	//if behindHex is outside the gameboard, we can push it
		hex.adjacent = true;
		return;
	 } else if(pushHex.hasUnit && !behindHexagon.hasUnit) { 
		 hex.adjacent = true;
		 return;
	 }	else
		 hex.adjacent = false;	 
  }  
	//PUSHBLOCK

    const surroundedByDifferentPlayer =
      adjacentHexagons.length > 5 &&
      adjacentHexagons.every(
        adjHex => adjHex.owner !== 0 && adjHex.owner !== hex.owner && adjHex.owner === adjacentHexagons[0].owner
      );
	  
    if (surroundedByDifferentPlayer) {
      // Find the most common owner among surrounding hexagons
      const owners = adjacentHexagons
        .filter(adjHex => adjHex.owner !== 0)
        .map(adjHex => adjHex.owner);

      const mostCommonOwner = owners
        .reduce(
          (acc, owner) => ({
            ...acc,
            [owner]: (acc[owner] || 0) + 1
          }),
          {}
        );

      const newOwner = parseInt(
        Object.keys(mostCommonOwner).find(owner => mostCommonOwner[owner] === 6) || 0
      );

      // Update the owner to the most common owner
      hex.owner = newOwner;

      if (hex.hasUnit) {
        alert('You made a new friend!');
        // Do any necessary actions when a unit is present
      } else {
        // Handle when there's no unit
        alert('You made a new friend!');
        hex.hasUnit = true;
      }
    }
	
    return hex;
  });

  return updatedHexagons;
}

export{
  calculatePlayerScore,
  updatePlayerScore,
  checkVictoryCondition,
  findNextPlayerIndex,
  resetMovedUnits,
  checkSurroundedHexagons
};
