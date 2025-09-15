import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, DollarSign, AlertTriangle, Zap, 
  Scan, Plus, Clock, CheckCircle 
} from 'lucide-react';
import { useVendingData } from '@/hooks/useVendingData';
import { toast } from 'sonner';

export function MobileQuickActions() {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');

  // Quick sale recording (for field technicians)
  const QuickSaleDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="font-medium">Quick Sale</div>
            <div className="text-xs text-muted-foreground">Record sale instantly</div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Quick Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Machine</label>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="machine1">Lobby Machine #1</SelectItem>
                <SelectItem value="machine2">Break Room #2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Product</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coke">Coca-Cola - $1.50</SelectItem>
                <SelectItem value="chips">Chips - $1.25</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price</label>
              <Input 
                type="number" 
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1.50"
              />
            </div>
          </div>

          <Button className="w-full" size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Record Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Quick restock (simplified)
  const QuickRestockDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="font-medium">Quick Restock</div>
            <div className="text-xs text-muted-foreground">Fill to PAR level</div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Restock to PAR</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select machine to restock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="machine1">
                <div>
                  <div className="font-medium">Lobby Machine #1</div>
                  <div className="text-xs text-red-600">3 slots need restocking</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Auto-fill suggestions:</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>A1 - Coca-Cola:</span>
                <span>Fill +8 units to reach PAR (12)</span>
              </div>
              <div className="flex justify-between">
                <span>B2 - Chips:</span>
                <span>Fill +5 units to reach PAR (10)</span>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg">
            <Package className="w-4 h-4 mr-2" />
            Auto-Fill to PAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Field Actions</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <QuickSaleDialog />
        <QuickRestockDialog />
        
        {/* Report Issue */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="font-medium">Report Issue</div>
            <div className="text-xs text-muted-foreground">Machine problem</div>
          </CardContent>
        </Card>

        {/* Barcode Scanner */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Scan className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="font-medium">Scan Product</div>
            <div className="text-xs text-muted-foreground">Quick lookup</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Restocked Machine #1</span>
              <span className="text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Recorded 3 Coke sales</span>
              <span className="text-muted-foreground">15 min ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Reported jam in Machine #3</span>
              <span className="text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MobileQuickActions;