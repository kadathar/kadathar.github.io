/* src/App.js */

import React from 'react';
import './App.css';
import HexagonalGrid from './HexagonalGrid';



function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PUSH </h1>	
      </header>
      <main>
        <HexagonalGrid />
      </main>
    </div>
  );
}

export default App;
