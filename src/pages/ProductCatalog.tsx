import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Package, 
  Barcode, 
  Image as ImageIcon, 
  Edit3,
  Eye,
  Copy,
  Plus,
  Filter,
  Download,
  Upload,
  Star
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Demo product catalog data
const products = [
  {
    id: "1",
    name: "Coca Cola Classic",
    sku: "CC-355ML",
    barcode: "049000028911",
    category: "Beverages",
    brand: "Coca Cola",
    description: "Classic cola soft drink in 355ml can",
    costPrice: 0.65,
    suggestedPrice: 1.75,
    currentPrice: 1.75,
    nutrition: {
      calories: 140,
      sugar: "39g",
      sodium: "45mg",
      caffeine: "34mg"
    },
    allergens: [],
    ingredients: ["Carbonated water", "High fructose corn syrup", "Caramel color", "Phosphoric acid", "Natural flavors", "Caffeine"],
    supplier: "Coca Cola Bottling Co",
    shelfLife: "12 months",
    storageTemp: "Room temperature",
    weight: "355ml",
    dimensions: "6.2 x 2.6 x 2.6 inches",
    imageUrl: "/api/placeholder/300/300",
    status: "active",
    lastUpdated: "2025-01-10",
    salesVelocity: 45,
    profitMargin: 169
  },
  {
    id: "2",
    name: "Lay's Classic Potato Chips",
    sku: "LAYS-28G",
    barcode: "028400064057",
    category: "Snacks",
    brand: "Lay's",
    description: "Crispy potato chips with just the right amount of salt",
    costPrice: 0.89,
    suggestedPrice: 1.50,
    currentPrice: 1.50,
    nutrition: {
      calories: 160,
      fat: "10g",
      sodium: "170mg",
      carbs: "15g"
    },
    allergens: [],
    ingredients: ["Potatoes", "Vegetable oil", "Salt"],
    supplier: "Frito-Lay Inc",
    shelfLife: "8 months",
    storageTemp: "Room temperature",
    weight: "28g",
    dimensions: "7.5 x 5.0 x 1.0 inches",
    imageUrl: "/api/placeholder/300/300",
    status: "active",
    lastUpdated: "2025-01-08",
    salesVelocity: 38,
    profitMargin: 69
  },
  {
    id: "3",
    name: "Snickers Bar",
    sku: "SNICK-52G",
    barcode: "040000000051",
    category: "Candy",
    brand: "Snickers",
    description: "Milk chocolate bar with peanuts, caramel and nougat",
    costPrice: 0.75,
    suggestedPrice: 1.25,
    currentPrice: 1.25,
    nutrition: {
      calories: 250,
      fat: "12g",
      sugar: "20g",
      protein: "4g"
    },
    allergens: ["Peanuts", "Milk", "Soy"],
    ingredients: ["Milk chocolate", "Peanuts", "Corn syrup", "Sugar", "Skim milk", "Butter"],
    supplier: "Mars Wrigley",
    shelfLife: "12 months", 
    storageTemp: "Room temperature",
    weight: "52g",
    dimensions: "4.5 x 1.0 x 0.5 inches",
    imageUrl: "/api/placeholder/300/300",
    status: "active",
    lastUpdated: "2025-01-05",
    salesVelocity: 32,
    profitMargin: 67
  },
  {
    id: "4",
    name: "Red Bull Energy Drink",
    sku: "RB-250ML",
    barcode: "9002490100018",
    category: "Energy Drinks",
    brand: "Red Bull",
    description: "Energy drink with caffeine, taurine and B-vitamins",
    costPrice: 1.45,
    suggestedPrice: 2.99,
    currentPrice: 2.99,
    nutrition: {
      calories: 110,
      caffeine: "80mg",
      sugar: "27g",
      taurine: "1000mg"
    },
    allergens: [],
    ingredients: ["Caffeine", "Taurine", "B-complex vitamins", "Sucrose", "Alpine water"],
    supplier: "Red Bull North America",
    shelfLife: "18 months",
    storageTemp: "Room temperature",
    weight: "250ml",
    dimensions: "5.3 x 2.4 x 2.4 inches",
    imageUrl: "/api/placeholder/300/300",
    status: "active",
    lastUpdated: "2025-01-12",
    salesVelocity: 28,
    profitMargin: 106
  },
  {
    id: "5",
    name: "Nature Valley Granola Bar",
    sku: "NV-42G-OAT",
    barcode: "016000275058",
    category: "Healthy Snacks",
    brand: "Nature Valley", 
    description: "Crunchy granola bar with oats and honey",
    costPrice: 1.20,
    suggestedPrice: 2.25,
    currentPrice: 2.25,
    nutrition: {
      calories: 190,
      fat: "6g",
      fiber: "2g",
      protein: "4g"
    },
    allergens: ["Tree nuts", "Soy"],
    ingredients: ["Whole grain oats", "Sugar", "Canola oil", "Rice flour", "Honey"],
    supplier: "General Mills",
    shelfLife: "10 months",
    storageTemp: "Room temperature", 
    weight: "42g",
    dimensions: "5.0 x 1.5 x 0.8 inches",
    imageUrl: "/api/placeholder/300/300",
    status: "active",
    lastUpdated: "2025-01-09",
    salesVelocity: 22,
    profitMargin: 88
  }
];

const categories = ["All Categories", "Beverages", "Snacks", "Candy", "Energy Drinks", "Healthy Snacks"];

export default function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const avgMargin = Math.round(products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Master product database with detailed information and media
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Products
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input placeholder="e.g. Coca Cola Classic" />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input placeholder="e.g. CC-355ML" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                        <SelectItem value="candy">Candy</SelectItem>
                        <SelectItem value="energy">Energy Drinks</SelectItem>
                        <SelectItem value="healthy">Healthy Snacks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input placeholder="e.g. Coca Cola" />
                  </div>
                  <div>
                    <Label>Barcode</Label>
                    <Input placeholder="049000028911" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Product description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cost Price</Label>
                    <Input type="number" step="0.01" placeholder="0.65" />
                  </div>
                  <div>
                    <Label>Suggested Price</Label>
                    <Input type="number" step="0.01" placeholder="1.75" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCreateDialog(false)}>
                    Add Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Filter className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold">{avgMargin}%</p>
              </div>
              <Barcode className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog ({filteredProducts.length} products)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU/Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Sales Velocity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.brand}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-mono">{product.sku}</div>
                      <div className="text-muted-foreground">{product.barcode}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>${product.costPrice.toFixed(2)}</TableCell>
                  <TableCell>${product.currentPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      {product.profitMargin}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{product.salesVelocity}/month</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={product.status === 'active' ? 'default' : 'secondary'}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">Product Details</TabsTrigger>
                  <TabsTrigger value="nutrition">Nutrition & Ingredients</TabsTrigger>
                  <TabsTrigger value="logistics">Logistics & Storage</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Product Name</Label>
                        <p className="text-sm">{selectedProduct.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">SKU</Label>
                        <p className="text-sm font-mono">{selectedProduct.sku}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Barcode</Label>
                        <p className="text-sm font-mono">{selectedProduct.barcode}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Brand</Label>
                        <p className="text-sm">{selectedProduct.brand}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <Badge variant="outline">{selectedProduct.category}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm">{selectedProduct.description}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Supplier</Label>
                        <p className="text-sm">{selectedProduct.supplier}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Weight/Size</Label>
                        <p className="text-sm">{selectedProduct.weight}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Dimensions</Label>
                        <p className="text-sm">{selectedProduct.dimensions}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="nutrition" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Nutrition Facts</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(selectedProduct.nutrition).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Ingredients</Label>
                        <div className="text-sm mt-1">
                          {selectedProduct.ingredients.join(', ')}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Allergens</Label>
                        <div className="mt-1">
                          {selectedProduct.allergens.length > 0 ? (
                            selectedProduct.allergens.map((allergen: string) => (
                              <Badge key={allergen} variant="destructive" className="mr-1 text-xs">
                                {allergen}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logistics" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Shelf Life</Label>
                        <p className="text-sm">{selectedProduct.shelfLife}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Storage Temperature</Label>
                        <p className="text-sm">{selectedProduct.storageTemp}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Supplier</Label>
                        <p className="text-sm">{selectedProduct.supplier}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <p className="text-sm">{new Date(selectedProduct.lastUpdated).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge variant={selectedProduct.status === 'active' ? 'default' : 'secondary'}>
                          {selectedProduct.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Pricing Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Cost Price:</span>
                          <span className="font-medium">${selectedProduct.costPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Suggested Price:</span>
                          <span className="font-medium">${selectedProduct.suggestedPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Current Price:</span>
                          <span className="font-medium">${selectedProduct.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm">Profit Margin:</span>
                          <span className="font-bold text-green-600">{selectedProduct.profitMargin}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Sales Velocity:</span>
                          <span className="font-medium">{selectedProduct.salesVelocity}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Revenue Impact:</span>
                          <span className="font-medium text-green-600">High</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Inventory Turns:</span>
                          <span className="font-medium">8.5x/year</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                  Close
                </Button>
                <Button>
                  Edit Product
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}