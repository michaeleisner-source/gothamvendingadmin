import React from 'react';
import ReactDOM from 'react-dom/client';

function TestApp() {
  console.log('TestApp component is rendering');
  return (
    <div style={{ padding: '20px', background: 'white', color: 'black' }}>
      <h1>Test App Loading</h1>
      <p>If you see this, React is working!</p>
    </div>
  );
}

console.log('Test module is loading...');

try {
  const root = document.getElementById('root');
  if (root) {
    console.log('Root element found, creating React root...');
    const reactRoot = ReactDOM.createRoot(root);
    console.log('Rendering TestApp...');
    reactRoot.render(<TestApp />);
    console.log('TestApp rendered successfully');
  } else {
    console.error('Root element not found');
  }
} catch (error) {
  console.error('Error in test:', error);
}