# Product Stock Management - Testing Checklist

## Login Credentials
| Role | Email | Password |
|------|-------|----------|
| PRIVILEGE | privilege@example.com | password123 |

---

## 1. Authentication & Authorization

### Login
- [ ] Can login with valid credentials -> PASS
- [ ] Cannot login with invalid credentials -> PASS
- [ ] Cannot login with inactive user
- [ ] Redirects to dashboard after login -> PASS
- [ ] Logout works correctly -> PASS

### Role-Based Access
- [ ] PRIVILEGE can access all menus
- [ ] ADMIN cannot access Reports
- [ ] SALES can only access Sales & Customers
- [ ] WAREHOUSE can only access Stock In & Stock Levels

---

## 2. User Management (PRIVILEGE & ADMIN)

### Create User
- [ ] PRIVILEGE can create ADMIN user
- [ ] PRIVILEGE can create SALES user
- [ ] PRIVILEGE can create WAREHOUSE user
- [ ] ADMIN can create SALES user
- [ ] ADMIN can create WAREHOUSE user
- [ ] ADMIN cannot create ADMIN/PRIVILEGE user
- [ ] Email validation works
- [ ] Password minimum 6 characters
- [ ] Duplicate email shows error

### Edit User
- [ ] Can edit user name
- [ ] Can edit user email
- [ ] Can edit user phone
- [ ] Can change user role (within permissions)
- [ ] Cannot edit own role to lower level

### Toggle User Status
- [ ] Can activate/deactivate user
- [ ] Cannot deactivate own account
- [ ] Inactive user cannot login

### Reset Password
- [ ] Can reset user password
- [ ] New password works for login

---

## 3. Product Management (PRIVILEGE & ADMIN)

### Categories
- [ ] Can create new category
- [ ] Duplicate category name shows error
- [ ] Categories show in product form

### Create Product
- [ ] Can create product with name & category
- [ ] Description is optional
- [ ] Product appears in list

### Variant Types
- [ ] Can add variant type to product (e.g., "Size")
- [ ] Can add multiple options (e.g., "S", "M", "L")
- [ ] Duplicate variant type shows error

### Product Variants
- [ ] Can create variant with all options selected
- [ ] SKU is required and unique
- [ ] Cost price is required
- [ ] Selling price is required
- [ ] Variant appears in product detail

### Edit Product
- [ ] Can edit product name
- [ ] Can edit product category
- [ ] Can toggle product active/inactive

### Edit Variant
- [ ] Can edit variant prices
- [ ] Can toggle variant active/inactive

---

## 4. Stock In (PRIVILEGE, ADMIN & WAREHOUSE)

### Create Stock Entry
- [ ] Can search and select variants
- [ ] Can add multiple items
- [ ] Can set quantity for each item
- [ ] Can set cost price for each item
- [ ] Entry number is auto-generated
- [ ] Notes field is optional
- [ ] Stock is updated after creation

### View Stock Entry
- [ ] Can see entry details
- [ ] Can see all items in entry
- [ ] Shows recorded by user
- [ ] Shows entry date

### Cancel Stock Entry
- [ ] PRIVILEGE/ADMIN can cancel entry
- [ ] Stock is reversed after cancellation
- [ ] Cannot cancel if stock insufficient
- [ ] Cancel reason is recorded

---

## 5. Stock Levels (All Roles)

- [ ] Shows all variants with current stock
- [ ] Shows low stock warning (below min level)
- [ ] Can search by product name or SKU
- [ ] Can filter by stock status

---

## 6. Customer Management (PRIVILEGE, ADMIN & SALES)

### Create Customer
- [ ] Can create customer with name
- [ ] Phone is optional
- [ ] Email is optional (validates format)
- [ ] Address is optional

### Edit Customer
- [ ] Can edit customer details
- [ ] Email validation works

### View Customer
- [ ] Shows customer details
- [ ] Shows purchase history
- [ ] Shows total orders
- [ ] Shows total spent

---

## 7. Sales (PRIVILEGE, ADMIN & SALES)

### Create Sale (POS Interface)
- [ ] Can search and select customer
- [ ] Can create new customer inline
- [ ] Can search products by name/SKU
- [ ] Can add multiple items to cart
- [ ] Can adjust quantity
- [ ] Can apply item discount (%)
- [ ] Can apply total discount (amount)
- [ ] Can select payment method
- [ ] Shows real-time totals
- [ ] Invoice number is auto-generated
- [ ] Stock is deducted after sale
- [ ] Cannot sell more than available stock

### View Sale
- [ ] Shows sale details
- [ ] Shows all items
- [ ] Shows customer info
- [ ] Shows payment info
- [ ] Shows salesperson

### Invoice
- [ ] Invoice page loads correctly
- [ ] Shows company info
- [ ] Shows customer info
- [ ] Shows all items with prices
- [ ] Shows totals correctly
- [ ] Print button works

### Cancel Sale
- [ ] PRIVILEGE/ADMIN can cancel sale
- [ ] Stock is restored after cancellation
- [ ] Cancel reason is recorded

---

## 8. Reports (PRIVILEGE Only)

### Dashboard KPIs
- [ ] Shows today's sales count
- [ ] Shows today's revenue
- [ ] Shows total products
- [ ] Shows low stock count

### Sales Report
- [ ] Can filter by date range
- [ ] Shows daily sales chart
- [ ] Shows sales by payment method
- [ ] Shows top products
- [ ] Shows top customers

---

## 9. Settings (PRIVILEGE Only)

### Company Profile
- [ ] Can edit company name
- [ ] Can edit company address
- [ ] Can edit company phone
- [ ] Can edit company email
- [ ] Can edit invoice prefix
- [ ] Can edit stock entry prefix
- [ ] Changes reflect in invoices

### Activity Logs
- [ ] Shows recent activities
- [ ] Shows user who performed action
- [ ] Shows action type
- [ ] Shows timestamp

---

## 10. General UI/UX

- [ ] Responsive on mobile
- [ ] Loading states show correctly
- [ ] Error messages are clear
- [ ] Success messages show
- [ ] Navigation works correctly
- [ ] Sidebar highlights active page
- [ ] Search/filter works correctly
- [ ] Pagination works (if applicable)

---

## Test Scenarios

### Scenario 1: Full Sales Flow
1. Login as WAREHOUSE
2. Create stock entry for a product (qty: 100)
3. Logout
4. Login as SALES
5. Create a new customer
6. Create a sale for that customer (qty: 5)
7. Check stock is reduced to 95
8. View invoice

### Scenario 2: Stock Cancellation
1. Login as WAREHOUSE
2. Create stock entry (qty: 50)
3. Verify stock increased
4. Login as ADMIN
5. Cancel the stock entry
6. Verify stock is reversed

### Scenario 3: Sale Cancellation
1. Login as SALES
2. Create a sale (qty: 10)
3. Verify stock reduced
4. Login as PRIVILEGE
5. Cancel the sale
6. Verify stock restored

### Scenario 4: User Management
1. Login as PRIVILEGE
2. Create ADMIN user
3. Login as new ADMIN
4. Create SALES user
5. Try to create ADMIN user (should fail)
6. Login as PRIVILEGE
7. Deactivate the ADMIN user
8. Try to login as deactivated ADMIN (should fail)

---

## Notes
- Date: ___________
- Tester: ___________
- Version: ___________
- Issues Found: ___________