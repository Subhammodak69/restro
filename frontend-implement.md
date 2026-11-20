# Restaurant App: Frontend Implementation Guide

Stack: **React** (bootstrapped from the CLI), React Router, Axios, Socket.io-client, Razorpay Checkout.

> CRA (`create-react-app`) is deprecated. Prefer `npm create vite@latest frontend -- --template react`. Everything below works with either; env variables use `VITE_` (Vite) or `REACT_APP_` (CRA) prefixes.

One React project, two areas:
- **Part A: Customer app** (routes `/`, `/t/:token`, `/menu`, `/cart`, ...)
- **Part B: Admin panel** (routes under `/admin/*`, protected by role)

---

## 0. Shared Foundation

### 0.1 Install
```bash
npm i react-router-dom axios socket.io-client react-hot-toast
npm i recharts            # charts for admin reports
npm i @tanstack/react-query   # optional: server state/caching
npm i react-hook-form zod @hookform/resolvers
# styling (pick one): tailwindcss  OR  MUI
```

### 0.2 Folder structure
```
src/
├── api/            (axios.js, userApi.js, adminApi.js)
├── context/        (AuthContext, CartContext, TableContext, SocketContext)
├── components/     (common/*, user/*, admin/*)
├── layouts/        (UserLayout.jsx, AdminLayout.jsx)
├── pages/
│   ├── user/       (Home, Menu, ItemDetail, Cart, Checkout, OrderTracking, MyOrders, Login, Register, Profile, Addresses, TableLanding, ReviewForm)
│   └── admin/      (Login, Dashboard, LiveOrders, OrderDetail, POS, MenuManager, Categories, Tables, Reports, ProfitLoss, Expenses, Reviews, Customers, Settings, Staff)
├── routes/         (AppRoutes.jsx, ProtectedRoute.jsx, AdminRoute.jsx)
├── hooks/          (useDebounce, useSocket)
├── utils/          (formatCurrency, constants, loadRazorpay)
└── main.jsx
```

### 0.3 `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

### 0.4 Axios setup (`api/axios.js`)
```js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
api.interceptors.response.use(r => r, (err) => {
  if (err.response?.status === 401) { localStorage.removeItem('token'); /* redirect to login */ }
  return Promise.reject(err);
});
export default api;
```

### 0.5 Contexts
- **AuthContext**: `user`, `login()`, `logout()`, `isAdmin`. Stores the JWT and loads `/user/auth/me` on startup.
- **CartContext**: items `[{menuItemId, name, price, qty}]`, `add/remove/updateQty/clear`, `subtotal`. Persist to `localStorage`.
- **TableContext**: `{tableId, tableNumber, token}` saved in `sessionStorage` when the customer scans a QR. When present, the app is in **dine-in mode**.
- **SocketContext**: one socket connection, passing the JWT in `auth`.

### 0.6 Route guards
- `ProtectedRoute`: redirects to `/login` if not logged in (used for delivery checkout, orders, profile).
- `AdminRoute`: requires `user.role` in `['admin','staff']`, otherwise redirects to `/admin/login`. Pages for reports, finance and settings additionally require `role === 'admin'`.

### 0.7 Route map (`AppRoutes.jsx`)
```
/                       Home
/menu                   Menu
/menu/:id               ItemDetail
/cart                   Cart
/checkout               Checkout        (dine-in: guest OK; delivery: login required)
/t/:token               TableLanding    (resolves QR, sets TableContext, redirects to /menu)
/track/:orderNo         OrderTracking
/orders                 MyOrders        (protected)
/orders/:id/review      ReviewForm      (protected)
/profile, /addresses    (protected)
/login, /register

/admin/login
/admin                  Dashboard
/admin/orders           LiveOrders
/admin/orders/:id       OrderDetail
/admin/pos              POS
/admin/menu             MenuManager
/admin/categories       Categories
/admin/tables           Tables (QR)
/admin/reports          Reports        (admin only)
/admin/profit-loss      ProfitLoss     (admin only)
/admin/expenses         Expenses       (admin only)
/admin/reviews          Reviews
/admin/customers        Customers
/admin/settings         Settings       (admin only)
/admin/staff            Staff          (admin only)
```

---

# PART A: End-User (Customer) Frontend

Uses `UserLayout` (header with logo, cart badge, login/profile, and a "Table 5" badge in dine-in mode; mobile-first with a bottom cart bar).

## A1. Entry modes
| Mode | How the user arrives | Behavior |
|---|---|---|
| **Home delivery** | opens the website normally | order type = DELIVERY; login required at checkout; address and pincode check |
| **Dine-in (table QR)** | scans the QR, lands on `/t/:token` | `TableLanding` calls `GET /user/tables/resolve/:token`, saves the table, shows "Welcome to Table 5"; order type = DINE_IN; guest checkout (name and phone) |
| **Takeaway** (optional) | chosen on the checkout screen | order type = TAKEAWAY |

If the QR token is invalid, show a friendly "invalid or expired QR, ask staff" screen.

## A2. Pages

### Home
Hero banner, categories, popular items, and recent public reviews (`GET /user/reviews/public`). Show a banner when `accepting_orders = false` and disable checkout.

### Menu
- Category tabs (sticky), search box (debounced), veg/non-veg toggle.
- `ItemCard`: image, name, price, veg dot, "Add" button that becomes a **− qty +** stepper.
- Unavailable items are greyed with a "Sold out" label and the Add button is disabled.
- Floating cart bar: "3 items, ₹540, View Cart".

### Cart
Item list with qty controls, notes field, price summary (subtotal, tax, delivery fee, total). **These numbers are estimates, since the server recomputes the real totals.**

### Checkout
- **If DINE_IN**: name and phone fields (auto-filled when logged in), table number shown read-only, payment choice: **Pay online now** or **Pay at counter/table**.
- **If DELIVERY**: select or add an address (calls `POST /user/delivery/check` to validate the pincode and show the delivery fee), payment choice: **Pay online** or **Cash on delivery**.
- Submit calls `POST /user/orders`.

### Payment (online)
1. After the order is created with `paymentMethod: 'ONLINE'`, call `POST /user/payments/create { orderId }`.
2. Load the script `https://checkout.razorpay.com/v1/checkout.js` (`utils/loadRazorpay.js`).
3. Open Razorpay:
```js
const rzp = new window.Razorpay({
  key: keyId,
  amount, currency: 'INR',
  order_id: razorpayOrderId,
  name: 'Your Restaurant',
  prefill: { name, contact: phone },
  handler: async (resp) => {
    await api.post('/user/payments/verify', resp);   // razorpay_order_id, razorpay_payment_id, razorpay_signature
    clearCart(); navigate(`/track/${orderNo}`);
  },
  modal: { ondismiss: () => toast.error('Payment cancelled') },
});
rzp.open();
```
4. On dismiss or failure, keep the order as unpaid and offer **Retry payment** from the tracking page.

### Order Tracking (`/track/:orderNo`)
- Status stepper that adapts to the type (delivery steps vs dine-in steps).
- Listens to the socket event `order:status` (emit `track:order` after connecting), and also polls every 20 s as a fallback.
- Guests supply their phone number to view an order (`GET /user/orders/track/:orderNo?phone=`). Store it in `sessionStorage`.
- Show the items, totals, payment status, and a "Pay now" button if still pending.

### My Orders / Profile / Addresses
Paginated order history with a "Reorder" button (re-adds the items to the cart), profile edit, address CRUD with a default address.

### Review form
Shown on a `COMPLETED` or `DELIVERED` order: star rating (1 to 5) and comment, `POST /user/reviews`. Prompt for it on the tracking page when the order finishes.

## A3. Customer UX checklist
- Mobile-first (most dine-in users are on phones), large tap targets.
- Cart persists across refresh. The table persists for the browser session.
- Clear loading, empty and error states, toasts for add-to-cart and order placed.
- Disable the Place Order button while the request is in flight (prevents duplicate orders).

---

# PART B: Admin Panel Frontend

Uses `AdminLayout`: sidebar (collapsible on mobile), top bar with a live-orders bell, and a logout button. Desktop and tablet first. Pages for reports, finance and settings are hidden from `staff`.

## B1. Admin Login
`POST /admin/auth/login`. After login, verify the role is admin or staff, otherwise show "Not authorized".

## B2. Dashboard
Cards: today's orders, today's revenue, pending orders, average rating. Charts (Recharts): last-7-days revenue line and a top-5 items bar chart. A recent orders table. Source: `GET /admin/dashboard/summary`.

## B3. Live Orders (kitchen and front desk screen)
- Kanban columns: **New → Accepted → Preparing → Ready → Out for delivery or Served → Completed**. A table view toggle is also available.
- Each card shows order number, type badge (DELIVERY, DINE-IN T5, TAKEAWAY), source badge (ONLINE, QR, POS), items, total, payment badge, and age timer.
- Action buttons advance the status (`PUT /admin/orders/:id/status`). A **Mark paid** button with a method select (cash, UPI, card) calls `PUT /admin/orders/:id/payment`.
- Socket: on `order:new`, add the card, play a notification sound, and show a toast. The browser requires a user click once to allow audio, so add an "Enable sound" button.
- Filters: type, source, status, date range. Print or download an invoice (`GET /admin/orders/:id/invoice`).

## B4. POS: manual order entry
Used when a customer orders in person or by phone and staff enter the order.
- **Left**: category tabs and a searchable item grid (tap to add). **Right**: the current bill with qty controls, notes and a discount field.
- Order type selector: **Dine-in** (choose a table from a grid with occupied tables highlighted via `GET /admin/pos/tables/status`), **Takeaway**, **Delivery** (name, phone, address typed in).
- Customer name and phone are optional (walk-ins).
- Payment panel: Cash / UPI at counter / Card at counter, with **Paid now** or **Pay later** options.
- **Save and Print** posts to `POST /admin/pos/orders` and opens a printable bill (a CSS print stylesheet with an 80 mm thermal-printer width).
- For open dine-in tables, an **Add items** action calls `POST /admin/pos/orders/:id/add-items`.

## B5. Menu Manager and Categories
- Table of items with image, category, price, cost price, margin %, and availability switch (`PATCH /admin/menu/:id/availability`) for the quick "sold out" toggle.
- Add and edit modal using `react-hook-form` and `FormData` for the image upload.
- Delete asks for confirmation (the backend soft-deletes).
- Categories page with drag-and-drop reorder (`PUT /admin/categories/reorder`).

## B6. Tables and QR
- Table list with add, edit and delete.
- Each row has **View QR**: display `GET /admin/tables/:id/qr.png` in a modal with a download button, and **Regenerate** to rotate the token.
- **Print all QR codes** button opens the print-sheet PDF (`/admin/tables/qr/print-sheet`).
- Each QR shows the table number prominently, so it can be placed on the table.

## B7. Reports
Filters: date range presets (Today, 7 days, This month, Custom) and group by day/week/month.
Tabs, each with a chart and table:
1. **Sales**: revenue and orders over time, AOV
2. **By type and source**: pie charts (delivery vs dine-in vs takeaway; online vs QR vs POS)
3. **Items**: best and worst sellers with qty, revenue, profit
4. **Categories**
5. **Payments**: by method
6. **Peak hours**: heat-map or bar by hour
7. **Customers**: top spenders, new vs repeat
8. **Tax**: collected tax summary

Every tab has **Export Excel** and **Export PDF** buttons (calls the same endpoint with `?format=xlsx|pdf` and downloads the blob).

## B8. Profit and Loss and Expenses
- **Expenses page**: add, edit and delete with category, amount, date, and description. Filters and monthly totals.
- **Profit/Loss page**: date range picker and a statement layout:
  ```
  Revenue
  − Cost of goods sold
  = Gross profit
  − Operating expenses (breakdown by category)
  = Net profit / loss   (green if profit, red if loss)   Margin %
  ```
  Below it, a monthly bar chart (revenue vs expenses vs net) and an items-by-margin table. Source: `GET /admin/finance/profit-loss` and `/profit-loss/items`.

## B9. Reviews
List with star filter, an average rating header and a 1 to 5 distribution bar. Row actions: **Reply** (inline text box), **Hide or Show** on the public site. Source: `/admin/reviews`.

## B10. Customers
Searchable table (name, phone, orders, total spent, last order). Click for the order history, with a block/unblock toggle.

## B11. Settings and Staff
- **Settings**: delivery fee, free-delivery threshold, tax %, deliverable pincodes (tag input), minimum order value, and the **Accepting orders** master switch.
- **Staff**: create staff accounts, activate or deactivate (admin only).

## B12. Reusable admin components
`DataTable` (sort, paginate, loading, empty), `DateRangePicker`, `StatCard`, `ConfirmDialog`, `ImageUpload`, `StatusBadge`, `ExportButtons`, `Modal`, `PrintableBill`.

---

## Appendix: Build order
1. Project setup, axios, contexts, routing and guards, layouts
2. Customer: login/register, menu, cart (delivery path first)
3. Customer: checkout, Razorpay payment, order tracking
4. Customer: QR landing and dine-in mode, guest checkout
5. Admin: login, menu and category manager, tables and QR
6. Admin: live orders with sockets, order detail
7. Admin: POS
8. Admin: dashboard, reports, expenses, profit/loss
9. Reviews (both sides), customers, settings, staff
10. Polish: responsive checks, print styles, error and empty states, production build and deploy (e.g., Nginx serving `dist/` with `/api` proxied to Node)

## Appendix: Testing checklist
- Scan a QR on a phone, order without login, pay online, and watch the admin screen update live.
- Place a delivery order outside the allowed pincodes (should be rejected).
- Create a POS order with cash, then check that it appears in the sales report.
- Add expenses and confirm that the P&L matches a manual calculation.
- Try accessing `/admin/*` as a customer (should be blocked).
