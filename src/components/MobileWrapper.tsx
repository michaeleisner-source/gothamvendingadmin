import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MobileQuickActions from './MobileQuickActions';

export default function MobileWrapper() {
  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Field Operations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MobileQuickActions />
        </CardContent>
      </Card>
    </div>
  );
}