import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Settings, 
  Copy, 
  Edit3, 
  Trash2,
  Plus,
  Grid3X3,
  Zap,
  DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo machine template data
const machineTemplates = [
  {
    id: "1",
    name: "Standard Office Snack Machine",
    type: "Snack",
    rows: 6,
    cols: 8, 
    totalSlots: 48,
    maxCapacityPerSlot: 15,
    defaultProducts: [
      { slot: "A1", product: "Coca Cola", capacity: 12 },
      { slot: "A2", product: "Pepsi", capacity: 12 },
      { slot: "B1", product: "Chips - Lays", capacity: 15 },
      { slot: "B2", product: "Chips - Doritos", capacity: 15 },
      { slot: "C1", product: "Candy Bar - Snickers", capacity: 10 }
    ],
    pricingRules: [
      { category: "Beverages", price: 1.75 },
      { category: "Snacks", price: 1.50 },
      { category: "Candy", price: 1.25 }
    ],
    description: "Standard configuration for office buildings with popular snacks and drinks",
    machinesUsing: 12,
    createdAt: "2024-11-15",
    status: "active"
  },
  {
    id: "2", 
    name: "Hospital Healthy Choice",
    type: "Healthy",
    rows: 5,
    cols: 6,
    totalSlots: 30,
    maxCapacityPerSlot: 12,
    defaultProducts: [
      { slot: "A1", product: "Water - Dasani", capacity: 12 },
      { slot: "A2", product: "Juice - Apple", capacity: 8 },
      { slot: "B1", product: "Granola Bar", capacity: 10 },
      { slot: "B2", product: "Nuts - Mixed", capacity: 8 },
      { slot: "C1", product: "Fruit Cup", capacity: 6 }
    ],
    pricingRules: [
      { category: "Water", price: 1.00 },
      { category: "Healthy Snacks", price: 2.25 },
      { category: "Beverages", price: 1.50 }
    ],
    description: "Health-focused selections for healthcare facilities",
    machinesUsing: 8,
    createdAt: "2024-10-22",
    status: "active"
  },
  {
    id: "3",
    name: "University High Volume",
    type: "High Volume", 
    rows: 8,
    cols: 10,
    totalSlots: 80,
    maxCapacityPerSlot: 20,
    defaultProducts: [
      { slot: "A1", product: "Energy Drink - Red Bull", capacity: 15 },
      { slot: "A2", product: "Coffee - Starbucks", capacity: 12 },
      { slot: "B1", product: "Pizza Roll", capacity: 20 },
      { slot: "B2", product: "Ramen Cup", capacity: 18 },
      { slot: "C1", product: "Candy - Gummy Bears", capacity: 15 }
    ],
    pricingRules: [
      { category: "Energy Drinks", price: 2.50 },
      { category: "Hot Food", price: 3.00 },
      { category: "Snacks", price: 1.75 }
    ],
    description: "Large capacity machine for high-traffic university locations",
    machinesUsing: 6,
    createdAt: "2024-12-01", 
    status: "active"
  },
  {
    id: "4",
    name: "Compact Office Mini",
    type: "Compact",
    rows: 4,
    cols: 4,
    totalSlots: 16, 
    maxCapacityPerSlot: 8,
    defaultProducts: [
      { slot: "A1", product: "Coffee Pod", capacity: 8 },
      { slot: "A2", product: "Tea Bags", capacity: 8 },
      { slot: "B1", product: "Cookies", capacity: 6 },
      { slot: "B2", product: "Crackers", capacity: 6 }
    ],
    pricingRules: [
      { category: "Coffee/Tea", price: 0.75 },
      { category: "Light Snacks", price: 1.00 }
    ],
    description: "Small footprint design for break rooms and small offices",
    machinesUsing: 4,
    createdAt: "2024-09-10",
    status: "draft"
  }
];

export default function MachineTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const filteredTemplates = machineTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Machine Templates</h1>
          <p className="text-muted-foreground mt-1">
            Standardized configurations for quick machine setup
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Machine Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name</Label>
                  <Input placeholder="e.g. Office Standard" />
                </div>
                <div>
                  <Label>Machine Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snack">Snack Machine</SelectItem>
                      <SelectItem value="beverage">Beverage Machine</SelectItem>
                      <SelectItem value="combo">Combo Machine</SelectItem>
                      <SelectItem value="healthy">Healthy Options</SelectItem>
                      <SelectItem value="hot-food">Hot Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Rows</Label>
                  <Input type="number" defaultValue="6" min="1" max="12" />
                </div>
                <div>
                  <Label>Columns</Label>
                  <Input type="number" defaultValue="8" min="1" max="12" />
                </div>
                <div>
                  <Label>Max Per Slot</Label>
                  <Input type="number" defaultValue="15" min="1" max="50" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="Brief description of this template's use case" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{machineTemplates.length}</p>
              </div>
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold">
                  {machineTemplates.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Machines Using</p>
                <p className="text-2xl font-bold">
                  {machineTemplates.reduce((sum, t) => sum + t.machinesUsing, 0)}
                </p>
              </div>
              <Grid3X3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Slots</p>
                <p className="text-2xl font-bold">
                  {Math.round(machineTemplates.reduce((sum, t) => sum + t.totalSlots, 0) / machineTemplates.length)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, type, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Template Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Machines Using</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{template.rows} × {template.cols} = {template.totalSlots} slots</div>
                      <div className="text-muted-foreground">Max {template.maxCapacityPerSlot} per slot</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{template.defaultProducts.length} default products</div>
                      <div className="text-muted-foreground">{template.pricingRules.length} pricing rules</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{template.machinesUsing}</span>
                    <span className="text-muted-foreground ml-1">machines</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={template.status === 'active' ? 'default' : 'secondary'}
                    >
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm">{selectedTemplate.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Configuration</Label>
                    <p className="text-sm">{selectedTemplate.rows} × {selectedTemplate.cols} slots</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Machines Using</Label>
                    <p className="text-sm">{selectedTemplate.machinesUsing}</p>
                  </div>
                </div>

                {/* Default Products */}
                <div>
                  <Label className="text-sm font-medium">Default Product Configuration</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Slot Assignments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedTemplate.defaultProducts.map((assignment: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="font-mono">{assignment.slot}</span>
                            <span className="flex-1 mx-2">{assignment.product}</span>
                            <span className="text-muted-foreground">×{assignment.capacity}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Pricing Rules</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedTemplate.pricingRules.map((rule: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{rule.category}</span>
                            <span className="font-medium">${rule.price}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Close
                  </Button>
                  <Button>
                    Apply to Machine
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}