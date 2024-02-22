/* src/HexagonalGrid.js */

import React, { Component } from 'react';
import { GridGenerator, HexGrid, Layout, Path, Text, Hexagon, HexUtils } from 'react-hexgrid';
import './App.css';
import ConfirmationModal from './ConfirmationModal'; // Import the ConfirmationModal component
import { calculatePlayerScore, updatePlayerScore, checkVictoryCondition, findNextPlayerIndex, resetMovedUnits, checkSurroundedHexagons} from './GameLogic';

class App extends Component {
  constructor(props) {
    super(props);

    // Define player representations
this.players = [
  { id: 0, name: "Player 0", color: "grey", shape: "circle", points: 0, score: 0 },
  { id: 1, name: "Player 1", color: "blue", shape: "circle", points: 0, score: 0 },
  { id: 2, name: "Player 2", color: "red", shape: "circle",  points: 0,  score: 0 },
];
    
    // Create hexagons and assign them to players
    const hexagons = GridGenerator.hexagon(3).map(hex => ({
      ...hex,
      //owner: Math.random() < 0.5 ? 1 : 2, // Assign to player 1 or 2 - MODE 1 RANDOM
	  owner: hex.r === -3 ? 1 : hex.r === 3 ? 2 : 0, // Assign ownership based on row number - MAIN MODE
      //hasUnit: Math.random() < 0.2, // Adjust the probability as needed - MODE 1 RANDOM
	  hasUnit: hex.r === -3 ? true : hex.r === 3 ? true : false, // Assign ownership based on row number - MAIN MODE
      moved: false,
      attack: false,
	  pushed: null,
	  adjacent: null,
	  count: 0,
    }));

    this.state = {
      hexagons,
      path: { start: null, end: null },
      highlightedHexagons: [],
      currentPlayer: this.players[1], // Start with the first player
      selectedUnit: null,
      selectedUnitPosition: null,
      selectedHex: null,
	  isModalOpen: false,
      isModalShownThisTurn: false,  // Track if the modal was shown this turn
	  displayMode: 'score', //default display mode
    };
  }



  onClick(event, source) {
    const { path, hexagons, selectedUnit, currentPlayer, selectedHex} = this.state;
    const targetHex = source.state.hex;
	
	
    // Clear previous path or selection
    if (path.start == null) {
      path.start = source.state.hex;
    } else {
      path.start = null;
      path.end = null;
    }
				
		
    const clickedHex = hexagons.find(hex => HexUtils.equals(hex, targetHex));
    const isUnitHex = clickedHex && clickedHex.hasUnit;
	this.setState({ selectedHex: null});

    // Movement Logic
    if (isUnitHex && clickedHex.owner === currentPlayer.id) {
      // If the clicked hexagon has a unit and the unit belongs to the current player
	  this.setState({ selectedHex: clickedHex });
      if (!clickedHex.moved) {
        this.setState({
          selectedUnit: clickedHex,
          selectedUnitPosition: targetHex,
        });
      } else {
        this.setState({
          selectedUnit: clickedHex,
          selectedUnitPosition: targetHex,
        });
      }
    } else if (selectedUnit && this.isHighlightedHex(targetHex) && !clickedHex.hasUnit ){
      // If a unit is selected and a highlighted hexagon is clicked, move the unit or attack
      this.moveUnit(selectedUnit, targetHex);
	  this.setState({ selectedHex: clickedHex});
    } else if (this.isHighlightedHex(targetHex)) { 
      this.moveUnit(selectedHex, clickedHex);
    }

    // Highlight Controller
    if (!clickedHex.moved && clickedHex.owner === currentPlayer.id) {
      // Calculate highlighted hexagons that are exactly 2 hexagon distances away only if it's a unit hex
      const highlightedHexagons = isUnitHex
        ? hexagons.filter(hex => {
          const distance = HexUtils.distance(targetHex, hex);
          return distance <= 2 && !hex.hasUnit;
        })
        : [];
      this.setState({ path, highlightedHexagons });
    } else {
      this.setState({ path, highlightedHexagons: [] });
    }

    if (clickedHex.moved && !clickedHex.attack && clickedHex.hasUnit && clickedHex.adjacent) {
      // Calculate highlighted hexagons that are exactly 1 hexagon distance away only if it's a unit hex
      this.highlightAttackableTiles(targetHex, currentPlayer, hexagons);
    }
	
// OnClick Adjacent Logic: Highlight tiles for movement and attack
if (isUnitHex && !clickedHex.moved && clickedHex.owner === currentPlayer.id) {
  const adjacentEnemyHexagons = hexagons.filter(hex => {
    const distance = HexUtils.distance(targetHex, hex);
    return distance === 1 && hex.hasUnit && hex.owner !== currentPlayer.id;
  });

  if (adjacentEnemyHexagons.length > 0) {
    const highlightedHexagons = hexagons.filter(hex => {
      const distance = HexUtils.distance(targetHex, hex);
      return distance === 1 && (hex.hasUnit && hex.owner) !== currentPlayer.id;
    });
	

	
	  // Check if there is a unit behind the target hexagon that can be pushed
  const hasPushableUnit = highlightedHexagons.filter(hex => {
    const direction = {
      q: hex.q - targetHex.q,
      r: hex.r - targetHex.r,
      s: hex.s - targetHex.s
    };
	
	
	
	    // Check if the direction is valid for pushing (q, r, or s is -1, 0, or 1)
    if (Math.abs(direction.q) <= 1 && Math.abs(direction.r) <= 1 && Math.abs(direction.s) <= 1) {
      const behindHex = {
        q: hex.q + direction.q,
        r: hex.r + direction.r,
        s: hex.s + direction.s
      };
  
      // Find the hexagon at the behindHex position
      const behindHexagon = hexagons.find(hex => HexUtils.equals(hex, behindHex));
	  
	  const pushUnit = hexagons.find(hex => HexUtils.equals(hex, direction));
	  
	
	  
	  if(behindHexagon == undefined){
		 
		  return hex;
	  }
	   else if(!behindHexagon.hasUnit){  
	   
		return hex;
	  } else if(!hex.hasUnit && !behindHex.hasUnit){
		
		return hex;
	}
    }
	
	});

    this.setState({ highlightedHexagons : hasPushableUnit });	
	
	
  } else {
    const highlightedHexagons = hexagons.filter(hex => {
      const distance = HexUtils.distance(targetHex, hex);
      return distance <= 2 && !hex.hasUnit;
    });

    this.setState({ path, highlightedHexagons });
  }
}	
  } //on click ends


  
  // Highlights hexagons that can be attacked
  highlightAttackableTiles(targetHex, currentPlayer, hexagons) {
    const highlightedHexagons = hexagons.filter(hex => {
      const distance = HexUtils.distance(targetHex, hex);
      return distance === 1 && hex.hasUnit && hex.owner !== currentPlayer.id;
    });

	
	  // Check if there is a unit behind the target hexagon that can be pushed
  const hasPushableUnit = highlightedHexagons.filter(hex => {
    const direction = {
      q: hex.q - targetHex.q,
      r: hex.r - targetHex.r,
      s: hex.s - targetHex.s
    };
	    // Check if the direction is valid for pushing (q, r, or s is -1, 0, or 1)
    if (Math.abs(direction.q) <= 1 && Math.abs(direction.r) <= 1 && Math.abs(direction.s) <= 1) {
      const behindHex = {
        q: hex.q + direction.q,
        r: hex.r + direction.r,
        s: hex.s + direction.s
      };
  
      // Find the hexagon at the behindHex position
      const behindHexagon = hexagons.find(hex => HexUtils.equals(hex, behindHex));
	  
	  const pushUnit = hexagons.find(hex => HexUtils.equals(hex, direction));
	  
	  if(behindHexagon == undefined){
		  return pushUnit;
	  }
	   else if(!behindHexagon.hasUnit){  
		return pushUnit;
	  } 
    }		
	});

    this.setState({ highlightedHexagons : hasPushableUnit });	
	
  }
  

  // Checks if a hexagon is highlighted
  isHighlightedHex(hex) {
    const { highlightedHexagons } = this.state;
    return highlightedHexagons.some(highlightedHex => HexUtils.equals(hex, highlightedHex));
  }
  
  // Movement and Attack Mechanics
  moveUnit(unitHex, targetHex) {
    const { hexagons, currentPlayer, selectedUnit, selectedHex } = this.state;
	
    // If the selected unit has not moved yet, move it
    if (!unitHex.moved && !targetHex.hasUnit ) {
      unitHex.hasUnit = false;
      
      // Update the target hexagon to have a unit and mark it as moved
      const targetIndex = hexagons.findIndex(hex => HexUtils.equals(hex, targetHex));
      if (targetIndex !== -1) {
        hexagons[targetIndex].hasUnit = true;
        hexagons[targetIndex].moved = true;
        hexagons[targetIndex].attack = false;
        hexagons[targetIndex].owner = currentPlayer.id; // Update the owner to the current player's id
      }
    }  else{ //Otherwise we can only push the unit
		
      this.pushUnit(unitHex, targetHex, hexagons, currentPlayer);
	  

	}
    this.setState({
      selectedUnit: null,
      selectedUnitPosition: null,
      hexagons: [...hexagons],
      highlightedHexagons: [],
    });
	
	const updatedHexagons = checkSurroundedHexagons(this.state.hexagons);	 
  }
 
// Calculate the direction for nudge animation
calculateDirection(sourceHex, targetHex) {
  const qDiff = targetHex.q - sourceHex.q;
  const rDiff = targetHex.r - sourceHex.r;

  if (qDiff > 0 && rDiff === 0) {
    return 'East';
  } else if (qDiff < 0 && rDiff === 0) {
    return 'West';
  } else if (qDiff === 0 && rDiff > 0) {
    return 'SE';
  } else if (qDiff === 0 && rDiff < 0) {
    return 'NW';
  } else if (qDiff > 0 && rDiff < 0) {
    return 'NE';
  } else if (qDiff < 0 && rDiff > 0) {
    return 'SW';
  }

  // Handle other cases if needed

  return 'unknown';
}

 
// PUSH LOGIC
pushUnit(sourceHex, targetHex, hexagons, currentPlayer) {
  const sourceIndex = hexagons.findIndex(hex => HexUtils.equals(hex, sourceHex));
  const targetIndex = hexagons.findIndex(hex => HexUtils.equals(hex, targetHex));
  

  if (sourceIndex !== -1 && targetIndex !== -1) {
    // Check if the target hex is empty
    if (hexagons[targetIndex].hasUnit) {
      // Calculate the direction of the push
      const direction = {
        q: targetHex.q - sourceHex.q,
        r: targetHex.r - sourceHex.r,
        s: targetHex.s - sourceHex.s
      };

      // Calculate the new position for the target unit
      const newTargetHex = {
        q: targetHex.q + direction.q,
        r: targetHex.r + direction.r,
        s: targetHex.s + direction.s
      };

		const newTargetIndex = hexagons.findIndex(hex => HexUtils.equals(hex, newTargetHex));
	  
	      // Check if the target hex is outside the game board
		const newTargetOutsideBoard = newTargetHex.q < -3 || newTargetHex.q > 3 || newTargetHex.r < -3 || newTargetHex.r > 3 || newTargetHex.s < -3 || newTargetHex.s > 3;
  


      if (newTargetIndex !== -1 && !hexagons[newTargetIndex].hasUnit) {
        // Move the target unit to the new position
        hexagons[newTargetIndex].hasUnit = true;
        hexagons[newTargetIndex].moved = false;
        hexagons[newTargetIndex].attack = true; // or whatever the appropriate attack status is
        hexagons[newTargetIndex].owner = hexagons[targetIndex].owner;
		hexagons[newTargetIndex].count = hexagons[targetIndex].count + 1;
		currentPlayer.score = currentPlayer.score + hexagons[targetIndex].count + 1;
	

        // Clear the target hex
        hexagons[targetIndex].hasUnit = false;
        hexagons[targetIndex].moved = true;
        hexagons[targetIndex].attack = false;
		hexagons[targetIndex].count = null;

        // Update the owner to the current player's id
        hexagons[targetIndex].owner = 0;
		
		//Update source unit so they can no longer push or move if push was successful
		sourceHex.attack = true;
		sourceHex.moved = true;
	

    // Clear the highlighted hexagons and selectedHex
    this.setState({
      highlightedHexagons: [],
      selectedHex: null  // Clear the selectedHex when a push occurs
    });
	
  // Calculate the direction for nudge animation target
hexagons[newTargetIndex].pushed = this.calculateDirection(sourceHex, targetHex);

// Calculate the direction for the nudge animation source
sourceHex.pushed = 's' + this.calculateDirection(sourceHex, targetHex);
 

// Reset the pushed class after 500 milliseconds (adjust the duration as needed)
setTimeout(() => {
	
	hexagons[newTargetIndex].pushed = null;
	sourceHex.pushed = null;
	this.setState({ hexagons: [...hexagons] }); // Update the state to re-render with the updated hexagons
}, 500); // Adjust the duration (in milliseconds) as needed
			
        // Clear the highlighted hexagons
        this.setState({
          selectedUnit: null,
          selectedUnitPosition: null,
          hexagons: [...hexagons],
          highlightedHexagons: [],
        });
		
		
      } else if (newTargetOutsideBoard) {
		//alert('Cannot push. Target position is outside board.');
		
		//removal + animation here

		
		//Update source unit so they can no longer push or move if push was successful
		sourceHex.attack = true;
		sourceHex.moved = true;

  // Calculate the direction for nudge animation target
hexagons[targetIndex].pushed = 'f' + this.calculateDirection(sourceHex, targetHex);		
		// Calculate the direction for the nudge animation source
sourceHex.pushed = 's' + this.calculateDirection(sourceHex, targetHex);
		
		// Reset the pushed class after 500 milliseconds (adjust the duration as needed)
setTimeout(() => {
	
	
	
		        // Clear the target hex
        hexagons[targetIndex].hasUnit = false;
        hexagons[targetIndex].moved = true;
        hexagons[targetIndex].attack = false;
	
	hexagons[targetIndex].pushed = null;
	sourceHex.pushed = null;
	
	if(!hexagons[targetIndex].count){
		hexagons[targetIndex].count = 2;
	} else hexagons[targetIndex].count = (hexagons[targetIndex].count)*2;
	

	currentPlayer.score = currentPlayer.score + hexagons[targetIndex].count;

	
	// Update the owner to the current player's id
        hexagons[targetIndex].owner = 0;
	const updatedHexagons = checkSurroundedHexagons(this.state.hexagons); // included here because it is not working under the move function when pushed off the edge
	
	this.setState({ hexagons: [...hexagons] }); // Update the state to re-render with the updated hexagons
}, 1000); // Adjust the duration (in milliseconds) as needed
			
        // Clear the highlighted hexagons
        this.setState({
          selectedUnit: null,
          selectedUnitPosition: null,
          hexagons: [...hexagons],
          highlightedHexagons: [],
        });
			
      } else {
		alert('Cannot push. Target position is occupied');  
	  }
    } 
  } 
}

   // Function to check if the current player has any valid moves or attacks
hasValidActions() {
    const { hexagons, players, currentPlayer} = this.state;
	
	  const playerTileCounts = {};

  // Calculate the tile count for each player
  hexagons.forEach(hex => {
    const owner = hex.owner;
    if (owner !== null) {
      if (!playerTileCounts[owner]) {
        playerTileCounts[owner] = 0;
      }
      playerTileCounts[owner]++;
    }
  });

 currentPlayer.points = playerTileCounts[currentPlayer.id] + currentPlayer.score;
	
	
	const hasVictory = currentPlayer.points >= 40;

    // Check if the currentPlayer has any valid moves or attacks
    const hasValidMoves = hexagons.some(hex => hex.owner === currentPlayer.id && hex.hasUnit && !hex.moved);

    // Check if the currentPlayer has any valid attacks
    const hasValidAttacks = hexagons.some(
      hex =>
        hex.owner === currentPlayer.id && hex.hasUnit &&
        !hex.attack && hex.adjacent
        
    );
	

	
	
      

	if(hasVictory) {
		
		
		return false;
		
		
		
		}else 
		
 return hasValidMoves || hasValidAttacks || hasVictory;

  }

  handleConfirm = () => {
    this.endTurn();
    this.setState({ isModalOpen: false});
  };

  handleCancel = () => {
    this.setState({ isModalOpen: false, isModalShownThisTurn: true });
  };  
  
  
handleReset = () => {
	
window.location.reload();

  };

  
  
  // Ends the current player's turn
endTurn() {
  const { currentPlayer, hexagons } = this.state;

  const playerScore = calculatePlayerScore(currentPlayer, hexagons);
  const updatedPlayers = updatePlayerScore(this.players, currentPlayer, playerScore);

  // Update this.players (if needed) no longer using
 // this.players = updatedPlayers;

  if (checkVictoryCondition(currentPlayer, playerScore)) { 
	  
	  
    alert(`${currentPlayer.name} wins with a score of ${currentPlayer.score + playerScore}!`);
	
	
    // Handle game reset or victory actions here
  } else {
    // ... rest of the function
  }

  const currentPlayerIndex = this.players.findIndex(player => player.id === currentPlayer.id);
  const nextPlayerIndex = findNextPlayerIndex(currentPlayerIndex, this.players);

  this.setState({
    selectedUnit: null,
    selectedUnitPosition: null,
    highlightedHexagons: [],
    isModalShownThisTurn: false,
    currentPlayer: this.players[nextPlayerIndex]
  });
  
// Assuming hexagons is part of your component's state
const updatedHexagons = resetMovedUnits(this.state.hexagons);

// Set the state with the updated hexagons
this.setState({ hexagons: updatedHexagons });
}

  

  
renderPlayerStats() {
  const { hexagons, currentPlayer, players, displayMode } = this.state;
  const playerTileCounts = {};

  // Calculate the tile count for each player
  hexagons.forEach(hex => {
    const owner = hex.owner;
    if (owner !== null) {
      if (!playerTileCounts[owner]) {
        playerTileCounts[owner] = 0;
      }
      playerTileCounts[owner]++;
    }
  });

 

  return (  // Render the tile count for each player within a HexGrid layout
  
    <HexGrid width={300} height={130} viewBox="-60 -55 120 120">
      <Layout size={{ x: 48, y: 48 }} flat={false} spacing={1.1} origin={{ x: 0, y: 0 }}>
        {this.players.map(player => {
          let qValue;
          if (player.id === 0) {
            qValue = 0; // Position player 0's hexagon in the center
          } else if (player.id === 1) {
            qValue = -1; // Position player 1's hexagon to the left
          } else {
            qValue = 1; // Position player 2's hexagon to the right
          }

          const isCurrentPlayer = player.id === currentPlayer.id;  // Check if this is the current player
		  
          return (
            <Hexagon
              key={player.id}
              q={qValue}
              r={0}
              s={-qValue}
              owner={player.id}
              className={`score ${isCurrentPlayer ? 'active' : ''}`}  // Apply 'active' class for the current player
			  opacity={isCurrentPlayer ? 1.0 : 0.0}  // Set opacity based on whether it's the current player
            >		
            </Hexagon>	
          );
        })}
		
      </Layout>
	  
	  //this is just so the score text doesn't pulse:
	  <Layout size={{ x: 44, y: 44 }} flat={false} spacing={1.2} origin={{ x: 0, y: 0 }}>
	  {this.players.map(player => {
          let qValue;
          if (player.id === 0) {
            qValue = 0; // Position player 0's hexagon in the center
          } else if (player.id === 1) {
            qValue = -1; // Position player 1's hexagon to the left
          } else {
            qValue = 1; // Position player 2's hexagon to the right
          }
		            // Check if this is the current player
          const isCurrentPlayer = player.id === currentPlayer.id;
		  
          return (
            <Hexagon
              key={player.id}
              q={qValue}
              r={0}
              s={-qValue}
              owner={player.id}
              className={"score"}  // Apply 'active' class for the current player
			  opacity={1}
			  onClick={() => this.toggleDisplayMode()}
            >
              <Text className={`score text ${player.id === 0 ? 'player-0-text' : ''}`} style={player.id === 0 ? { fontSize: '20px', fontWeight: 'bold' } : {}}>
              {/*  {displayMode === 'score' ? `${playerTileCounts[player.id] || 0}` : `${player.score}`} just displays scores */}
				
				{player.id === 0 ? (displayMode === 'score' ? 'SCORE' : 'COUNT' ) : (displayMode === 'score' ?  `${player.score + playerTileCounts[player.id] }` :`${playerTileCounts[player.id] || 0}`)}
						
					
              </Text>
			  
            </Hexagon>
          );
        })}
	  </Layout>
    </HexGrid>
	
		
	
  );
}

// Add this function to toggle the display mode
toggleDisplayMode() {
  this.setState(prevState => ({
    displayMode: prevState.displayMode === 'score' ? 'tileCount' : 'score',
  }));
}



  render() {
    const { isModalOpen, isModalShownThisTurn, hexagons, path, highlightedHexagons, selectedUnit, selectedUnitPosition, currentPlayer, selectedHex } = this.state;
	
	// Check if the current player has any valid moves or attacks
    const hasValidActions = this.hasValidActions();
	
	
	 // Dynamically set the button's background color based on the current player's color
  const buttonStyle = {
    backgroundColor: currentPlayer.color,
  };

	
    return (
      <div className="App">
        <h2></h2>
		{this.renderPlayerStats()} {/* Render player tile counts */}  
        {/* Update the button style to use the dynamic style */}
      <p><button style={buttonStyle} onClick={() => this.endTurn()}>End Turn?</button></p>
		
        <HexGrid width={900} height={800} viewBox="-45 -45 90 90" >
          <Layout size={{ x: 7, y: 7 }} flat={false} spacing={1.1} origin={{ x: 0, y: 0 }}>
            {hexagons.map((hex, i) => (
              <Hexagon
                key={i}
                q={hex.q}
                r={hex.r}
                s={hex.s}
                owner={hex.owner} // Set the owner attribute based on the hexagon's owner
                className={highlightedHexagons.includes(hex) ? 'active' : (selectedHex === hex ? 'selected' : '') + (hex.pushed ? hex.pushed : '')}  // Apply 'pushed' class if hexagon is pushed
                onClick={(e, h) => this.onClick(e, h)}
              >
              {/*  <Text>{HexUtils.getID(hex)}</Text>  */}
			  {/*<Path start={path.start} end={selectedHex} /> //work on this to draw arrows*/}
			  
			  {/* ANIMATIONS HERE - still need to move CSS animations to function better */}
			  
                {hex.hasUnit && (
                  <ShapeRenderer
                    shape={this.players[hex.owner - 1].shape} // Use the player's shape based on the owner
					fillOpacity={hex.moved && hex.attack  ? '0.5' : '1.0'}						
                  />
                )}
				
				{!hex.attack && hex.hasUnit && (!hex.moved || hex.adjacent) && (
				 <ShapeAnimator
                    shape={this.players[hex.owner - 1].shape} // Use the player's shape based on the owner
					fillOpacity={hex.moved === true ? '0.5' : '1.0'}	
					hex={hex}
					currentPlayer={currentPlayer}
                  />
				)} 
					
					
				{hex.count && !hex.pushed && (hex.owner !== currentPlayer) && (
                  <PointRenderer
                    	hex={hex}
						currentPlayer={currentPlayer}	
                  />
                )}	
		
			 {/* ANIMATIONS HERE - still need to move CSS animations to function better */}
			
			
             </Hexagon>
            ))}
            <Path start={path.start} end={path.end} />
          </Layout>
        </HexGrid>
        {selectedUnit && (
          <p>Selected Unit: {HexUtils.getID(selectedUnitPosition)}</p>
        )}
        {selectedHex && (
          <p>Selected Hex: {HexUtils.getID(selectedHex)}</p>
        )}
 {/* Conditionally show the ConfirmationModal */}
        { isModalShownThisTurn || hasValidActions ? true : (
          <ConfirmationModal
		    hexagons={this.hexagons}
		    players={this.players}
		    currentPlayer = {currentPlayer}
            isOpen={true} // Always open the modal when there are no valid actions
			onReset={() => this.handleReset()}
            onCancel={() => this.handleCancel()}
            onConfirm={() => this.handleConfirm()}
          />
        )}

     </div>
    );
  }
}


class PointRenderer extends React.Component {

  
  render() {
    const { hex, shape, fill, fillOpacity, className, currentPlayer } = this.props;
	
    
      return (      
		
      <text
        className="push-animation"
		 
		 x="-0.5em"
		 y="-0.5em" 
		  
      >
        
		

	  +{hex.count}
		
		
		
      </text>
	  );  
    
    return null;
  }
}


class ShapeRenderer extends React.Component {
  render() {
    const { shape, fill, fillOpacity, className } = this.props;
    if (shape === "circle") {
      return ( <circle cx="0" cy="0" r="1" fill={fill} fillOpacity={fillOpacity}  className={className} >;
	  </circle>
	  );  
    } 
    return null;
  }
}



class ShapeAnimator extends React.Component {
  shouldAnimate() {
    const { hex, currentPlayer } = this.props;
    return hex.owner === currentPlayer.id;
  }	
	
  render() {
    const { shape, fill, fillOpacity, className } = this.props;
    if (shape === "circle") {
      return ( <circle cx="0" cy="0" r="1" fill={fill} fillOpacity={fillOpacity}  className={className}>;
          {this.shouldAnimate() && (
            <>
              <animate attributeName="r" from="1" to="2" dur="1.5s" begin="0s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
            </>
          )}
	  </circle>
	  );
    } 
    return null;
  }
}


// Reset Animations on Click - needs some work - does this even do anything?
document.addEventListener('click', function () {
	
  const animatedElements = document.querySelectorAll('.hexagon');
 
  // Add a class to pause animations
  animatedElements.forEach(function (element) {
    element.style.animation = 'none'; // Set animation to an empty string
  });

  // After 10 ms, remove the class to resume animations
  setTimeout(function () {
    animatedElements.forEach(function (element) {
      element.style.animation = ''; // Set animation to an empty string
    });
  }, 10);
});

export default App;
