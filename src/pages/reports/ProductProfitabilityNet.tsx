import React from "react";

export default function ProductProfitabilityNet() {
  console.log('ProductProfitabilityNet component loaded - BASIC TEST');
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Product Profitability Test</h1>
      <p className="text-lg mb-4">This is a test to see if the component renders at all.</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">✓ If you can see this, React routing is working!</p>
        <p className="text-sm text-blue-600 mt-2">Route: /finance/profitability</p>
      </div>
    </div>
  );
}