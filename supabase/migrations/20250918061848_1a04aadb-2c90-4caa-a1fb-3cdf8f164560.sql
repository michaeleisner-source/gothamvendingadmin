-- Add comprehensive help content for the vending machine management system

-- Insert help categories if they don't exist
INSERT INTO help_categories (name, slug, sort_order) VALUES 
('Getting Started', 'getting-started', 1),
('Operations', 'operations', 2),
('Inventory Management', 'inventory', 3),
('Reports & Analytics', 'reports', 4),
('Machine Management', 'machines', 5),
('Sales & Revenue', 'sales', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert comprehensive help articles
INSERT INTO help_articles (category_id, title, slug, body_md) VALUES 

-- Getting Started Articles
((SELECT id FROM help_categories WHERE slug = 'getting-started'), 
'Welcome to Vending Management System', 
'welcome-guide',
'# Welcome to Your Vending Machine Management System

## Overview
This comprehensive system helps you manage your vending machine business operations, from tracking sales and inventory to managing locations and analyzing performance.

## Key Features
- **Real-time Inventory Tracking** - Monitor stock levels across all machines
- **Sales Analytics** - Track revenue, profits, and performance metrics  
- **Machine Management** - Monitor machine health and maintenance
- **Location Management** - Manage prospects, locations, and contracts
- **Financial Reporting** - Comprehensive business intelligence
- **Low Stock Alerts** - Get notified when restocking is needed

## Quick Start Steps
1. **Set up your first location** - Go to Locations > New Location
2. **Configure your machines** - Add machines and assign them to locations
3. **Add your products** - Set up your product catalog with pricing
4. **Configure inventory** - Set up machine slots and stock levels
5. **Start tracking sales** - Use Sales Entry or integrate with machine telemetry

## Need Help?
Use the floating help bot (blue circle icon) in the bottom-right corner to search for specific guidance.'),

-- Operations Articles  
((SELECT id FROM help_categories WHERE slug = 'operations'),
'Managing Machine Operations',
'machine-operations',
'# Machine Operations Management

## Machine Status Monitoring
- **Online**: Machine is connected and operational
- **Offline**: Machine is disconnected or not responding
- **Service**: Machine needs servicing or maintenance
- **Maintenance**: Machine is currently being serviced

## Machine Inventory Management
Each machine has configurable slots (like A1, A2, B1, etc.) that can hold different products.

### Setting Up Machine Slots
1. Go to a specific machine page
2. Click "Generate Slots" to create the slot grid
3. Assign products to each slot
4. Set capacity and reorder thresholds

### Inventory Adjustments
- Use +/- buttons for quick adjustments
- Use "Set" to input exact quantities
- Low stock items are highlighted in red

## Automatic Inventory Updates
When sales are recorded, inventory is automatically decremented from the appropriate slots.'),

((SELECT id FROM help_categories WHERE slug = 'inventory'),
'Inventory & Stock Management',
'inventory-management', 
'# Inventory & Stock Management

## Low Stock Monitoring
The system continuously monitors inventory levels and alerts you when items need restocking.

### Stock Status Indicators
- **Good**: Above reorder threshold
- **Low**: At or below reorder threshold  
- **Empty**: Zero quantity remaining

### Low Stock Alerts
- Red badges appear on navigation items when low stock is detected
- Check "Low Stock Alerts" page for detailed restock needs
- Automatic alerts help prevent stockouts

## Restocking Process
1. Review low stock alerts 
2. Use "Start Restock" to begin a restock session
3. Update quantities as you refill machines
4. Complete the session to update inventory

## Purchase Order Management
- Create purchase orders for suppliers
- Track order status and deliveries
- Link received items to inventory updates'),

-- Reports Articles
((SELECT id FROM help_categories WHERE slug = 'reports'),
'Reports & Analytics Guide',
'reports-analytics',
'# Reports & Analytics System

## Financial KPIs
Track your key business metrics:
- **Gross Revenue**: Total sales before costs
- **Total Cost**: Cost of goods sold (COGS)  
- **Net Profit**: Revenue minus costs
- **Profit Margin**: Percentage of revenue retained as profit

## Revenue Analysis
### By Machine
- Compare performance across different machines
- Identify top-performing and underperforming units
- Track profit margins by machine location

### By Product  
- See which products sell best
- Analyze revenue contribution by product
- Optimize product mix based on performance

## Sales Trends
- **Orders per Day**: Transaction volume patterns
- **Products Sold per Day**: Unit volume trends
- **Monthly Trends**: Long-term performance patterns

## Purchase Order Tracking
- Monitor open purchase orders
- Review purchasing history
- Track supplier performance

## Using Date Filters
All reports can be filtered by date range to analyze specific time periods. Use the date picker controls to focus on relevant timeframes.'),

-- Machine Management
((SELECT id FROM help_categories WHERE slug = 'machines'),
'Machine Setup & Configuration',
'machine-setup',
'# Machine Setup & Configuration

## Adding New Machines
1. Go to Machines > New Machine
2. Enter machine details:
   - **Name**: Descriptive name (e.g., "Main Lobby Snacks")
   - **Location**: Assign to a location
   - **Status**: Set operational status
   - **Manufacturer**: Machine brand/model
   - **Serial Number**: For warranty and service tracking

## Financial Configuration
Track machine economics:
- **Acquisition Type**: Purchase vs Lease
- **Purchase/Lease Cost**: Total cost or monthly payment
- **Finance Terms**: Loan duration and interest rates
- **Insurance**: Monthly insurance costs
- **Software Costs**: Telemetry and management fees

## Slot Configuration  
Configure the physical layout:
1. Set rows and columns for the machine grid
2. Generate slots automatically (A1, A2, B1, etc.)
3. Assign products to each slot
4. Set capacity and reorder points

## Machine Monitoring
- Real-time status updates
- Sales tracking per machine
- Maintenance scheduling
- Performance analytics'),

-- Sales Articles
((SELECT id FROM help_categories WHERE slug = 'sales'),
'Sales Tracking & Management', 
'sales-management',
'# Sales Tracking & Management

## Recording Sales
### Manual Entry
1. Go to Sales Entry page
2. Select the machine
3. Choose products and quantities  
4. Process the sale
5. Inventory is automatically updated

### Automatic Integration
Sales can be automatically recorded through:
- Machine telemetry systems
- Payment processor integrations
- Third-party vending management systems

## Sales Analytics
Track your business performance:
- **Daily Revenue**: Track daily sales patterns
- **Transaction Volume**: Number of sales per period
- **Average Transaction**: Revenue per sale
- **Product Performance**: Best and worst selling items

## Revenue Optimization
- Monitor profit margins by product
- Identify peak sales times
- Adjust pricing based on performance
- Optimize product placement and mix

## Commission Tracking
For location-based revenue sharing:
- Set commission rates per location
- Track location performance
- Generate commission statements
- Monitor location profitability')

ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  updated_at = now();