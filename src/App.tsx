import React from 'react';

function App() {
  return (
    <div style={{
      padding: '50px',
      background: 'red',
      color: 'white',
      fontSize: '32px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>REACT IS WORKING!</h1>
      <p>Current URL: {window.location.pathname}</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

export default App;