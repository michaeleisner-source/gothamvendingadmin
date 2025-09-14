import React from 'react';

interface PublicAccessProps {
  children: React.ReactNode;
}

// Simple wrapper component for public access (no authentication required)
export default function PublicAccess({ children }: PublicAccessProps) {
  return <>{children}</>;
}