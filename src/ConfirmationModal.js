/* src/ConfirmationModal.js */

import React from 'react';
import './ConfirmationModal.css';  // Adjust the path as needed



const ConfirmationModal = ({ hexagons, players, currentPlayer, onReset, isOpen, onConfirm, onCancel }) => {
	
	
  const modalStyle = {
    display: isOpen ? 'block' : 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    zIndex: 1,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    padding: '0rem',
  };

  const contentStyle = {
    backgroundColor: '#fefefe',
    margin: '25% auto',
    padding: '20px',
    border: '1px solid #888',
    width: '15%',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
  };



  
// Check if any player's score equals 20
const hasVictory = players.some(player => player.points >= 40);




	if(hasVictory) {
		
		return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <p>{currentPlayer.name} Wins! {currentPlayer.points}!</p>
        <button onClick={onReset}>Play Again</button>
        <button onClick={onCancel}>Continue Playing</button>
      </div>
    </div>
  );
		
		}else 
  
  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <p>End Turn?</p>
        <button onClick={onConfirm}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
};




export default ConfirmationModal;
