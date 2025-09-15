-- Add comprehensive help articles for all major system functions

-- Workflow & Getting Started
INSERT INTO help_articles (id, category_id, title, slug, body_md) VALUES
(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'workflow'), 'Getting Started Guide', 'getting-started', 
'# Getting Started with Your Vending Management System

Welcome to your complete vending business management platform! This guide will walk you through the essential steps to get your operation running smoothly.

## Initial Setup Checklist

### 1. Configure Your Business
- Set up your company profile and preferences
- Configure your default settings and time zones
- Set up your user accounts and permissions

### 2. Add Your Locations
Navigate to **Locations** to add all the places where you have or plan to have vending machines:
- Enter location details (name, address, contact info)
- Set commission rates and agreements
- Note access schedules and special requirements

### 3. Set Up Products
Go to **Products** to create your inventory catalog:
- Add product names, SKUs, and descriptions  
- Set wholesale costs and retail prices
- Configure product categories and suppliers

### 4. Add Your Machines
Use **Machines** to register all your vending equipment:
- Enter machine details and serial numbers
- Assign machines to specific locations
- Configure payment processing and connectivity

### 5. Plan Your Slots
Configure **Slot Planning** for each machine:
- Design your product layout
- Set capacity and PAR levels for each slot
- Assign products to specific positions

## Daily Operations Flow

Once setup is complete, follow this daily workflow:

1. **Dashboard Review**: Check alerts, sales, and key metrics
2. **Prospect Management**: Follow up on new location opportunities  
3. **Inventory Planning**: Review stock levels and plan restocks
4. **Route Execution**: Process restocking and service calls
5. **Sales Recording**: Log cash collections and transactions
6. **Report Analysis**: Review performance and identify opportunities

## Getting Help

- Use the **Help Bot** (💬 icon) for quick questions
- Check the **Help Center** for detailed guides
- Look for **?** icons throughout the system for context-specific help'),

(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'workflow'), 'Daily Operations Checklist', 'daily-operations',
'# Daily Operations Checklist

Maximize efficiency with this systematic daily workflow designed for vending operators.

## Morning Routine (15-30 minutes)

### Dashboard Review
- [ ] Check overnight sales and cash collections
- [ ] Review any machine alerts or connectivity issues
- [ ] Identify machines needing immediate attention
- [ ] Check inventory levels and restock priorities

### Route Planning  
- [ ] Review today''s scheduled service calls
- [ ] Check weather and traffic conditions
- [ ] Plan optimal route sequence
- [ ] Prepare vehicle with necessary supplies

## Throughout the Day

### Service Calls
- [ ] Record cash collections at each location
- [ ] Note any machine issues or customer feedback
- [ ] Update inventory levels after restocking
- [ ] Photograph any damage or maintenance needs

### Prospect Activities
- [ ] Follow up on pending location proposals
- [ ] Make cold calls or site visits as scheduled
- [ ] Update prospect status and next steps
- [ ] Schedule appointments for next week

## End of Day (20-30 minutes)

### Data Entry & Reconciliation
- [ ] Enter all cash collections and sales data
- [ ] Update inventory transactions
- [ ] Log any maintenance or service notes
- [ ] Reconcile cash totals with expectations

### Planning Tomorrow
- [ ] Review tomorrow''s route schedule
- [ ] Check inventory needs for restocking
- [ ] Prepare any quotes or proposals
- [ ] Set priorities for urgent items

## Weekly Tasks

### Every Monday
- [ ] Review previous week''s performance metrics
- [ ] Plan the week''s restocking and service schedule
- [ ] Follow up on overdue prospects

### Every Friday  
- [ ] Prepare weekly performance reports
- [ ] Plan next week''s priorities
- [ ] Update commission calculations
- [ ] Back up important data

## Efficiency Tips

- **Batch Similar Tasks**: Group all cash collections, then all restocking
- **Use Mobile Tools**: Take advantage of mobile-friendly features
- **Document Everything**: Photos and notes prevent disputes later
- **Plan Routes Smartly**: Minimize drive time between locations'),

-- Pipeline & Prospects
(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'pipeline'), 'Prospect Management Best Practices', 'prospect-management',
'# Prospect Management Best Practices

Convert more locations with these proven prospecting strategies and systematic follow-up processes.

## Qualifying Good Prospects

### High-Value Location Characteristics
- **High Foot Traffic**: 100+ people daily
- **Captive Audience**: Limited food/drink alternatives nearby  
- **Convenient Access**: Easy loading and servicing access
- **Secure Environment**: Low vandalism/theft risk
- **Supportive Management**: Enthusiastic about vending services

### Initial Research Checklist
- [ ] Employee/visitor count and schedules
- [ ] Existing vending situation (competitors, gaps)
- [ ] Decision maker identification
- [ ] Budget/commission expectations
- [ ] Timeline for implementation

## Prospecting Pipeline Stages

### 1. Lead Generation
**Sources**: Referrals, cold calling, online research, trade shows
**Activities**: Initial contact, qualify interest level
**Goal**: Schedule site visit within 1 week

### 2. Site Visit Scheduled  
**Preparation**: Research location, prepare presentation materials
**Activities**: Tour facility, meet decision makers, assess opportunity
**Goal**: Present formal proposal within 3 days

### 3. Proposal Sent
**Components**: Machine placement plan, product mix, commission structure
**Follow-up**: Call within 2 business days of sending
**Goal**: Schedule decision meeting within 1 week

### 4. Under Negotiation
**Activities**: Address concerns, adjust terms, provide references
**Timeline**: Most decisions made within 2-3 weeks
**Goal**: Secure signed agreement

### 5. Closed Won/Lost
**Won**: Begin installation scheduling and setup
**Lost**: Document reason, set follow-up reminder for future

## Communication Best Practices

### Initial Contact Scripts
**Cold Call Opening**: 
"Hi [Name], I''m [Your Name] from [Company]. We provide premium vending services to businesses like yours. Do you currently have vending machines, and are you happy with the service?"

**Email Follow-up**:
"Thank you for taking time to speak with me today. As discussed, I''d like to schedule a brief site visit to show you how we can improve your employee satisfaction while generating additional revenue for your organization."

### Objection Handling

**"We''re happy with our current vendor"**
Response: "That''s great to hear! What do you like most about them? I''d be happy to show you some additional services that might complement what you''re already receiving."

**"We don''t want to deal with vending issues"**  
Response: "I completely understand - that''s exactly why our full-service approach handles everything. You get the benefits without any of the headaches."

**"We don''t have space"**
Response: "Let me show you some compact options that might work. We''ve solved space challenges for many clients with creative placement solutions."

## Follow-up Scheduling

### Timeline Guidelines
- **Day 1**: Send thank you email with proposal
- **Day 3**: Follow-up call to confirm receipt
- **Week 1**: Check for questions or concerns
- **Week 2**: Decision timeline discussion
- **Week 3**: Final follow-up before moving to nurture

### Long-term Nurturing
- Quarterly check-ins with "no" prospects
- Share success stories and new offerings
- Maintain relationship for future opportunities
- Ask for referrals even from declined prospects'),

(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'pipeline'), 'Site Survey and Proposal Guide', 'site-survey-proposal',
'# Site Survey and Proposal Guide

Conduct thorough site assessments and create compelling proposals that win more business.

## Pre-Visit Preparation

### Research Checklist
- [ ] Company size and employee count
- [ ] Business hours and peak times  
- [ ] Current vending situation
- [ ] Facility layout (if available online)
- [ ] Decision maker titles and contact info

### Materials to Bring
- [ ] Measuring tape and level
- [ ] Camera for photos
- [ ] Product samples
- [ ] Competitor price comparison
- [ ] Reference letters and testimonials
- [ ] Contract templates

## Site Survey Process

### Environmental Assessment
**Location Factors**:
- Foot traffic patterns throughout the day
- Available floor space and ceiling height
- Electrical outlet locations (110V required)
- Climate control and environmental conditions
- Security cameras and lighting

**Access Considerations**:
- Loading dock or service entrance accessibility
- Elevator dimensions for machine delivery
- Parking availability for service vehicles
- Building access hours and security procedures

### Product Mix Planning
**Assess Demand**:
- Employee demographics and preferences
- Existing food service options
- Peak consumption times
- Special dietary requirements
- Price sensitivity analysis

**Space Optimization**:
- Measure available space precisely
- Consider machine size options
- Plan for ADA compliance
- Account for service clearance

## Proposal Development

### Financial Structure
**Commission Models**:
- **Percentage**: 15-25% of gross sales
- **Flat Rate**: Fixed monthly payment
- **Hybrid**: Guaranteed minimum plus percentage

**Additional Revenue Streams**:
- Advertising space on machines
- Event catering services
- Special product promotions
- Corporate account programs

### Service Package Components

**Included Services**:
- Machine installation and setup
- Regular restocking (2-3 times weekly)
- Maintenance and repairs
- Cash collection and reporting
- Product rotation and freshness management

**Value-Added Services**:
- Nutritional information and healthy options
- Seasonal product rotations
- Employee satisfaction surveys
- Custom pricing for special events

## Proposal Presentation

### Structure Your Presentation
1. **Introduction**: Your company and experience
2. **Needs Assessment**: What you observed during survey
3. **Recommended Solution**: Specific machines and placement
4. **Product Mix**: Tailored to their preferences
5. **Financial Terms**: Clear commission structure
6. **Service Standards**: Response times and guarantees
7. **Implementation Timeline**: Step-by-step process
8. **References**: Similar successful installations

### Closing Techniques
- **Assumptive Close**: "When would you like us to schedule installation?"
- **Choice Close**: "Would you prefer the snack machine in the break room or lobby?"
- **Urgency Close**: "We have an installation opening next week if you''d like to get started"

## Common Mistakes to Avoid

### During Survey
- ❌ Not measuring space accurately
- ❌ Failing to identify all decision makers  
- ❌ Overlooking electrical requirements
- ❌ Not assessing competition properly

### In Proposals
- ❌ Generic, one-size-fits-all presentations
- ❌ Focusing only on price competition
- ❌ Not addressing their specific needs
- ❌ Unclear service level commitments

## Follow-up Strategy

### Immediate Actions (24-48 hours)
- Send thank you email with proposal attached
- Provide additional information requested
- Schedule follow-up call within one week
- Connect on professional social media

### Ongoing Communication
- Weekly check-ins during decision period
- Share relevant case studies or testimonials
- Invite to visit existing successful installations
- Address concerns promptly and professionally'),

-- Machines & Technical
(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'machines'), 'Machine Installation Guide', 'machine-installation',
'# Machine Installation Guide

Ensure successful machine installations with proper planning, setup, and configuration procedures.

## Pre-Installation Planning

### Site Preparation Requirements
**Electrical**: 
- Dedicated 110V outlet within 6 feet
- 15-amp circuit recommended
- GFCI protection in wet areas
- Proper grounding verified

**Physical Space**:
- Level floor surface (within 1/4 inch)
- Minimum clearances: 3" sides, 6" back, 12" front
- Door swing clearance for service access
- ADA compliance if required

**Environmental**:
- Temperature range: 50-90°F
- Humidity below 80%
- Away from direct sunlight
- Protected from weather elements

### Documentation Needed
- [ ] Site survey measurements and photos
- [ ] Electrical certification
- [ ] Insurance certificates
- [ ] Installation permits (if required)
- [ ] Customer sign-off on placement

## Installation Process

### Day Before Installation
- [ ] Confirm installation time with location contact
- [ ] Verify truck route and parking availability
- [ ] Prepare installation kit and tools
- [ ] Load machine with initial inventory
- [ ] Test all machine functions

### Installation Day Steps

**1. Arrival and Setup (30 minutes)**
- Park vehicle safely with hazard lights
- Check in with location contact
- Clear installation path
- Unload equipment and tools

**2. Machine Positioning (45 minutes)**
- Move machine to exact position
- Level machine using adjustable legs
- Verify clearances and access
- Secure machine if required

**3. Electrical Connection (30 minutes)**
- Test outlet voltage and grounding
- Connect machine power cord
- Verify proper operation
- Label circuit breaker if needed

**4. Machine Configuration (60 minutes)**
- Set pricing for all products
- Configure payment systems
- Test all selection buttons
- Program telemetry settings
- Set temperature controls

**5. Initial Stocking (45 minutes)**
- Load products according to planogram
- Set initial inventory counts
- Test product dispensing
- Verify product selection accuracy

**6. Final Testing (20 minutes)**
- Test cash transactions
- Test credit card processing
- Verify change dispensing
- Check all safety features
- Document serial numbers

### Customer Handover
- [ ] Demonstrate basic operation
- [ ] Provide emergency contact information
- [ ] Review service schedule and procedures
- [ ] Obtain signed installation acceptance
- [ ] Take final photos for records

## Post-Installation Tasks

### Within 24 Hours
- [ ] Update machine status in system
- [ ] Send installation completion report
- [ ] Schedule first service visit
- [ ] Monitor telemetry for any issues
- [ ] Follow up with location contact

### First Week Monitoring
- [ ] Check daily sales reports
- [ ] Monitor for any fault codes
- [ ] Verify proper temperature control
- [ ] Confirm payment processing works
- [ ] Address any customer concerns

## Troubleshooting Common Issues

### Machine Won''t Start
**Check**: Power connection, circuit breaker, door switches
**Solution**: Verify proper electrical connection and door closure

### Products Won''t Vend
**Check**: Product alignment, motor connections, selection switches  
**Solution**: Realign products, test motors individually

### Payment System Issues
**Check**: Card reader connection, cash acceptor, change mechanism
**Solution**: Restart payment systems, verify communication settings

### Temperature Problems
**Check**: Thermostat setting, condenser coils, door seals
**Solution**: Adjust settings, clean coils, replace worn seals

## Safety and Compliance

### Safety Checklist
- [ ] Machine properly grounded
- [ ] No exposed electrical connections
- [ ] Safety labels visible and intact
- [ ] Proper ventilation clearances
- [ ] Secure mounting if required

### Regulatory Compliance
- [ ] ADA accessibility requirements met
- [ ] Local business license requirements
- [ ] Health department regulations followed
- [ ] Fire safety codes observed
- [ ] Insurance requirements satisfied

## Quality Assurance

### Installation Checklist
- [ ] Machine level and properly positioned
- [ ] All functions tested and working
- [ ] Pricing set correctly for all products
- [ ] Payment systems operational
- [ ] Telemetry reporting properly
- [ ] Customer satisfied with placement
- [ ] Documentation complete and filed

### Success Metrics
- Machine operational within 2 hours of arrival
- Zero customer complaints in first week
- Daily sales meet or exceed projections
- No service calls required in first month
- 100% payment system uptime'),

-- Inventory & Supply Chain
(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'supply'), 'Inventory Management Best Practices', 'inventory-management',
'# Inventory Management Best Practices

Optimize your inventory levels and reduce waste with systematic inventory control and forecasting.

## Inventory Fundamentals

### Key Concepts
**PAR Levels**: Minimum quantity to maintain in each slot
**Reorder Point**: When to trigger restocking
**Safety Stock**: Buffer inventory for unexpected demand
**Turnover Rate**: How quickly products sell

### Setting Optimal PAR Levels
**High-Traffic Locations**: 
- Set PAR at 3-5 days of average sales
- Monitor daily for fast-moving items
- Increase during peak seasons

**Low-Traffic Locations**:
- Set PAR at 5-7 days of average sales  
- Weekly monitoring sufficient
- Focus on longer shelf-life products

## Demand Forecasting

### Historical Analysis
**Weekly Patterns**:
- Monday-Friday business locations peak mid-week
- Healthcare facilities consistent throughout week
- Schools follow academic calendar patterns

**Seasonal Adjustments**:
- Summer: Increase cold beverages, reduce hot items
- Winter: Add hot beverages, hearty snacks
- Holidays: Plan for closure periods

### Product Performance Tracking
**A-B-C Classification**:
- **A Items** (20% of products, 80% of sales): Monitor daily
- **B Items** (30% of products, 15% of sales): Monitor weekly  
- **C Items** (50% of products, 5% of sales): Monitor monthly

## Restocking Procedures

### Pre-Restock Planning
- [ ] Review inventory reports
- [ ] Check expiration dates
- [ ] Plan route efficiency
- [ ] Prepare vehicle with supplies
- [ ] Verify product availability

### During Restocking
**Documentation Process**:
1. Record current quantities before adding stock
2. Note any expired or damaged products
3. Log actual quantities added to each slot
4. Update PAR levels if needed
5. Take photos of any issues

**Quality Control**:
- Check expiration dates on all products
- Rotate stock - first in, first out (FIFO)
- Clean machine interior and exterior
- Test product dispensing
- Verify pricing accuracy

### Post-Restock Tasks
- [ ] Update inventory system immediately
- [ ] Calculate restock efficiency metrics
- [ ] Plan next service visit
- [ ] Address any maintenance needs
- [ ] Update customer communication

## Waste Reduction Strategies

### Expiration Management
**Prevention**:
- Set expiration alerts 2 weeks before dates
- Implement automatic reorder points
- Track slow-moving products monthly
- Negotiate return policies with suppliers

**When Expired Products Found**:
- Remove immediately and document
- Determine root cause (slow sales, over-ordering)
- Adjust PAR levels accordingly
- Consider alternative products

### Damage Prevention
**Transportation**:
- Use proper shipping containers
- Secure products during transport
- Maintain appropriate temperatures
- Handle fragile items carefully

**Storage**:
- Climate-controlled warehouse space
- First-in, first-out rotation system
- Regular quality inspections
- Proper shelving and organization

## Supplier Relationship Management

### Supplier Selection Criteria
**Reliability**: On-time delivery track record
**Quality**: Consistent product standards
**Pricing**: Competitive wholesale rates
**Support**: Marketing materials and training

### Ordering Optimization
**Economic Order Quantities**:
- Balance storage costs with order frequency
- Take advantage of volume discounts
- Consider seasonal buying opportunities
- Plan for promotional periods

**Just-In-Time Principles**:
- Reduce carrying costs
- Minimize warehouse space needs
- Improve cash flow
- Reduce spoilage and obsolescence

## Technology Integration

### Automated Reordering
**Benefits**:
- Reduces stockouts by 60%
- Improves inventory turnover
- Minimizes manual errors
- Frees time for customer service

**Implementation**:
- Set reorder points based on historical data
- Configure automatic supplier notifications
- Monitor system performance weekly
- Adjust parameters based on results

### Telemetry Integration
**Real-Time Monitoring**:
- Track sales as they happen
- Identify fast-moving products immediately
- Receive low-stock alerts
- Monitor machine performance remotely

## Performance Metrics

### Key Performance Indicators
**Inventory Turnover**: Target 8-12 times per year
**Stockout Rate**: Keep below 5% for A items
**Spoilage Rate**: Target less than 2% of total inventory
**Fill Rate**: Achieve 95%+ customer satisfaction

### Monthly Review Process
- [ ] Analyze turnover rates by product
- [ ] Review spoilage and waste reports
- [ ] Update demand forecasts
- [ ] Adjust PAR levels as needed
- [ ] Evaluate supplier performance
- [ ] Plan inventory investments'),

-- Sales & Finance
(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'finance'), 'Commission and Revenue Management', 'commission-revenue',
'# Commission and Revenue Management

Maximize profitability through effective commission structures, accurate reporting, and strong financial controls.

## Commission Structure Design

### Common Commission Models

**Percentage-Based (Most Common)**:
- Range: 15-25% of gross sales
- Higher for premium locations
- Lower for high-volume accounts
- Transparent and easy to calculate

**Flat Rate Model**:
- Fixed monthly payment regardless of sales
- Provides predictable income to location
- Better for locations with consistent traffic
- Requires accurate sales forecasting

**Hybrid Model**:
- Guaranteed minimum plus percentage over threshold
- Example: $200 minimum + 15% over $1,000
- Provides security for both parties
- Popular with risk-averse customers

### Setting Commission Rates

**High-Value Locations (20-25%)**:
- Exclusive food service provider
- High foot traffic (500+ daily)
- Premium demographics
- Strong management support

**Standard Locations (15-20%)**:
- Moderate foot traffic (100-500 daily)
- Some competing food options
- Average demographics
- Standard management cooperation

**Challenging Locations (10-15%)**:
- Lower foot traffic (<100 daily)
- Multiple competing options
- Price-sensitive demographics
- Limited management support

## Revenue Optimization

### Pricing Strategy
**Market Research**:
- Survey local convenience store prices
- Consider customer price sensitivity
- Factor in your cost structure
- Account for commission obligations

**Dynamic Pricing**:
- Premium pricing in captive markets
- Competitive pricing where alternatives exist
- Promotional pricing for slow-moving items
- Seasonal adjustments for demand changes

### Product Mix Optimization
**High-Margin Categories**:
- Beverages: 60-70% gross margin
- Snacks: 40-50% gross margin  
- Healthy options: 50-60% gross margin
- Specialty items: 70-80% gross margin

**Space Allocation**:
- Allocate space based on profit per square inch
- Monitor velocity and adjust accordingly
- Test new products in high-performing locations
- Remove underperforming SKUs regularly

## Financial Reporting and Analysis

### Daily Cash Management
**Collection Procedures**:
- Count cash from each machine separately
- Verify against sales reports
- Document any discrepancies immediately
- Deposit cash within 24 hours

**Record Keeping**:
- Photo cash count before collection
- Log serial numbers of machines serviced
- Note any maintenance or service issues
- Update inventory levels in real-time

### Monthly Commission Calculations

**Commission Statement Components**:
1. **Gross Sales**: Total revenue for the period
2. **Net Sales**: Gross sales minus taxes and fees
3. **Commission Due**: Net sales × commission rate
4. **Adjustments**: Refunds, chargebacks, credits
5. **Payment Due**: Commission due minus adjustments

**Quality Assurance**:
- Reconcile sales reports with cash collections
- Verify credit card processing totals
- Cross-check with telemetry data
- Review for any unusual patterns

### Financial Performance Analysis

**Key Metrics to Track**:
- **Revenue per Machine per Day**: Target $25-50
- **Gross Margin**: Target 50-60% overall
- **Commission Cost**: Monitor as % of gross sales
- **Route Efficiency**: Revenue per service hour

**Monthly Review Process**:
- [ ] Compare actual vs. projected sales
- [ ] Analyze top and bottom performing locations
- [ ] Review commission rate competitiveness
- [ ] Identify opportunities for improvement
- [ ] Plan corrective actions for underperformers

## Cost Control and Profitability

### Direct Costs
**Product Costs**: 40-50% of retail price
**Commission Payments**: 15-25% of gross sales
**Transportation**: $5-15 per service stop
**Payment Processing**: 2-4% of card transactions

### Indirect Costs
**Insurance**: $200-500 per machine annually
**Licensing**: $50-200 per location annually
**Maintenance**: 3-5% of gross sales
**Administration**: 5-10% of gross sales

### Profitability Analysis
**Break-Even Calculation**:
- Fixed costs ÷ (Revenue per unit - Variable cost per unit)
- Include all direct and indirect costs
- Account for seasonal variations
- Plan for 20% contingency

**ROI Targets**:
- New installations: Break even within 6 months
- Mature locations: 25%+ annual ROI
- Premium locations: 35%+ annual ROI
- Marginal locations: 15% minimum ROI

## Technology and Automation

### Payment Processing
**Credit/Debit Cards**:
- Enable contactless payments (Apple Pay, Google Pay)
- Monitor processing fees monthly
- Negotiate better rates with processors
- Implement fraud protection measures

**Cash Management**:
- Use bill validators with counterfeit detection
- Regular cleaning and maintenance
- Monitor cash-to-card ratio trends
- Plan for cashless transition

### Reporting Automation
**Daily Reports**:
- Automated sales summaries
- Exception reports for unusual activity
- Low inventory alerts
- Machine malfunction notifications

**Monthly Statements**:
- Automated commission calculations
- Electronic delivery to customers
- Payment processing integration
- Detailed backup documentation

## Customer Relationship Management

### Communication Best Practices
**Regular Updates**:
- Monthly performance summaries
- Quarterly business reviews  
- Annual contract renewals
- Proactive issue resolution

**Value-Added Services**:
- Nutritional information programs
- Employee satisfaction surveys
- Seasonal product promotions
- Corporate catering opportunities

### Retention Strategies
**Performance Guarantees**:
- Service level commitments
- Revenue improvement plans
- Customer satisfaction metrics
- Competitive rate matching

**Partnership Development**:
- Joint marketing initiatives
- Employee wellness programs
- Sustainability partnerships
- Community involvement projects'),

-- Admin & Reports
(gen_random_uuid(), (SELECT id FROM help_categories WHERE slug = 'admin'), 'Advanced Reporting and Analytics', 'advanced-reporting',
'# Advanced Reporting and Analytics

Leverage data-driven insights to optimize operations, increase profitability, and grow your vending business strategically.

## Essential Business Reports

### Daily Operations Dashboard
**Key Metrics to Monitor**:
- Total daily sales across all machines
- Cash collection vs. credit card ratios
- Machine downtime and service alerts  
- Inventory levels and restock priorities
- Route efficiency and service times

**Action Items**:
- Identify machines requiring immediate attention
- Plan tomorrow''s service route
- Monitor unusual sales patterns
- Track progress toward monthly goals

### Weekly Performance Summary
**Sales Analysis**:
- Week-over-week growth trends
- Top and bottom performing locations
- Product category performance
- Customer traffic pattern analysis

**Operational Efficiency**:
- Service call frequency and resolution times
- Inventory turnover rates by location
- Commission payment accuracy
- Route optimization opportunities

### Monthly Business Review
**Financial Performance**:
- Revenue growth and profitability trends
- Cost analysis and margin optimization
- Commission payment reconciliation
- ROI analysis by machine and location

**Strategic Planning**:
- Market expansion opportunities
- Product mix optimization
- Contract renewal pipeline
- Competitive positioning analysis

## Advanced Analytics

### Sales Forecasting
**Trend Analysis**:
- Seasonal patterns and adjustments
- Holiday impact on sales volume
- Economic factors affecting demand
- New product introduction effects

**Predictive Modeling**:
- Use 12-24 months of historical data
- Account for external factors (weather, events)
- Apply statistical methods (moving averages, regression)
- Validate forecasts against actual results

### Customer Segmentation Analysis
**Location Types**:
- **Office Buildings**: Peak hours 10am-2pm, healthy options
- **Healthcare**: 24/7 demand, comfort foods
- **Manufacturing**: Shift-based patterns, hearty snacks
- **Education**: Academic calendar, budget-conscious

**Behavioral Patterns**:
- High-frequency, low-value transactions
- Seasonal preference changes
- Price sensitivity analysis
- Product loyalty and switching patterns

### Product Performance Analytics
**ABC Analysis**:
- **A Products** (Top 20%): Focus on availability and placement
- **B Products** (Middle 30%): Monitor regularly for optimization
- **C Products** (Bottom 50%): Evaluate for discontinuation

**Profitability Ranking**:
- Gross margin per unit
- Velocity (units sold per period)
- Profit per square inch of machine space
- Customer satisfaction scores

## Operational Intelligence

### Machine Performance Analytics
**Reliability Metrics**:
- Uptime percentage by machine and model
- Mean time between failures (MTBF)
- Service call frequency and causes
- Customer complaint correlation

**Revenue Optimization**:
- Sales per square foot analysis
- Optimal product mix by location type
- Dynamic pricing impact assessment
- Promotional effectiveness measurement

### Route Optimization Analytics
**Efficiency Metrics**:
- Average service time per machine
- Travel time vs. service time ratios
- Fuel costs per route mile
- Revenue per service hour

**Optimization Opportunities**:
- Identify clustering opportunities
- Evaluate service frequency adjustments
- Plan new location additions
- Assess route profitability

### Inventory Intelligence
**Demand Planning**:
- Safety stock optimization
- Economic order quantity analysis
- Supplier performance evaluation
- Seasonal inventory planning

**Waste Reduction**:
- Expiration tracking and prevention
- Slow-moving inventory identification
- Damage and shrinkage analysis
- Return and refund pattern analysis

## Custom Report Builder

### Report Design Principles
**Define Purpose**: What decision will this report support?
**Identify Audience**: Who needs this information and how often?
**Select Metrics**: Which KPIs are most relevant?
**Choose Format**: Dashboard, summary, or detailed report?

### Common Custom Reports
**Location Performance Scorecard**:
- Sales trends and growth rates
- Profitability and margin analysis
- Service level metrics
- Customer satisfaction scores

**Product Mix Optimization Report**:
- Sales velocity by product and location
- Margin analysis and profitability ranking
- Space allocation recommendations
- Discontinued product impact assessment

**Competitor Analysis Report**:
- Market share by location type
- Pricing comparison and positioning
- Service level benchmarking
- Win/loss analysis for new accounts

## Data Quality and Governance

### Data Accuracy Standards
**Daily Validation**:
- Cash collection reconciliation
- Credit card processing verification
- Inventory transaction accuracy
- Machine status confirmation

**Monthly Auditing**:
- Commission calculation verification
- Financial statement reconciliation
- Customer satisfaction survey analysis
- Operational metric validation

### Performance Benchmarking
**Industry Standards**:
- Revenue per machine per day: $25-50
- Gross margin target: 50-60%
- Service call response time: <24 hours
- Customer retention rate: >90%

**Internal Benchmarks**:
- Top quartile location performance
- Best practice operational procedures
- Highest performing product mixes
- Most efficient service routes

## Actionable Insights Framework

### Daily Actions
- Review overnight sales and identify anomalies
- Prioritize service calls based on revenue impact  
- Adjust inventory orders based on consumption
- Monitor competitor activities and respond

### Weekly Actions  
- Analyze performance trends and patterns
- Optimize product mix based on sales data
- Review and adjust service routes
- Plan promotional activities and pricing changes

### Monthly Actions
- Conduct comprehensive business review
- Update forecasts and budgets
- Evaluate strategic initiatives
- Plan next month''s priorities and investments

### Quarterly Actions
- Strategic planning and goal setting
- Market analysis and competitive positioning
- Technology upgrade planning
- Partnership and expansion evaluation

## Technology Integration

### Business Intelligence Tools
**Dashboard Creation**:
- Real-time performance monitoring
- Exception reporting and alerts
- Mobile-friendly design
- Automated refresh schedules

**Advanced Analytics**:
- Statistical analysis and modeling
- Machine learning for demand forecasting
- Optimization algorithms for routing
- Predictive maintenance scheduling

### Integration Capabilities
**Financial Systems**: Automated commission calculations and payments
**Inventory Management**: Real-time stock levels and reorder points
**Customer Management**: Automated communication and reporting
**Mobile Applications**: Field service and data collection tools')

-- Insert more help articles for remaining categories
ON CONFLICT (slug) DO NOTHING;