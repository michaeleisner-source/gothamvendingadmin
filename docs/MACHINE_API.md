# Vending Machine API Integration

This document outlines the API endpoints for integrating vending machines with the platform. These endpoints support industry-standard protocols like DEX (Digital Exchange) and MDB (Multi-Drop Bus) data formats.

## Authentication

All endpoints require the machine to be registered in the system with a valid `machine_id` and `org_id`. No JWT authentication is required for machine-to-platform communication.

## Base URL

Production: `https://wmbrnfocnlkhqflliaup.supabase.co/functions/v1/`
Development: `http://localhost:54328/functions/v1/`

## Endpoints

### 1. Machine Telemetry (`/machine-telemetry`)

**Method:** POST  
**Purpose:** Send machine health and status telemetry data

**Request Body:**
```json
{
  "machine_id": "uuid",
  "org_id": "uuid", 
  "recorded_at": "2024-09-19T16:30:00Z", // optional, defaults to now
  "telemetry_data": {
    "temperature": 38.5,
    "cash_level_cents": 15750,
    "network_status": "online", // "online" | "offline" | "weak"
    "error_codes": ["E001", "E024"], // array of error codes
    "last_sale_at": "2024-09-19T15:45:00Z",
    "coin_jam_count": 0,
    "bill_jam_count": 1,
    "door_open_alerts": 0,
    "power_cycles": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Telemetry data processed successfully"
}
```

### 2. Sales Data (`/machine-sales`)

**Method:** POST  
**Purpose:** Record sales transactions from the machine

**Request Body (Single Sale):**
```json
{
  "machine_id": "uuid",
  "org_id": "uuid",
  "occurred_at": "2024-09-19T16:30:00Z", // optional
  "sales_data": {
    "product_id": "uuid",
    "qty": 1,
    "unit_price_cents": 150,
    "unit_cost_cents": 75,
    "payment_method": "credit_card", // "cash" | "credit_card" | "mobile" | "campus_card"
    "session_duration_seconds": 45
  }
}
```

**Request Body (Multiple Sales):**
```json
{
  "machine_id": "uuid",
  "org_id": "uuid", 
  "occurred_at": "2024-09-19T16:30:00Z",
  "sales_data": [
    {
      "product_id": "uuid",
      "qty": 2,
      "unit_price_cents": 150,
      "unit_cost_cents": 75,
      "payment_method": "cash"
    },
    {
      "product_id": "uuid", 
      "qty": 1,
      "unit_price_cents": 200,
      "unit_cost_cents": 100,
      "payment_method": "credit_card"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 sales",
  "results": [
    {
      "product_id": "uuid",
      "success": true,
      "sale_id": "uuid"
    }
  ]
}
```

### 3. Inventory Sync (`/machine-inventory-sync`)

**Method:** POST  
**Purpose:** Sync current inventory levels from machine sensors

**Request Body:**
```json
{
  "machine_id": "uuid",
  "org_id": "uuid",
  "sync_type": "full", // "full" | "delta"
  "inventory_data": [
    {
      "slot_id": "uuid",
      "product_id": "uuid",
      "current_qty": 12,
      "par_level": 20,
      "reorder_point": 5
    },
    {
      "slot_id": "uuid",
      "product_id": "uuid", 
      "current_qty": 2,
      "par_level": 15,
      "reorder_point": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 inventory slots",
  "low_stock_count": 1,
  "results": [
    {
      "slot_id": "uuid",
      "success": true,
      "current_qty": 2,
      "low_stock": true
    }
  ]
}
```

### 4. Machine Status (`/machine-status`)

**Method:** POST  
**Purpose:** Update machine operational status and performance metrics

**Request Body:**
```json
{
  "machine_id": "uuid",
  "org_id": "uuid",
  "timestamp": "2024-09-19T16:30:00Z",
  "status_data": {
    "status": "online", // "online" | "offline" | "maintenance" | "error"
    "error_message": "Optional error description",
    "maintenance_required": false,
    "maintenance_message": "Optional maintenance note",
    "metrics": {
      "total_transactions": 45,
      "failed_transactions": 2,
      "total_sales_cents": 6750,
      "cash_collected_cents": 2250,
      "products_dispensed": 45,
      "uptime_minutes": 1440,
      "downtime_minutes": 15,
      "energy_consumption_kwh": 12.5,
      "temperature_avg": 38.2
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Machine status updated successfully",
  "alerts_created": 0
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing required fields)
- `500` - Internal Server Error

Error responses include details:
```json
{
  "error": "Missing required fields: machine_id, org_id, telemetry_data",
  "details": "Additional error context"
}
```

## Integration Notes

### DEX Protocol Support
- Sales data format compatible with DEX audit trail standards
- Inventory tracking follows DEX UCS (Universal Communication Standard)
- Telemetry data includes standard DEX health metrics

### MDB Protocol Support  
- Error codes map to standard MDB peripheral status codes
- Cash handling data follows MDB cash box protocols
- Payment method detection supports MDB payment device types

### Data Frequency
- **Telemetry:** Every 15-30 minutes or on status change
- **Sales:** Real-time after each transaction
- **Inventory:** Every hour or after significant stock changes  
- **Status:** Every 5 minutes (heartbeat) + on status changes

### Security
- Use HTTPS for all communications
- Validate machine_id and org_id on each request
- Consider implementing API keys for additional security

### Testing
Use these endpoints to test integration:
1. Send telemetry data every few minutes
2. Record sales as they occur
3. Sync inventory levels periodically
4. Update status on machine state changes