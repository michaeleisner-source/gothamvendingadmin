import { useMemo, useState } from 'react';

export default function QAOverview(){
  console.log('QA Overview component rendered!');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '200px' }}>
      <h1 style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>QA Overview Page</h1>
      <p style={{ color: 'black', marginTop: '10px' }}>This page is working! Route: /#/qa/overview</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        border: '2px solid #007bff', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <p style={{ color: 'black', margin: '0' }}>✅ Component is rendering successfully</p>
        <p style={{ color: 'black', marginTop: '10px' }}>
          Note: This app uses HashRouter, so routes need the # prefix.
        </p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.hash = '/qa/overview'}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Navigate to /#/qa/overview
        </button>
      </div>
    </div>
  );
}