import React from "react";
import { Route } from "react-router-dom";
import ReviewSnapshot from "@/pages/qa/ReviewSnapshot";

/** Route helper you'll import in App.tsx */
export function ReviewSnapshotRoutes({ ProtectedRoute }: { ProtectedRoute?: React.ComponentType<{children:React.ReactNode}> }) {
  const Wrap: React.FC<{children:React.ReactNode}> = ({ children }) =>
    ProtectedRoute ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;
  return (
    <>
      <Route path="/admin/review-snapshot" element={<Wrap><ReviewSnapshot /></Wrap>} />
    </>
  );
}