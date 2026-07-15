# Spice Grill — User Manual

> **Live URL**: https://fable-os.vercel.app
>
> For the restaurant **The Spice Grille**, Moorhead, MN — Afro-Caribbean cuisine.

---

## Table of Contents

1. [User Roles](#1-user-roles)
2. [Getting Started](#2-getting-started)
3. [Customer Guide](#3-customer-guide)
4. [Employee Guide (Kitchen Staff)](#4-employee-guide-kitchen-staff)
5. [Dispatcher Guide](#5-dispatcher-guide)
6. [Admin Guide](#6-admin-guide)
7. [Troubleshooting & FAQ](#7-troubleshooting--faq)

---

## 1. User Roles

| Role | Access | Description |
|------|--------|-------------|
| **Customer** | Public site | Browse menu, order food, track deliveries, earn loyalty points |
| **Employee** | `/employee` | Kitchen staff — view and manage incoming orders |
| **Dispatcher** | `/dispatcher` | Delivery personnel — manage assigned deliveries with live map |
| **Admin** | `/admin` | Full management: orders, menu, delivery, analytics, blog, customers, marketing, inventory, settings |

---

## 2. Getting Started

### Creating an Account

1. Go to https://fable-os.vercel.app
2. Click **Login** (top-right of navbar)
3. Click **"Don't have an account? Sign up"** link
4. Fill in: Full Name, Email, Password, Phone Number
5. Click **Sign Up**
6. You'll be redirected to login — sign in with your new credentials
7. You can also use **"Sign in with Google"** for one-click access

### Navigation

- **Desktop**: Sidebar floats on the left with icon buttons — hover for labels
- **Mobile/Tablet**: Bottom nav bar with 6 tabs (Home, Menu, Rewards, Story, Orders, Cart)
- **Top Navbar**: Shows logo, navigation links, cart icon (with badge), and login/account button

---

## 3. Customer Guide

### 3.1 Browsing the Menu

**Route**: `/menu`

1. Browse all food items displayed in a grid
2. **Filter by category**: Click the horizontal category chips (e.g., "Appetizers", "Main Course", "Desserts")
3. **Search**: Type in the search bar to find items by name
4. **Dietary filter**: Use the dropdown to filter by: All, Vegan, Gluten-Free, Spicy, Healthy
5. Click any item card to open the **item detail drawer** (slides in from the right)

**Item Detail Drawer shows:**
- Large image with carousel
- Category badge, prep time, calories, cooking method
- Description, ingredients, dietary tags
- Nutritional info (protein, carbs, fat, fiber)
- Allergen warnings
- Quantity selector and **"Add to Order"** button

### 3.2 Placing an Order

1. **Add items to cart**: Click "Add to Cart" on any menu item (or use the detail drawer)
2. **View cart**: Click the floating cart button (bottom-right) or go to `/cart`
3. **In cart**, you can:
   - Adjust quantities
   - Remove items
   - Apply a coupon code
   - Add special instructions
   - See order summary (subtotal, delivery fee, tax, total)
4. **Proceed to Checkout**: Click "Proceed to Checkout"

### 3.3 Checkout

**Route**: `/checkout`

A 3-step process:

**Step 1 — Shipping**: Enter delivery address (name, street, city, state, zip, phone)

**Step 2 — Payment & Shipping Method**:
- Select payment method: Card, PayPal, Apple Pay, Google Pay, or Cash
- Select shipping speed: Standard, Express, or Priority

**Step 3 — Review & Confirm**: Review your entire order and click "Place Order"

After placing, you'll be redirected to your order tracking page.

### 3.4 Tracking Orders

**Route**: `/orders` (all orders) or `/orders/[id]` (specific order)

- View all your past and current orders
- Each order shows: ID, date, total, status badge, items
- Click an order to see full details and live status updates
- Statuses: Pending → Accepted → Preparing → Ready → Out for Delivery → In Transit → Nearby → Delivered
- After delivery, you can leave a **review** with a star rating

### 3.5 Real-Time Delivery Tracking

**Route**: `/track/[orderId]`

When a dispatcher is assigned to your order:
- See an **8-step status progression** with visual indicators
- View **dispatcher info**: name, phone, vehicle details
- **Live map** shows:
  - Your location (red marker with pulse)
  - Dispatcher location (blue marker, updates in real-time)
  - Route line connecting you to the dispatcher
- Click "Navigate" to open Google Maps directions
- Click "Confirm Delivery" when your food arrives

### 3.6 Loyalty Program

**Route**: `/loyalty`

**Earning Points:**
- Visit the QR menu page (`/menu/view`): **+10 points daily**
- Share the menu: **+5 points**
- Place orders: earn points based on order amount

**Tiers:**
| Tier | Points | Benefits |
|------|--------|----------|
| Bronze | 0–500 | 5% off every 10th order |
| Silver | 501–2,000 | 10% off every 5th order + free delivery |
| Gold | 2,001+ | 15% off all orders + priority preparation |

**Redeeming:**
- Go to the Loyalty page to see available rewards
- Redeem points for discount coupons
- Active coupons appear on your account
- Apply coupon codes at checkout

### 3.7 Blog

**Route**: `/blog`

- Read articles about the restaurant, recipes, and news
- Featured post at the top, article grid below
- Click any article to read the full post

### 3.8 Account

**Route**: `/account`

Three tabs:
1. **Orders** — View your real-time order list
2. **Profile** — Edit your name, email, phone, and address
3. **Rewards** — Check loyalty points, tier, and redemption options

### 3.9 QR Menu View

**Route**: `/menu/view`

A clean, QR-optimized menu display designed for in-restaurant scanning. Awards loyalty points for visiting.

---

## 4. Employee Guide (Kitchen Staff)

**Route**: `/employee`

### Access

- Employees must have the `employee` role assigned by an admin
- Login with credentials — you'll be redirected automatically

### Dashboard

- **"Active Orders"** heading with live count badge
- Cards showing orders in kitchen workflow:
  - **Pending** — New order waiting
  - **Accepted** — Kitchen has taken the order
  - **Preparing** — Currently being cooked
  - **Ready** — Ready for pickup or delivery

### Order Actions

Each order card shows: order ID, customer name, time since order, items with quantities, shipping address, and total amount.

- **Accept** — Take ownership of an order
- **Start Preparing** — Begin cooking
- **Mark Ready** — Food is done
- **Reject** — Cancel the order

Status flow: `Pending` → `Accepted` → `Preparing` → `Ready`

Updates appear in **real-time** — no page refresh needed.

---

## 5. Dispatcher Guide

### 5.1 Registration

1. Go to `/dispatcher/register`
2. Fill in: Full Name, Phone, Email, Vehicle Type, Vehicle Make/Model, License Plate, Address
3. Submit — your application will be under review
4. Wait for admin approval
5. You'll be notified when approved

### 5.2 Dispatcher Portal

**Route**: `/dispatcher`

**Phone Login**: Enter your phone number to log in.

**Active Deliveries**:
- See all assigned deliveries
- Each shows: customer name, address, order items, status

**Live Map**:
- See your current location (GPS-based)
- See the customer's location
- Navigate button opens Google Maps

**Status Actions**:
1. **Picked Up** — You've collected the order
2. **In Transit** — On your way to the customer
3. **Delivered** — Handed to the customer

Your location is shared **live** with the customer so they can track your arrival.

---

## 6. Admin Guide

**Route**: `/admin`

Access requires the `admin` role. The admin portal has a floating sidebar with icons for each section.

### 6.1 Dashboard

Overview of the business:
- **KPI Cards**: Total Revenue, Total Orders, Total Customers, Average Order Value
- **Recent Orders**: Quick-view table of latest orders
- **Quick Actions**: Shortcuts to common tasks

### 6.2 Orders Management

Full control over all orders:
- **Search & filter** orders by status, date, customer
- Click any order to expand details (items, customer info, address)
- **Change order status** as fulfillment progresses
- **Add items** to existing orders
- **Realtime updates** — no refresh needed

### 6.3 Menu Management

Full **Create, Read, Update, Delete** for menu items:

**View options**: Grid view (visual cards) or List view (table)

**For each item, you can manage:**
- Name, description, price, category
- Multiple images (drag-drop upload, up to 5)
- Ingredients, allergens, dietary tags (Vegan, Gluten-Free, Spicy, Healthy)
- Preparation time, cooking method, calories
- Nutritional info (protein, carbs, fat, fiber)
- Stock quantity and availability toggle

**Bulk actions**: Select multiple items to delete or toggle availability
**CSV Export**: Download the entire menu as a CSV file

### 6.4 QR Code Generator

**Route**: `/admin/menu/qr`

Generate a QR code that links to the mobile-optimized menu view (`/menu/view`). Download the QR code for printing (table tents, flyers, etc.).

### 6.5 Delivery Management

**Route**: `/admin/delivery`

- View all orders needing delivery assignment
- See active deliveries with their current status
- **Assign dispatchers** to orders
- Track delivery workflow: pending → preparing → ready_for_pickup → assigned → picked_up → on_the_way → delivered

### 6.6 Dispatcher Applications

**Route**: `/admin/dispatcher-applications`

Review and manage dispatcher applications:
- List of all applicants with name, phone, email, vehicle info, date applied
- **Approve** — Activates the dispatcher account
- **Reject** — Provide a reason (applicant will see it)

### 6.7 Blog CMS

**Route**: `/admin/blog`

Create and manage blog posts:

**Rich Text Editor** (TipTap-based WYSIWYG):
- Headings (H1, H2), Bold, Italic
- Bullet and ordered lists
- Code blocks, blockquotes
- Text alignment
- Link insertion
- Image upload (drag-drop or URL)
- Video embed (YouTube/Vimeo auto-detection)
- Undo/Redo with word/character count

**Post settings:**
- Featured image upload (1200×630px recommended for social sharing)
- Categories and tags (create new ones on-the-fly)
- SEO fields: meta title, meta description, meta keywords
- Publish/unpublish toggle

### 6.8 Reviews

**Route**: `/admin/reviews`

View and moderate customer reviews:
- Star ratings and comments
- **Approve** to publish a review
- **Reject** to hide it

### 6.9 Analytics

**Route**: `/admin/analytics`

Business intelligence dashboards:
- **Revenue chart** — Sales over time (with date range picker)
- **Category performance** — Which menu categories sell best
- **Peak hours** — Order volume by time of day
- **Customer satisfaction** — Average rating trends

### 6.10 Customers

**Route**: `/admin/customers`

- Searchable list of all customers
- Shows: name, email, phone, total orders, join date
- Click a customer to view their order history

### 6.11 Inventory

**Route**: `/admin/inventory`

Stock management:
- View stock levels for all menu items
- **Inline editing** — click to adjust quantities
- **Bulk actions** — select multiple items to update
- **Low-stock alerts** — visual warnings when items below threshold

### 6.12 Marketing

**Route**: `/admin/marketing`

Create and manage marketing campaigns:
- Campaign name, description
- Discount type and amount
- Start/end dates
- Target customer segments
- **Loyalty rules**: Configure points earned per dollar spent

### 6.13 Loyalty Settings

**Route**: `/admin/loyalty`

Configure the loyalty program:
- Tier point thresholds (Bronze/Silver/Gold)
- Per-tier benefits: discount %, frequency, free delivery, priority prep
- Redemption options — what customers can redeem points for

### 6.14 Settings

**Route**: `/admin/settings`

Restaurant configuration:
- **Restaurant Info**: Name, address, phone, email, opening hours
- **Delivery Settings**: Radius, fee, minimum order, free delivery threshold
- **Tax Settings**: Tax rate

---

## 7. Troubleshooting & FAQ

### Login redirects to localhost

If after logging in you're redirected to `http://localhost:3000`, the site URL is misconfigured in Supabase. An admin should:
1. Go to Supabase dashboard → Authentication → URL Configuration
2. Set Site URL to `https://fable-os.vercel.app`
3. Add `https://fable-os.vercel.app/auth/callback` to Redirect URLs

### Orders not appearing

Orders load in real-time. If they don't appear:
- Check that you're logged in
- Refresh the page
- Check your internet connection

### Dispatcher map not loading

The live map requires:
- Browser location permission (grant when prompted)
- A stable internet connection
- The dispatcher must have GPS enabled on their device

### Forgot password

Currently password reset is handled through Supabase Auth. Contact an admin to reset your password from the Supabase dashboard.

### Need admin access?

Only existing admins can grant the `admin` or `employee` role. This is done directly in the Supabase database (`profiles` table → `role` column).
