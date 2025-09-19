-- Add document storage capabilities and expand help system

-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false);

-- Add file upload columns to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_file_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_file_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_file_size INTEGER;

-- Create storage policies for contract documents
CREATE POLICY "Users can view their org contracts" ON storage.objects
FOR SELECT USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their org contracts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their org contracts" ON storage.objects
FOR UPDATE USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their org contracts" ON storage.objects
FOR DELETE USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert comprehensive help articles for business processes

-- User Manual Articles
INSERT INTO help_articles (category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug = 'workflow'), 'Complete User Manual', 'user-manual', 
'# Complete User Manual

## System Overview
This vending machine management system helps you track locations, machines, inventory, sales, and finances.

## Main Modules
- **Dashboard**: Real-time overview of your business
- **Prospects**: Manage potential locations
- **Locations**: Active vending sites
- **Machines**: Equipment tracking and health
- **Inventory**: Stock management and alerts
- **Products**: Catalog and pricing
- **Sales**: Transaction recording and analysis
- **Reports**: Business intelligence and analytics
- **Contracts**: Legal agreements and documents
- **Finance**: Revenue, costs, and commissions

## Navigation
Use the sidebar to access different modules. The search bar helps find specific locations, machines, or products quickly.

## Getting Help
- Use the Help Center for detailed guides
- Check the Admin section for advanced features
- Contact support for technical issues');

-- Process Documentation (SOPs)
INSERT INTO help_articles (category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug = 'workflow'), 'Standard Operating Procedures', 'sops', 
'# Standard Operating Procedures

## Daily Operations Checklist
### Morning (Start of Day)
1. **Check Dashboard**: Review overnight alerts and metrics
2. **Monitor Machine Health**: Address any offline machines
3. **Review Low Stock Alerts**: Plan restocking routes
4. **Check Commission Reports**: Verify location performance
5. **Process New Prospects**: Follow up on leads

### During the Day
1. **Record Sales**: Enter manual transactions if needed
2. **Update Inventory**: Log restocking activities
3. **Handle Service Calls**: Address machine issues promptly
4. **Monitor Finances**: Track daily revenue vs. targets
5. **Manage Routes**: Optimize delivery schedules

### End of Day
1. **Generate Reports**: Daily sales and performance summary
2. **Plan Tomorrow**: Schedule restocking and maintenance
3. **Update Contracts**: Process any signed agreements
4. **Backup Data**: Ensure all information is saved
5. **Review Metrics**: Analyze performance against goals

## Weekly Procedures
### Monday: Planning Week
- Review weekly targets
- Schedule route optimization
- Plan new prospect visits
- Process commission statements

### Wednesday: Mid-Week Review
- Analyze performance trends
- Adjust inventory levels
- Review machine health reports
- Update pricing strategies

### Friday: Week Closure
- Generate weekly reports
- Process payments and invoices
- Plan weekend maintenance
- Prepare for next week

## Monthly Procedures
- Generate commission statements
- Review contract renewals
- Analyze location performance
- Plan equipment purchases
- Conduct financial reconciliation');

INSERT INTO help_articles (category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug = 'admin'), 'Administrator Guide', 'admin-guide', 
'# Administrator Guide

## User Management
### Adding New Users
1. Go to **Admin → Staff Management**
2. Click **Add New User**
3. Enter user details and assign role
4. Set permissions based on responsibilities
5. Send login credentials securely

### Managing Permissions
- **Owner**: Full system access
- **Manager**: All operations except billing
- **Operator**: Daily operations and reporting
- **Viewer**: Read-only access to reports

## System Configuration
### Organization Settings
- Company information and branding
- Default commission structures
- Alert thresholds and notifications
- Integration settings

### Machine Setup
1. **Add New Machine**
   - Enter machine details and location
   - Configure slot layout and capacity
   - Set pricing and commission rates
   - Test connectivity and telemetry

2. **Machine Templates**
   - Create templates for common configurations
   - Standardize slot layouts across machines
   - Set default pricing strategies

### Location Management
- Categorize location types
- Set commission structures
- Configure alert preferences
- Manage contract templates

## Financial Administration
### Commission Management
- Set location-specific rates
- Configure tier structures
- Manage payment schedules
- Generate statements

### Reporting Controls
- Configure automated reports
- Set up dashboard metrics
- Manage data retention
- Export capabilities

## Security & Backups
### Data Security
- Regular password updates
- Two-factor authentication setup
- User access auditing
- Session management

### Backup Procedures
- Daily automated backups
- Weekly full system backup
- Monthly archive creation
- Disaster recovery testing

## Troubleshooting
### Common Issues
- **Machine Offline**: Check network connectivity
- **Inventory Discrepancies**: Verify restocking entries
- **Commission Errors**: Review rate configurations
- **Report Issues**: Check date ranges and filters

### System Maintenance
- Database optimization monthly
- Cache clearing procedures
- Performance monitoring
- Update scheduling');

INSERT INTO help_articles (category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug = 'workflow'), 'Staff Training Materials', 'training-materials', 
'# Staff Training Materials

## New Employee Onboarding

### Week 1: System Basics
#### Day 1-2: Introduction
- System overview and navigation
- Login procedures and security
- Basic data entry and forms
- Help system and support contacts

#### Day 3-5: Core Functions
- Location and machine management
- Inventory tracking and alerts
- Basic sales recording
- Report generation

### Week 2: Operations Training
#### Daily Operations
- Morning routine checklist
- Restocking procedures
- Service call handling
- End-of-day closeout

#### Customer Management
- Prospect qualification
- Site survey procedures
- Contract negotiation basics
- Relationship maintenance

### Week 3: Advanced Features
#### Reporting and Analytics
- Financial report generation
- Performance analysis
- Commission calculations
- Data export procedures

#### Troubleshooting
- Common system issues
- Machine diagnostic procedures
- Inventory discrepancy resolution
- Customer complaint handling

## Role-Specific Training

### Route Operators
1. **Mobile App Usage**
   - Offline functionality
   - GPS tracking and routes
   - Photo capture for issues
   - Real-time inventory updates

2. **Inventory Management**
   - Restocking procedures
   - Par level maintenance
   - Expiration date tracking
   - Theft and damage reporting

3. **Customer Service**
   - Professional interaction
   - Issue resolution
   - Upselling opportunities
   - Feedback collection

### Sales Team
1. **Prospect Management**
   - Lead qualification criteria
   - Site survey best practices
   - Proposal preparation
   - Objection handling

2. **Contract Negotiation**
   - Standard terms and conditions
   - Commission structure options
   - Legal requirements
   - Closing techniques

### Office Staff
1. **Administrative Tasks**
   - Data entry accuracy
   - Report scheduling
   - Invoice processing
   - Customer communications

2. **Financial Management**
   - Commission calculations
   - Payment processing
   - Expense tracking
   - Budget monitoring

## Training Assessments

### Knowledge Checks
- System navigation quiz
- Process procedure tests
- Customer scenario exercises
- Safety and compliance review

### Practical Evaluations
- Live system demonstrations
- Real-world problem solving
- Customer interaction roleplay
- Performance metric achievement

## Ongoing Education
- Monthly system updates training
- Quarterly best practices review
- Annual compliance certification
- New feature introduction sessions');

-- Process and Workflow Articles
INSERT INTO help_articles (category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug = 'supply'), 'Inventory Management Processes', 'inventory-processes', 
'# Inventory Management Processes

## Restocking Workflow
### Pre-Route Planning
1. **Generate Restock Reports**
   - Review low stock alerts
   - Check sales velocity data
   - Plan efficient routes
   - Prepare inventory lists

2. **Load Vehicle**
   - Verify product quantities
   - Check expiration dates
   - Organize by route sequence
   - Document starting inventory

### On-Site Procedures
1. **Machine Assessment**
   - Check machine status and cleanliness
   - Verify slot configurations
   - Document any issues or damage
   - Test basic functions

2. **Inventory Restocking**
   - Record current quantities before restocking
   - Fill to predetermined par levels
   - Rotate stock (FIFO method)
   - Update system in real-time

3. **Quality Control**
   - Remove expired products
   - Check for damaged items
   - Verify pricing accuracy
   - Test vend mechanisms

### Post-Route Documentation
1. **System Updates**
   - Confirm all inventory entries
   - Upload photos of issues
   - Schedule any needed maintenance
   - Update location notes

## Stock Management
### Ordering Procedures
1. **Weekly Demand Analysis**
   - Review sales velocity reports
   - Identify trending products
   - Calculate reorder quantities
   - Plan for seasonal variations

2. **Purchase Order Creation**
   - Select preferred suppliers
   - Compare pricing and terms
   - Generate PO documentation
   - Set delivery schedules

### Receiving Process
1. **Delivery Verification**
   - Check quantities against PO
   - Verify product quality
   - Confirm expiration dates
   - Document any discrepancies

2. **Warehouse Management**
   - Organize by product category
   - Implement FIFO rotation
   - Update inventory system
   - Plan distribution schedules');

INSERT INTO help_articles (category_id, title, slug, body_md) VALUES
((SELECT id FROM help_categories WHERE slug = 'finance'), 'Financial Management Guide', 'financial-management', 
'# Financial Management Guide

## Revenue Tracking
### Daily Revenue Monitoring
1. **Sales Recording**
   - Real-time transaction capture
   - Manual entry for cash sales
   - Reconciliation with machine reports
   - Daily revenue validation

2. **Commission Calculations**
   - Location-specific rate application
   - Tier-based commission structures
   - Minimum guarantee processing
   - Monthly statement generation

### Financial Reporting
1. **Daily Reports**
   - Total sales by location/machine
   - Product performance analysis
   - Route efficiency metrics
   - Cash collection summaries

2. **Monthly Analysis**
   - Commission statement review
   - Profit margin analysis
   - Location performance ranking
   - Trend identification

## Cost Management
### Operating Expenses
1. **Machine Costs**
   - Lease/purchase payments
   - Insurance premiums
   - Maintenance expenses
   - Utility costs

2. **Product Costs**
   - Wholesale pricing
   - Transportation expenses
   - Storage costs
   - Waste and shrinkage

### Profitability Analysis
1. **Location ROI**
   - Revenue per machine calculation
   - Commission expense tracking
   - Net profit determination
   - Performance benchmarking

2. **Product Profitability**
   - Margin analysis by item
   - Velocity vs. profit optimization
   - Pricing strategy development
   - Portfolio optimization

## Cash Flow Management
### Daily Cash Operations
1. **Collection Procedures**
   - Secure cash handling protocols
   - Deposit scheduling and tracking
   - Discrepancy investigation
   - Audit trail maintenance

2. **Banking Operations**
   - Daily deposit reconciliation
   - Account balance monitoring
   - Payment processing
   - Wire transfer procedures

### Financial Controls
1. **Audit Procedures**
   - Monthly reconciliation process
   - Inventory value verification
   - Commission accuracy review
   - Expense approval workflows

2. **Budget Management**
   - Monthly budget vs. actual analysis
   - Variance investigation
   - Forecast adjustments
   - Capital expenditure planning');

-- Update help categories to include new documentation types
INSERT INTO help_categories (name, slug, sort_order) VALUES
('Documentation', 'documentation', 8),
('Training', 'training', 9)
ON CONFLICT (slug) DO NOTHING;