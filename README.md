# CodeAlpha Restaurant Management System

Backend Development Internship — Task 3.

This implementation follows the Task 3 requirements: Express.js backend, models for menu items, orders, tables, reservations and inventory, APIs for ordering, table reservations, inventory updates and menu viewing, plus order processing, table availability checks and inventory management. Reporting/admin functionality is included in a limited form where useful.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS

## Project structure

```text
CodeAlpha_Restaurant_Management_System/
├── src/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Inventory.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Reservation.js
│   │   ├── Table.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── menuRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reservationRoutes.js
│   │   └── tableRoutes.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Setup

1. Install Node.js and MongoDB.
2. Run:

```bash
npm install
```

3. Copy `.env.example` to `.env`.
4. Configure:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/codealpha_restaurant
JWT_SECRET=your_secret
```

5. Start:

```bash
npm run dev
```

or:

```bash
npm start
```

API base URL:

```text
http://localhost:5000
```

## Roles

New accounts are customers by default.

Staff/admin accounts can manage menu items, tables, orders and inventory. For testing, change a user's role directly in MongoDB to `staff` or `admin`.

## API endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create customer account |
| POST | `/api/auth/login` | Login |

### Menu

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/menu` | No | View menu |
| POST | `/api/menu` | Staff | Add menu item |
| PUT | `/api/menu/:id` | Staff | Update menu item |
| DELETE | `/api/menu/:id` | Staff | Delete menu item |

### Tables

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tables` | No | View tables |
| GET | `/api/tables/availability?date=...` | No | Check table availability |
| POST | `/api/tables` | Staff | Add table |
| PATCH | `/api/tables/:id/status` | Staff | Update table status |

### Reservations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/reservations` | Yes | Reserve table |
| GET | `/api/reservations/my` | Yes | View own reservations |
| GET | `/api/reservations` | Staff | View all reservations |
| DELETE | `/api/reservations/:id` | Yes | Cancel own reservation |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders/my` | Yes | View own orders |
| GET | `/api/orders` | Staff | View all orders |
| PATCH | `/api/orders/:id/status` | Staff | Update order status |

### Inventory

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/inventory` | No | View inventory |
| GET | `/api/inventory/alerts` | Staff | View low-stock alerts |
| POST | `/api/inventory` | Staff | Add inventory item |
| PATCH | `/api/inventory/:id` | Staff | Update inventory item |
| PATCH | `/api/inventory/:id/adjust` | Staff | Increase/decrease stock |

## Example requests

### Register

```json
POST /api/auth/register

{
  "name": "Rawad",
  "email": "rawad@example.com",
  "password": "password123"
}
```

### Create a menu item

```json
POST /api/menu

{
  "name": "Chicken Fajita",
  "description": "Grilled chicken with peppers and onions",
  "category": "Main Course",
  "price": 12.5,
  "available": true
}
```

### Create a table

```json
POST /api/tables

{
  "tableNumber": 1,
  "seats": 4
}
```

### Reserve a table

```json
POST /api/reservations

{
  "tableId": "TABLE_ID_HERE",
  "date": "2027-01-20T19:00:00.000Z",
  "guests": 4
}
```

The system checks table capacity and prevents conflicting reservations in the two-hour reservation window.

### Place an order

```json
POST /api/orders

{
  "table": "TABLE_ID_HERE",
  "items": [
    {
      "menuItem": "MENU_ITEM_ID_HERE",
      "quantity": 2
    }
  ]
}
```

The server reads the current menu price and calculates the order total.

### Add inventory

```json
POST /api/inventory

{
  "name": "Chicken Breast",
  "unit": "kg",
  "quantity": 25,
  "reorderLevel": 5
}
```

### Adjust inventory

```json
PATCH /api/inventory/INVENTORY_ID_HERE/adjust

{
  "amount": -2
}
```

## Business logic implemented

### Order processing

Orders start as `pending`. Staff can move them through:

```text
pending → preparing → ready → served
```

Orders can also be cancelled.

### Table availability

Reservations check for overlapping confirmed reservations and verify that the requested number of guests fits the selected table.

### Inventory

Inventory quantities cannot become negative. Staff can adjust stock and query low-stock items where quantity is at or below the reorder level.

## Important scope note

The internship instructions describe automatic inventory updates as part of Task 3. The project provides the inventory adjustment API and inventory controls, but the supplied task description does not define menu recipes/ingredient quantities for each dish. Therefore, the backend does not invent a recipe-to-ingredient mapping. Inventory is adjusted explicitly through the inventory API.

## Testing checklist

1. Start MongoDB.
2. Start the Express server.
3. Register a customer.
4. Login and copy the JWT.
5. Create a staff user or change a test user's role to `staff`.
6. Login as staff.
7. Add menu items.
8. Add restaurant tables.
9. Add inventory items.
10. Check table availability.
11. Reserve a table.
12. Place an order.
13. Check the order status.
14. Adjust inventory.
15. Check low-stock alerts.
16. Cancel a reservation and verify the table becomes available.

## GitHub

Use the required CodeAlpha naming convention:

```text
CodeAlpha_ProjectName
```

Do not upload `.env` or `node_modules`.
