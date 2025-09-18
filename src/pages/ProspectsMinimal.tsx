import { useState, useEffect } from "react";

export default function ProspectsMinimal() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProspectsMinimal mounted');
    setLoading(false);
  }, []);

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