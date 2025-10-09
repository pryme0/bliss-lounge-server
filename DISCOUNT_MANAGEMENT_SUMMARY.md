# Discount Management - Complete Summary

## Quick Reference: Menu Item Management Endpoints

### Adding Items to Discount

| Method | Endpoint | Use Case |
|--------|----------|----------|
| `POST` | `/discounts/:id/menu-items` | Add specific items (provide IDs in body) |
| `POST` | `/discounts/:id/menu-items/all` | Add ALL items in one call (no body needed) |

### Removing Items from Discount

| Method | Endpoint | Use Case |
|--------|----------|----------|
| `DELETE` | `/discounts/:id/menu-items` | Remove specific items (provide IDs in body) |
| `DELETE` | `/discounts/:id/menu-items/all` | Remove ALL items in one call (no body needed) |

---

## Usage Examples

### Add ALL Menu Items to Discount
```bash
# Simple POST request - no body needed
curl -X POST \
  http://localhost:3000/discounts/abc-123/menu-items/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```javascript
// JavaScript/Frontend
const addAllItems = async (discountId) => {
  const response = await fetch(`/discounts/${discountId}/menu-items/all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const discount = await response.json();
  console.log(`✅ Added ${discount.menuItems.length} items to discount`);
  return discount;
};
```

---

### Remove ALL Menu Items from Discount
```bash
# Simple DELETE request - no body needed
curl -X DELETE \
  http://localhost:3000/discounts/abc-123/menu-items/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```javascript
// JavaScript/Frontend
const removeAllItems = async (discountId) => {
  const response = await fetch(`/discounts/${discountId}/menu-items/all`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const discount = await response.json();
  console.log(`✅ Removed all items. Now has ${discount.menuItems.length} items`);
  return discount;
};
```

---

### Add Specific Menu Items
```bash
curl -X POST \
  http://localhost:3000/discounts/abc-123/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuItemIds": ["item-1", "item-2", "item-3"]
  }'
```

```javascript
const addSpecificItems = async (discountId, itemIds) => {
  const response = await fetch(`/discounts/${discountId}/menu-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({ menuItemIds: itemIds })
  });
  
  return await response.json();
};
```

---

### Remove Specific Menu Items
```bash
curl -X DELETE \
  http://localhost:3000/discounts/abc-123/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuItemIds": ["item-1", "item-2"]
  }'
```

```javascript
const removeSpecificItems = async (discountId, itemIds) => {
  const response = await fetch(`/discounts/${discountId}/menu-items`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({ menuItemIds: itemIds })
  });
  
  return await response.json();
};
```

---

## Common Workflows

### 1. Reset and Reassign Items
```javascript
// Step 1: Remove all items
await removeAllItems(discountId);

// Step 2: Add new specific items
await addSpecificItems(discountId, ['new-item-1', 'new-item-2']);
```

### 2. Quick Store-Wide Discount
```javascript
// Option A: Use ALL_ITEMS scope (recommended for true store-wide)
const discount = await createDiscount({
  name: 'Flash Sale',
  type: 'percentage',
  value: 50,
  scope: 'all_items'  // Automatically includes future items
});

// Option B: Use SPECIFIC_ITEMS with all current items
const discount = await createDiscount({
  name: 'Flash Sale',
  type: 'percentage',
  value: 50,
  scope: 'specific_items'
});
await addAllItems(discount.id);  // Adds all current items
```

### 3. Category-Based Discount
```javascript
// Get all appetizer IDs
const appetizers = await fetch('/menu-items?categoryId=appetizers-uuid');
const appetizerIds = appetizers.data.map(item => item.id);

// Create and apply discount
const discount = await createDiscount({
  name: 'Appetizer Special',
  type: 'percentage',
  value: 25,
  scope: 'specific_items',
  menuItemIds: appetizerIds
});
```

---

## Key Differences

### `scope: all_items` vs Adding All Items

| Feature | `scope: all_items` | Add All Items Endpoint |
|---------|-------------------|------------------------|
| **Endpoint** | Set during creation | `POST /menu-items/all` |
| **Future Items** | ✅ Auto-included | ❌ Not included |
| **Can Remove Items** | ❌ No | ✅ Yes |
| **Management** | Less flexible | More flexible |
| **Best For** | True store-wide sales | Current catalog only |

### When to Use What

**Use `scope: all_items`:**
- Flash sales affecting everything
- Store-wide seasonal promotions
- No need to exclude specific items
- Want future items auto-included

**Use `specific_items` + Add All:**
- Want to start with all items but exclude some later
- Need granular control
- Testing discounts before going live
- Current catalog only

---

## Admin Panel Integration Tips

### 1. Bulk Management UI
```javascript
// Admin panel component
const DiscountManager = ({ discountId }) => {
  const handleAddAll = async () => {
    try {
      const result = await addAllItems(discountId);
      showToast(`Successfully added ${result.menuItems.length} items`);
    } catch (error) {
      showError('Failed to add items');
    }
  };

  const handleRemoveAll = async () => {
    if (confirm('Remove all items from this discount?')) {
      await removeAllItems(discountId);
      showToast('All items removed');
    }
  };

  return (
    <div>
      <button onClick={handleAddAll}>Add All Items</button>
      <button onClick={handleRemoveAll}>Remove All Items</button>
    </div>
  );
};
```

### 2. Item Selection with "Select All"
```javascript
const [selectedItems, setSelectedItems] = useState([]);
const [allItems, setAllItems] = useState([]);

const handleSelectAll = () => {
  setSelectedItems(allItems.map(item => item.id));
};

const handleApplyDiscount = async () => {
  if (selectedItems.length === allItems.length) {
    // Use the convenient "add all" endpoint
    await addAllItems(discountId);
  } else {
    // Add specific items
    await addSpecificItems(discountId, selectedItems);
  }
};
```

---

## API Response Examples

### After Adding All Items
```json
{
  "id": "discount-uuid",
  "name": "Summer Sale",
  "type": "percentage",
  "value": 15,
  "scope": "specific_items",
  "isActive": true,
  "menuItems": [
    {
      "id": "item-1",
      "name": "Grilled Salmon",
      "price": 25.00
    },
    {
      "id": "item-2",
      "name": "Caesar Salad",
      "price": 12.00
    }
    // ... all other menu items
  ],
  "createdAt": "2025-10-01T10:00:00Z",
  "updatedAt": "2025-10-09T15:30:00Z"
}
```

### After Removing All Items
```json
{
  "id": "discount-uuid",
  "name": "Summer Sale",
  "type": "percentage",
  "value": 15,
  "scope": "specific_items",
  "isActive": true,
  "menuItems": [],  // Empty array
  "createdAt": "2025-10-01T10:00:00Z",
  "updatedAt": "2025-10-09T15:35:00Z"
}
```

---

## Complete Endpoint List (15 Total)

1. ✅ `POST /discounts` - Create discount
2. ✅ `GET /discounts` - List all discounts
3. ✅ `GET /discounts/active` - List active discounts
4. ✅ `GET /discounts/:id` - Get single discount
5. ✅ `GET /discounts/menu-item/:menuItemId` - Get discounts for item
6. ✅ `GET /discounts/menu-item/:menuItemId/best` - Get best discount for item
7. ✅ `PATCH /discounts/:id` - Update discount
8. ✅ `PATCH /discounts/:id/toggle` - Toggle active status
9. ✅ `POST /discounts/:id/menu-items` - **Add specific items**
10. ✅ `POST /discounts/:id/menu-items/all` - **Add ALL items** ⭐ NEW
11. ✅ `DELETE /discounts/:id/menu-items` - **Remove specific items**
12. ✅ `DELETE /discounts/:id/menu-items/all` - **Remove ALL items** ⭐ NEW
13. ✅ `DELETE /discounts/:id` - Delete discount

---

## Error Handling

```javascript
try {
  await addAllItems(discountId);
} catch (error) {
  if (error.status === 400) {
    // Bad request - might be ALL_ITEMS scope
    console.error('Cannot add items to ALL_ITEMS discount');
  } else if (error.status === 404) {
    // Discount not found
    console.error('Discount not found');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Notes

- ✅ All management endpoints require JWT authentication
- ✅ `add/remove all` only works with `specific_items` scope
- ✅ Operations are idempotent (safe to call multiple times)
- ✅ Both add/remove return the updated discount object
- ✅ Menu items array is populated in responses

