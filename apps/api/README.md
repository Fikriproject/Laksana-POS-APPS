# POS API Backend

PHP REST API backend for the POS Cashier application, configured for **MySQL** (compatible with Laragon default).

## Requirements

- PHP 8.0+
- MySQL 5.7+ or 8.0+
- Composer

## Setup with Laragon

1. **Start Laragon**: Ensure MySQL and Apache/Nginx are running.

2. **Install Dependencies**:
```bash
cd apps/api
composer install
```

3. **Environment Setup**:
```bash
cp .env.example .env
```
   - Defaults are set for Laragon (`root` user, no password, port 3306).
   - If you have a password, update DB_PASSWORD in `.env`.

4. **Create Database**:
   - Open **HeidiSQL** (Laragon button) or **phpMyAdmin**.
   - Create a new database named `pos_cashier`.
   - Import the schema from `apps/api/database/schema.sql` into the `pos_cashier` database.

5. **Serve the API**:
   - Just use Laragon's auto-hostname feature. Map the `apps/api/public` folder to a domain like `api.pos.test`.
   - OR use the built-in server:
     ```bash
     composer start
     ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login (username/password)
- `POST /api/auth/login/pin` - Cashier login (PIN)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `POST /api/orders/:id/refund` - Refund order (Admin/Manager)

### Inventory
- `GET /api/inventory/logs` - List inventory logs
- `POST /api/inventory/stock-in` - Record stock in
- `POST /api/inventory/stock-out` - Record stock out
- `POST /api/inventory/adjustment` - Adjust stock (Admin)

### Reports
- `GET /api/reports/sales/summary` - Sales summary
- `GET /api/reports/sales/by-date` - Sales by date
- `GET /api/reports/sales/by-category` - Sales by category
- `GET /api/reports/employees/performance` - Employee performance

### Shifts
- `GET /api/shifts/current` - Get current shift
- `POST /api/shifts/open` - Open shift
- `POST /api/shifts/close` - Close shift

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Cashier:**
- PIN: `1234`
