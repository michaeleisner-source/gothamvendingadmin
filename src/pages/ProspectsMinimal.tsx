import { useState, useEffect } from "react";

console.log('ProspectsMinimal file loaded');

export default function ProspectsMinimal() {
  console.log('ProspectsMinimal function called');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProspectsMinimal mounted - useEffect');
    setLoading(false);
  }, []);

  console.log('ProspectsMinimal rendering, loading:', loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1>Prospects Minimal Test</h1>
      <p>This is a minimal test component to debug the routing issue.</p>
    </div>
  );
}