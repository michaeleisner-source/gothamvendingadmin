import React from 'react';
import ReactDOM from 'react-dom/client';

// Simplified test without importing App
function SimpleTest() {
  console.log('SimpleTest rendering');
  return (
    <div style={{ 
      padding: '20px', 
      background: 'white', 
      color: 'black',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <h1>SIMPLE TEST WORKING</h1>
    </div>
  );
}

console.log('Main.tsx loading...');

try {
  const root = document.getElementById('root');
  if (root) {
    console.log('Root found, rendering SimpleTest...');
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(<SimpleTest />);
    console.log('SimpleTest rendered');
  } else {
    console.error('Root element not found');
  }
} catch (error) {
  console.error('Error in main:', error);
}