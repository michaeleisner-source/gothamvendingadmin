import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isDemo } = useDemo();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const loc = useLocation();

  console.log("ProtectedRoute: Rendering, isDemo:", isDemo, "loading:", loading, "authed:", authed);

  useEffect(() => {
    console.log("ProtectedRoute: useEffect running");
    
    if (isDemo) {
      console.log("ProtectedRoute: Demo mode, allowing access");
      // In demo, just allow — DemoProvider already auto-signs in behind the scenes
      setAuthed(true);
      setLoading(false);
      return;
    }

    // For non-demo mode, always allow for now to test loading
    console.log("ProtectedRoute: Non-demo mode, allowing access for testing");
    setAuthed(true);
    setLoading(false);
  }, [isDemo]);

  if (loading) {
    console.log("ProtectedRoute: Still loading, showing null");
    return <div>Loading route...</div>;
  }
  
  if (!authed && !isDemo) {
    console.log("ProtectedRoute: Not authenticated, redirecting to auth");
    return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  }
  
  console.log("ProtectedRoute: Rendering children");
  return <>{children}</>;
}