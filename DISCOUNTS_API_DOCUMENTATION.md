# Discounts API Documentation

## Overview
A comprehensive discount system has been added to your application. This allows you to apply discounts to individual menu items, multiple items, or all menu items in your catalog. The system supports percentage-based and fixed-amount discounts with optional start and end dates.

## Features

### Discount Types
1. **Percentage Discount**: Reduces price by a percentage (0-100%)
2. **Fixed Amount Discount**: Reduces price by a fixed monetary amount

### Discount Scopes
1. **Specific Items**: Apply discount to selected menu items
2. **All Items**: Apply discount to entire menu catalog

### Discount Properties
Each discount includes the following fields:
- **name**: Discount name (required)
- **description**: Detailed description (optional)
- **type**: `percentage` or `fixed_amount` (required)
- **value**: Discount value (0-100 for percentage, any positive number for fixed) (required)
- **scope**: `specific_items` or `all_items` (required)
- **menuItemIds**: Array of menu item IDs (required if scope is `specific_items`)
- **isActive**: Whether the discount is currently active (default: true)
- **startDate**: When the discount becomes active (optional)
- **endDate**: When the discount expires (optional)
- **createdAt**: Timestamp of creation (auto-generated)
- **updatedAt**: Timestamp of last update (auto-generated)

## API Endpoints

**Total Endpoints**: 15

### 1. Create Discount
**POST** `/discounts`

**Authentication**: Required (JWT)

**Body Parameters**:
```json
{
  "name": "Summer Sale",
  "description": "15% off selected items",
  "type": "percentage",
  "value": 15,
  "scope": "specific_items",
  "menuItemIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "isActive": true,
  "startDate": "2025-08-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z"
}
```

**Example - Store-Wide Discount**:
```json
{
  "name": "Weekend Special",
  "description": "10% off everything",
  "type": "percentage",
  "value": 10,
  "scope": "all_items",
  "isActive": true
}
```

**Example - Fixed Amount Discount**:
```json
{
  "name": "$5 Off Premium Items",
  "description": "Save $5 on premium dishes",
  "type": "fixed_amount",
  "value": 5.00,
  "scope": "specific_items",
  "menuItemIds": ["uuid-1", "uuid-2"]
}
```

**Response**: Created discount object

---

### 2. Get All Discounts
**GET** `/discounts`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term to filter by name or description
- `isActive` (optional): Filter by active status (true/false)
- `scope` (optional): Filter by scope (`specific_items` or `all_items`)

**Example**: `GET /discounts?page=1&limit=10&isActive=true`

**Response**: Paginated list of discounts with associated menu items

---

### 3. Get Active Discounts Only
**GET** `/discounts/active`

Returns only active discounts (shortcut for `isActive=true`).

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example**: `GET /discounts/active?limit=20`

**Response**: Paginated list of active discounts

---

### 4. Get Active Discounts for a Menu Item
**GET** `/discounts/menu-item/:menuItemId`

Returns all active discounts that apply to a specific menu item (includes both specific and all-items discounts).

**Example**: `GET /discounts/menu-item/123e4567-e89b-12d3-a456-426614174000`

**Response**: Array of applicable discounts

---

### 5. Get Best Discount for a Menu Item
**GET** `/discounts/menu-item/:menuItemId/best`

Returns the best discount (lowest final price) for a menu item.

**Example**: `GET /discounts/menu-item/123e4567-e89b-12d3-a456-426614174000/best`

**Response**: 
```json
{
  "discount": {
    "id": "discount-uuid",
    "name": "Summer Sale",
    "type": "percentage",
    "value": 15
  },
  "discountedPrice": 17.00,
  "originalPrice": 20.00
}
```

If no discount applies:
```json
{
  "discount": null,
  "discountedPrice": 20.00,
  "originalPrice": 20.00
}
```

---

### 6. Get Single Discount
**GET** `/discounts/:id`

**Example**: `GET /discounts/123e4567-e89b-12d3-a456-426614174000`

**Response**: Single discount object with associated menu items

---

### 7. Update Discount
**PATCH** `/discounts/:id`

**Authentication**: Required (JWT)

**Body Parameters**: Same as Create Discount (all optional)

**Example**: `PATCH /discounts/123e4567-e89b-12d3-a456-426614174000`

```json
{
  "value": 20,
  "isActive": false
}
```

**Response**: Updated discount object

---

### 8. Toggle Discount Active Status
**PATCH** `/discounts/:id/toggle`

**Authentication**: Required (JWT)

Quickly toggle a discount's active status.

**Example**: `PATCH /discounts/123e4567-e89b-12d3-a456-426614174000/toggle`

**Response**: Updated discount object

---

### 9. Add Menu Items to Discount
**POST** `/discounts/:id/menu-items`

**Authentication**: Required (JWT)

Add more menu items to an existing discount (only works with `specific_items` scope).

**Body**:
```json
{
  "menuItemIds": ["uuid-4", "uuid-5"]
}
```

**Response**: Updated discount with new items added

---

### 10. Add All Menu Items to Discount
**POST** `/discounts/:id/menu-items/all`

**Authentication**: Required (JWT)

Add ALL menu items in the system to a discount (only works with `specific_items` scope). This is a convenient endpoint to quickly apply a discount to your entire menu without manually specifying all item IDs.

**Example**: `POST /discounts/123e4567-e89b-12d3-a456-426614174000/menu-items/all`

**Response**: Updated discount with all menu items added

**Note**: This replaces the existing menu items with all available items. If you want a true "all items" discount that automatically includes future menu items, use `scope: "all_items"` when creating the discount instead.

---

### 11. Remove Menu Items from Discount
**DELETE** `/discounts/:id/menu-items`

**Authentication**: Required (JWT)

Remove specific menu items from a discount.

**Body**:
```json
{
  "menuItemIds": ["uuid-1", "uuid-2"]
}
```

**Response**: Updated discount with items removed

---

### 12. Remove All Menu Items from Discount
**DELETE** `/discounts/:id/menu-items/all`

**Authentication**: Required (JWT)

Remove ALL menu items from a discount with a single call. This clears the discount's menu items list completely (only works with `specific_items` scope).

**Example**: `DELETE /discounts/123e4567-e89b-12d3-a456-426614174000/menu-items/all`

**Response**: Updated discount with empty menu items array

**Use Case**: Perfect for resetting a discount before assigning new items, or temporarily deactivating a discount without deleting it.

---

### 13. Delete Discount
**DELETE** `/discounts/:id`

**Authentication**: Required (JWT)

**Example**: `DELETE /discounts/123e4567-e89b-12d3-a456-426614174000`

**Response**: Success message

---

## Integration with Menu Items

### Automatic Discount Application

When you fetch menu items through the menu items API (`/menu-items` or `/menu-items/:id`), the system automatically:

1. Calculates the best applicable discount
2. Adds `discountedPrice` field to the response
3. Adds `activeDiscount` object with discount details

**Menu Item Response Example**:
```json
{
  "id": "menu-item-uuid",
  "name": "Grilled Salmon",
  "price": 25.00,
  "discountedPrice": 21.25,
  "activeDiscount": {
    "id": "discount-uuid",
    "name": "Summer Sale",
    "type": "percentage",
    "value": 15
  },
  "imageUrl": "...",
  "description": "...",
  // ... other fields
}
```

If no discount applies:
```json
{
  "id": "menu-item-uuid",
  "name": "Grilled Salmon",
  "price": 25.00,
  "discountedPrice": 25.00,
  "activeDiscount": null,
  // ... other fields
}
```

## Usage Examples

### Frontend Integration

#### Add All Menu Items to Discount
```javascript
const addAllItemsToDiscount = async (discountId) => {
  const response = await fetch(`/discounts/${discountId}/menu-items/all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const updatedDiscount = await response.json();
  console.log(`Added ${updatedDiscount.menuItems.length} items to discount`);
  return updatedDiscount;
};
```

#### Add Specific Menu Items to Discount
```javascript
const addItemsToDiscount = async (discountId, itemIds) => {
  const response = await fetch(`/discounts/${discountId}/menu-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      menuItemIds: itemIds
    })
  });
  
  return await response.json();
};
```

#### Remove All Menu Items from Discount
```javascript
const removeAllItemsFromDiscount = async (discountId) => {
  const response = await fetch(`/discounts/${discountId}/menu-items/all`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const updatedDiscount = await response.json();
  console.log(`Removed all items. Discount now has ${updatedDiscount.menuItems.length} items`);
  return updatedDiscount;
};
```

#### Remove Specific Menu Items from Discount
```javascript
const removeItemsFromDiscount = async (discountId, itemIds) => {
  const response = await fetch(`/discounts/${discountId}/menu-items`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      menuItemIds: itemIds
    })
  });
  
  return await response.json();
};
```

#### Create a Percentage Discount for Multiple Items
```javascript
const createDiscount = async () => {
  const response = await fetch('/discounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      name: '20% Off Appetizers',
      description: 'Special discount on all appetizers',
      type: 'percentage',
      value: 20,
      scope: 'specific_items',
      menuItemIds: ['item-1', 'item-2', 'item-3'],
      isActive: true,
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-30T23:59:59Z'
    })
  });
  
  const discount = await response.json();
  console.log('Discount created:', discount);
};
```

#### Create a Store-Wide Discount
```javascript
const createStoreWideDiscount = async () => {
  const response = await fetch('/discounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      name: 'Black Friday Sale',
      description: '25% off everything!',
      type: 'percentage',
      value: 25,
      scope: 'all_items',
      isActive: true,
      startDate: '2025-11-29T00:00:00Z',
      endDate: '2025-11-29T23:59:59Z'
    })
  });
  
  return await response.json();
};
```

#### Display Menu Items with Discounts
```javascript
const getMenuWithDiscounts = async () => {
  const response = await fetch('/menu-items?limit=20');
  const { data: menuItems } = await response.json();
  
  menuItems.forEach(item => {
    if (item.activeDiscount) {
      console.log(`${item.name}: $${item.price} → $${item.discountedPrice}`);
      console.log(`Discount: ${item.activeDiscount.name}`);
    } else {
      console.log(`${item.name}: $${item.price} (no discount)`);
    }
  });
};
```

#### Check if an Item Has a Discount
```javascript
const checkDiscount = async (menuItemId) => {
  const response = await fetch(`/discounts/menu-item/${menuItemId}/best`);
  const result = await response.json();
  
  if (result.discount) {
    const savings = result.originalPrice - result.discountedPrice;
    return {
      hasDiscount: true,
      discountName: result.discount.name,
      savings: savings,
      percentage: (savings / result.originalPrice * 100).toFixed(0)
    };
  }
  
  return { hasDiscount: false };
};
```

#### Toggle Discount On/Off
```javascript
const toggleDiscount = async (discountId) => {
  const response = await fetch(`/discounts/${discountId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const updatedDiscount = await response.json();
  console.log(`Discount is now ${updatedDiscount.isActive ? 'active' : 'inactive'}`);
};
```

## Business Logic

### Discount Priority
When multiple discounts apply to the same item:
- The system automatically selects the discount that results in the **lowest final price**
- Only one discount is applied per item (no stacking)

### Date-Based Activation
- Discounts with `startDate` will only apply from that date forward
- Discounts with `endDate` will stop applying after that date
- Discounts without dates are always active (if `isActive` is true)

### Validation Rules
1. Percentage discounts must be between 0 and 100
2. Fixed amount discounts must be positive numbers
3. End date must be after start date
4. `specific_items` scope requires at least one menu item
5. `all_items` scope cannot have menu items specified

## Database Schema

### Discount Entity
- `id`: UUID primary key
- `name`: String
- `description`: Text (nullable)
- `type`: Enum (percentage, fixed_amount)
- `value`: Decimal(10,2)
- `scope`: Enum (specific_items, all_items)
- `isActive`: Boolean
- `startDate`: Timestamp (nullable)
- `endDate`: Timestamp (nullable)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Discount-MenuItem Relationship
- Many-to-many relationship via `discount_menu_items` join table
- A discount can have multiple menu items
- A menu item can have multiple discounts

## Common Use Cases

### 1. Happy Hour Discount
```json
{
  "name": "Happy Hour",
  "type": "percentage",
  "value": 30,
  "scope": "specific_items",
  "menuItemIds": ["drinks-1", "drinks-2"],
  "startDate": "2025-11-10T17:00:00Z",
  "endDate": "2025-11-10T19:00:00Z",
  "isActive": true
}
```

### 2. Buy More, Save More
```json
{
  "name": "$10 Off Premium Items",
  "type": "fixed_amount",
  "value": 10,
  "scope": "specific_items",
  "menuItemIds": ["premium-1", "premium-2", "premium-3"],
  "isActive": true
}
```

### 3. Flash Sale
```json
{
  "name": "Flash Sale - 50% Off Everything!",
  "type": "percentage",
  "value": 50,
  "scope": "all_items",
  "startDate": "2025-12-01T12:00:00Z",
  "endDate": "2025-12-01T14:00:00Z",
  "isActive": true
}
```

### 4. Seasonal Promotion
```json
{
  "name": "Winter Special",
  "type": "percentage",
  "value": 15,
  "scope": "specific_items",
  "menuItemIds": ["soup-1", "hot-drink-1", "stew-1"],
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2026-02-28T23:59:59Z",
  "isActive": true
}
```

## Files Created

1. **Entity**: `src/discounts/entities/discount.entity.ts`
2. **DTOs**: 
   - `src/dto/discount/create-discount.dto.ts`
   - `src/dto/discount/update-discount.dto.ts`
   - `src/dto/discount/index.ts`
3. **Service**: `src/discounts/discounts.service.ts`
4. **Controller**: `src/discounts/discounts.controller.ts`
5. **Module**: `src/discounts/discounts.module.ts`

## Files Modified

1. `src/menu-item/entities/menu-item.entity.ts` - Added discount virtual properties
2. `src/menu-item/menu-item.service.ts` - Added discount calculation integration
3. `src/menu-item/menu-item.module.ts` - Added DiscountsModule import
4. `src/app.module.ts` - Registered DiscountsModule
5. `src/dto/index.ts` - Exported discount DTOs

## Notes

- All discount operations (create, update, delete) require authentication
- Discounts are automatically applied when fetching menu items
- The system always applies the best discount (lowest price) for customers
- Inactive discounts are not applied to menu items
- Expired discounts (past endDate) are not applied
- Future discounts (before startDate) are not applied

## Swagger Documentation

All endpoints are documented with Swagger/OpenAPI. Access the interactive API documentation at:
```
http://your-server-url/api
```

This provides a user-friendly interface to test all the discount endpoints.

