# The Spice Grille — Owner & Admin Manual

**Website:** https://www.thespicegrille.com  
**Restaurant:** 320 Red River Ave Ste D, Moorhead, MN 56560  
**Phone:** (218) 477-1112 | **Email:** tsgmoorhead@gmail.com

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Logging In](#2-logging-in)
3. [Understanding User Roles](#3-understanding-user-roles)
4. [Admin Dashboard Overview](#4-admin-dashboard-overview)
5. [Managing Orders](#5-managing-orders)
6. [Managing the Menu](#6-managing-the-menu)
7. [Delivery Management](#7-delivery-management)
8. [Dispatcher Applications](#8-dispatcher-applications)
9. [Financial Dashboard](#9-financial-dashboard)
10. [Delivery Fee Settings](#10-delivery-fee-settings)
11. [Blog Management](#11-blog-management)
12. [Customer Reviews](#12-customer-reviews)
13. [Analytics](#13-analytics)
14. [Marketing Campaigns](#14-marketing-campaigns)
15. [Customer Management](#15-customer-management)
16. [Inventory Management](#16-inventory-management)
17. [Loyalty Program Settings](#17-loyalty-program-settings)
18. [General Settings](#18-general-settings)
19. [Dispatcher Portal Guide](#19-dispatcher-portal-guide)
20. [Customer Experience Overview](#20-customer-experience-overview)
21. [Troubleshooting](#21-troubleshooting)

---

## 1. Introduction

The Spice Grille website is a full-featured online ordering and delivery platform. It allows customers to browse your menu, place orders for delivery, track their orders in real-time, earn loyalty points, and read your blog. As the owner/admin, you have full control over every aspect of the platform through the admin dashboard.

This manual explains every feature and how to use it correctly.

---

## 2. Logging In

### How to Access the Admin Panel

1. Go to **https://www.thespicegrille.com/login**
2. Click **"Continue with Google"** — this is the only login method
3. You must log in with the Google account that is registered as an admin in the system
4. After successful login, you will be **automatically redirected** to the Admin Dashboard

### Important Login Notes

- If you are already logged in, visiting the homepage will automatically redirect you to the admin panel
- Your admin role is tied to your Google account's email address
- If you cannot log in, contact the development team to ensure your Google account email is registered as an admin in the database

### Logging Out

- Click your profile picture/name in the top-right corner of the admin panel
- Select **"Sign Out"**
- You will be redirected to the homepage

---

## 3. Understanding User Roles

The system has four user roles:

| Role | Access | Description |
|------|--------|-------------|
| **Admin** | `/admin/*` | Full access to everything — orders, menu, delivery, finance, settings, customers, blog, marketing |
| **Employee** | `/employee` | Kitchen staff — can view and update order statuses (accept, prepare, mark ready) |
| **Dispatcher** | `/dispatcher` | Delivery drivers — view assigned deliveries, update status, track GPS, view earnings |
| **Customer** | Public site | Browse menu, place orders, track deliveries, earn loyalty points |

**How roles work:**
- Roles are stored in the Supabase database under the `profiles` table
- Only admins can change user roles (done directly in the database)
- The system checks your role every time you access a protected page
- If you try to access a page your role doesn't allow, you'll be redirected to the login page

---

## 4. Admin Dashboard Overview

When you log in as an admin, you land on the **Dashboard** (`/admin`).

### What You See

- **KPI Cards** (top row):
  - Total Revenue — all-time revenue from orders
  - Total Orders — total number of orders placed
  - Total Customers — unique customers who have ordered
  - Average Order Value — average spend per order
  - Each card shows a trend indicator (up/down arrow with percentage)

- **Recent Orders Table:**
  - Shows your most recent orders
  - Order ID, customer name, items ordered, total amount, current status
  - Click any order to expand and see full details

- **Navigation Sidebar** (left side on desktop, bottom bar on mobile):
  - Dashboard, Orders, Menu, Delivery, Dispatcher Applications, Financial, Blog, Reviews, Analytics, Marketing, Customers, Inventory, Loyalty, Settings

---

## 5. Managing Orders

**Page:** `/admin/orders`

### Viewing Orders

- All orders appear in a list with: Order ID, customer name, items, total, status, date
- Use the **search bar** to find orders by order ID, customer name, or address
- Use **status filters** to view orders by status (Pending, Confirmed, Preparing, Ready, Out for Delivery, Delivered, Cancelled)

### Changing Order Status

The order lifecycle flows through these stages:

```
Pending → Confirmed → Preparing → Ready → Out for Delivery → Delivered
```

To change an order's status:
1. Find the order in the list
2. Click the **status dropdown** on the order card
3. Select the new status
4. The change saves automatically

**When to use each status:**
- **Pending** — New order, not yet reviewed
- **Confirmed** — You've acknowledged the order and it's in the queue
- **Preparing** — Kitchen is actively working on it
- **Ready** — Food is done, waiting for dispatcher pickup
- **Out for Delivery** — Dispatcher has picked it up
- **Delivered** — Customer has received the order
- **Cancelled** — Order was cancelled (by customer or admin)

### Adding Items to an Existing Order

1. Expand the order by clicking on it
2. Click **"Add Items"**
3. Search and select items from the menu
4. Confirm the addition
5. The order total updates automatically

### Viewing Order Details

Click any order card to expand and see:
- Full list of items with quantities and prices
- Customer's delivery address
- Special instructions
- Payment method and status
- Delivery assignment (which dispatcher is handling it)
- Order timeline (when each status change occurred)

---

## 6. Managing the Menu

**Page:** `/admin/menu`

This is the most feature-rich section of the admin panel.

### Viewing Your Menu

- **Grid View:** Visual cards showing item image, name, price, category
- **List View:** Table format with all details in columns
- Toggle between views using the grid/list buttons at the top

### Adding a New Menu Item

1. Click the **"+ Add Item"** button (top right)
2. Fill in the form:
   - **Name** (required) — e.g., "Jollof Rice"
   - **Description** — detailed description of the dish
   - **Price** (required) — in dollars (e.g., 14.99)
   - **Category** (required) — select from existing categories or create a new one
   - **Images** — upload up to 5 photos (drag-and-drop or click to browse)
   - **Ingredients** — list of ingredients (helps customers with allergies)
   - **Allergens** — specific allergen warnings
   - **Dietary Tags** — Vegan, Vegetarian, Gluten-Free, Spicy (select all that apply)
   - **Preparation Time** — estimated prep time in minutes
   - **Cooking Method** — e.g., Grilled, Fried, Steamed
   - **Calories** — nutritional calorie count
   - **Protein / Carbs / Fat / Fiber** — detailed nutritional info
   - **Stock Quantity** — how many portions available
   - **Available** — toggle on/off to show/hide from menu
3. Click **"Save"** to create the item

### Editing a Menu Item

1. Find the item in the grid or list
2. Click the **pencil/edit icon**
3. Modify any field
4. Click **"Save"**

### Deleting Menu Items

**Single item:**
1. Click the item to open it
2. Click the **trash/delete icon**
3. Confirm deletion

**Bulk delete:**
1. Check the boxes next to multiple items
2. Click **"Delete Selected"** at the top
3. Confirm

### Toggling Availability

- **Single item:** Click the availability toggle (green = available, gray = unavailable)
- **Bulk:** Select multiple items → click **"Toggle Availability"**

Unavailable items are hidden from customers but remain in your admin menu for editing.

### Low Stock Alerts

- Items with stock quantity below 5 show a **yellow warning badge**
- Items with 0 stock show a **red "Out of Stock" badge**
- Update stock quantities by editing the item

### CSV Export

Click **"Export CSV"** to download your entire menu as a spreadsheet. Useful for:
- Backups
- Sharing with suppliers
- Offline analysis

### Category Management

- Categories appear as filter chips at the top of the menu
- Create new categories when adding/editing items
- Categories are managed via the API — create them through the item form

### QR Code Generator

**Page:** `/admin/menu/qr`

- Generate a QR code that links to the mobile-optimized menu view (`/menu/view`)
- Download the QR code image for printing
- Use on table tents, flyers, or in-restaurant signage
- Customers scanning this QR code get a clean, mobile-friendly menu with add-to-cart functionality

---

## 7. Delivery Management

**Page:** `/admin/delivery`

### Viewing Deliveries

- All delivery assignments appear in a list
- Each shows: Order ID, assigned dispatcher, status, delivery address, date
- Filter by status or search by order ID/address/dispatcher name

### Assigning a Dispatcher

1. Find an order that needs delivery assignment
2. Click **"Assign Dispatcher"**
3. A list of **available dispatchers** appears (those marked as "Available" status)
4. Select a dispatcher
5. The assignment is created and the dispatcher sees it in their portal

### Delivery Status Flow

```
Pending → Preparing → Ready for Pickup → Assigned → Picked Up → On the Way → Arrived → Delivered
```

### Delivery Statistics

The page shows summary cards:
- Total deliveries
- Active (in-progress) deliveries
- Completed today
- Average delivery time

### Dispatcher Availability

- Shows which dispatchers are currently available, busy, on break, or offline
- Use this to decide who to assign to new deliveries

---

## 8. Dispatcher Applications

**Page:** `/admin/dispatcher-applications`

### Reviewing Applications

When someone applies to become a dispatcher:
1. Their application appears here with status "Pending"
2. You see: Full name, phone, email, vehicle type, make/model, year, license plate, address, date applied

### Approving an Application

1. Click on the pending application
2. Review the details
3. Click **"Approve"**
4. The applicant can now log in to the Dispatcher Portal and start receiving deliveries

### Rejecting an Application

1. Click on the pending application
2. Click **"Reject"**
3. Optionally enter a rejection reason (the applicant can see this)
4. Confirm

---

## 9. Financial Dashboard

**Page:** `/admin/financial`

This is where you track all money flowing through the delivery platform.

### Summary Cards (Top)

- **Total Revenue** — sum of all delivery + service + small order fees collected
- **Total Dispatcher Payout** — what you owe to dispatchers
- **Platform Net** — your profit after dispatcher payouts
- **Pending Payouts** — amount owed to dispatchers not yet paid
- **Total Orders** — number of orders with delivery fees

### Three Tabs

#### Tab 1: Per-Delivery Transactions

A table showing every order's financial breakdown:

| Column | Meaning |
|--------|---------|
| Order ID | The order reference |
| Date | When the order was placed |
| Distance | Miles from restaurant to customer |
| Delivery Fee | Flat fee charged to customer |
| Service Fee | Distance-based fee charged to customer |
| Small Order Fee | Extra fee if order is under the threshold |
| Total Collected | Sum of all fees from the customer |
| Dispatcher Payout | What the dispatcher earns for this delivery |
| Platform Net | Your profit (Total Collected − Dispatcher Payout) |
| Dispatcher | Name of the assigned dispatcher |

#### Tab 2: Dispatcher Earnings

Breakdown per dispatcher:
- Total deliveries completed
- Total earned
- Pending payout amount
- Average earnings per delivery

Use this to know how much to pay each dispatcher.

#### Tab 3: Active Rates

Displays the current delivery fee configuration at a glance:
- Base Delivery Fee
- Service Fee (and radius)
- Per-Mile Rate
- Free Delivery Radius
- Small Order Threshold & Fee
- Driver Base Pay & Mileage Pay

Click **"Edit rates in Settings"** to go to the settings page and modify.

### Filtering

Use the date range picker to view transactions for a specific period.

---

## 10. Delivery Fee Settings

**Page:** `/admin/settings`

This is one of the most important sections — it controls how much customers pay and how much dispatchers earn.

### Fee Structure Explained

When a customer places a delivery order, the system calculates fees based on:

1. **Base Delivery Fee ($3.99)** — flat fee added to every delivery order
2. **Service Fee ($4.00)** — covers platform costs, applied within the service radius
3. **Per-Mile Rate ($0.70/mi)** — additional charge for distances beyond the free radius
4. **Small Order Fee ($2.50)** — extra fee for orders under $15 (threshold is configurable)
5. **Free Delivery Radius** — miles from restaurant where no delivery fee is charged

### How to Change Rates

1. Go to **Admin → Settings**
2. Scroll to **"Delivery Fee Configuration"**
3. Modify any value:
   - **Delivery Fee** — the flat fee customers see at checkout
   - **Service Fee** — additional service charge
   - **Service Fee Radius (miles)** — how far from the restaurant the service fee applies
   - **Per-Mile Rate** — charge per mile beyond the free radius
   - **Free Delivery Radius (miles)** — miles within which delivery is free (set to 0 to always charge)
   - **Small Order Threshold ($)** — orders below this amount incur the small order fee
   - **Small Order Fee ($)** — the extra fee for small orders
   - **Driver Base Pay ($)** — guaranteed minimum a dispatcher earns per delivery
   - **Driver Mileage Pay ($/mi)** — extra per-mile payment to the dispatcher
4. Click **"Save Changes"**
5. You'll see a **green success message** confirming the save
6. The rates are now live — new orders will use these rates immediately

### How Dispatcher Pay Works

Dispatchers earn:
- **Base Pay ($3.00)** — guaranteed for every delivery
- **Mileage Pay ($0.70 × miles)** — scales with distance
- Example: 5-mile delivery = $3.00 + ($0.70 × 5) = **$6.50** for the dispatcher

### Verifying Your Changes

After saving, go to **Admin → Financial → Active Rates** tab to confirm the new rates are active. The settings page also re-loads from the database after save to confirm persistence.

---

## 11. Blog Management

**Page:** `/admin/blog`

### Creating a Blog Post

1. Click **"+ New Post"**
2. Fill in:
   - **Title** — the article headline
   - **Slug** — auto-generated from title (editable)
   - **Content** — use the rich text editor:
     - Headings (H1, H2), Bold, Italic
     - Bullet lists and numbered lists
     - Code blocks and blockquotes
     - Insert links
     - Upload images (drag-drop or URL)
     - Embed videos (paste YouTube/Vimeo URL — auto-detected)
     - Text alignment
     - Undo/Redo
   - **Featured Image** — the main image for the post
   - **Categories** — create or select categories
   - **Tags** — create or select tags
   - **Meta Title** — SEO title (shown in Google search results)
   - **Meta Description** — SEO description (shown under the title in Google)
   - **Meta Keywords** — SEO keywords
3. Click **"Publish"** to make it live, or **"Save as Draft"** to keep it private

### Editing a Post

1. Find the post in the list
2. Click the **edit icon**
3. Make changes
4. Click **"Update"**

### Publishing / Unpublishing

- Toggle the **publish switch** on any post
- Published posts appear on the public blog at `/blog`
- Unpublished posts are only visible in the admin panel

### Deleting a Post

1. Click the **trash icon** on the post
2. Confirm deletion

---

## 12. Customer Reviews

**Page:** `/admin/reviews`

### Moderating Reviews

When a customer submits a review (star rating + comment):
1. It appears here with status **"Pending"**
2. Read the review content and rating
3. Click **"Approve"** to publish it (visible to all visitors)
4. Click **"Reject"** to hide it (only you can see it)

### Why This Matters

- Approved reviews build trust with new customers
- You can filter out inappropriate or fake reviews
- Reviews appear on the customer's account page and can be displayed on the public site

---

## 13. Analytics

**Page:** `/admin/analytics`

### What You Can See

- **Revenue Chart** — sales over time (daily/weekly/monthly)
- **Category Performance** — which menu categories generate the most revenue
- **Peak Hours** — busiest times of day (helps with staffing)
- **Customer Satisfaction** — average review ratings over time

### Using the Date Filter

- Select a start and end date to focus on a specific period
- Compare performance across different timeframes

### Exporting Data

- Download analytics data as CSV for external analysis or record-keeping

---

## 14. Marketing Campaigns

**Page:** `/admin/marketing`

### Creating a Campaign

1. Click **"+ New Campaign"**
2. Fill in:
   - **Name** — e.g., "Summer Special 2026"
   - **Type** — Discount, Email, Social, or Loyalty
   - **Description** — what the campaign is about
   - **Status** — Draft, Active, or Completed
   - **Estimated Reach** — how many customers you expect to reach
3. Click **"Create"**

### Managing Campaigns

- View all campaigns in a list with status indicators
- Edit campaign details
- Change status from Draft → Active → Completed
- Track basic performance metrics

---

## 15. Customer Management

**Page:** `/admin/customers`

### Viewing Customers

- List of all registered customers
- Shows: Name, phone number, date joined
- Use the **search bar** to find customers by name or phone

### What You Can Do

- View customer order history (click on a customer)
- See total spend and order count
- Identify your most valuable customers

---

## 16. Inventory Management

**Page:** `/admin/inventory`

### Viewing Stock Levels

- All menu items with their current stock quantities
- Color-coded alerts:
  - **Green** — adequate stock
  - **Yellow** — low stock (below 5)
  - **Red** — out of stock (0)

### Updating Stock

**Single item:**
1. Click on the stock quantity number
2. Type the new quantity
3. Press Enter to save

**Bulk update:**
1. Select multiple items with checkboxes
2. Choose an action: Add, Subtract, or Set
3. Enter the quantity
4. Confirm

### Filters

- **All** — everything
- **Low Stock** — items below 5
- **Critical** — items below 2
- **Out of Stock** — items at 0

### Why This Matters

- Prevents customers from ordering items you don't have
- Helps you know when to restock
- Out-of-stock items can be hidden from the customer menu

---

## 17. Loyalty Program Settings

**Page:** `/admin/loyalty`

### How the Loyalty Program Works

Customers earn points with every order and can redeem them for rewards. Higher tiers unlock better benefits.

### Configuring Points

- **Points per Dollar** — how many points a customer earns per $1 spent (e.g., 10 points = 1 point per dime)

### Tier Configuration

| Tier | Points Required | Benefits |
|------|----------------|----------|
| **Bronze** | 0–500 | 5% off every 10th order, birthday surprise |
| **Silver** | 501–2,000 | 10% off every 5th order, free delivery, exclusive items |
| **Gold** | 2,001+ | 15% off all orders, priority preparation, chef's table invites |

### Redemption Options

Configure what customers can redeem:
- **Free Truffle Fries** — 200 points
- **Signature Cocktail** — 350 points
- **$10 Discount** — 500 points

### How to Modify

1. Go to **Admin → Loyalty**
2. Adjust points-per-dollar rate
3. Modify tier thresholds and benefits
4. Add/edit/remove redemption options
5. Click **"Save"**

---

## 18. General Settings

**Page:** `/admin/settings`

### Restaurant Information

- **Restaurant Name** — your business name
- **Address** — full street address
- **Phone** — contact number
- **Email** — contact email
- **Currency** — displayed currency symbol

### Delivery Fee Configuration

(See Section 10 for detailed explanation)

### Tax Rate

- Tax is set at **8%** in the system (configured in the cart store code)
- To change the tax rate, the development team needs to update the code

### GPS Coordinates

- **Restaurant Latitude/Longitude** — used for distance calculations
- Default: 46.8772, -96.7898 (Moorhead, MN)
- Only change if the restaurant relocates

---

## 19. Dispatcher Portal Guide

This section helps you understand what your dispatchers see and do.

### Dispatcher Registration

**URL:** `/dispatcher/register`

A person wanting to become a dispatcher:
1. Creates a customer account on the site
2. Goes to `/dispatcher/register`
3. Fills in: name, phone, email, vehicle type, make/model, year, license plate, address
4. Submits — application goes to **Admin → Dispatcher Applications** for review
5. Once approved, they can access the Dispatcher Portal

### Dispatcher Portal

**URL:** `/dispatcher`

Once approved, dispatchers see:

**Status Controls:**
- Available — ready to receive deliveries
- Busy — currently on a delivery
- On Break — temporarily unavailable
- Offline — not working

**Stats Cards:**
- Active Deliveries (count)
- Completed Today (count)
- On The Way (count)

**Active Deliveries:**
- Order ID, status badge, delivery address, total amount
- **Live Map** showing their location and the customer's location
- **Action Buttons** (progress through the delivery):
  1. **Mark Picked Up** — food collected from restaurant
  2. **Start Delivery** — heading to customer
  3. **Mark Arrived** — at customer location
  4. **Confirm Complete** — delivery finished

**GPS Tracking:**
- The dispatcher's phone shares their location in real-time
- Customers can see the dispatcher's live location on the tracking page

### Dispatcher Earnings

**URL:** `/dispatcher/earnings`

- Total earned, total paid, pending payout, total deliveries
- History of each delivery with distance, base pay, mileage pay, total

### Dispatcher Payment Settings

**URL:** `/dispatcher/payment-settings`

- Enter bank routing number and account number
- Used for payout processing
- Saved securely in the database

---

## 20. Customer Experience Overview

Understanding what your customers see helps you manage the platform better.

### Customer Journey

1. **Homepage** — sees featured dishes, hero image, trust indicators (4.9 rating, 12min wait, 11+ years)
2. **Menu** (`/menu`) — browses items, filters by category/dietary needs, searches by name
3. **Item Detail** — clicks an item to see full details: images, description, ingredients, nutrition, allergens
4. **Cart** (`/cart`) — reviews items, adjusts quantities, enters coupon code
5. **Checkout** (`/checkout`) — 3 steps:
   - Step 1: Delivery info (name, address, phone, special instructions)
   - Step 2: Payment method (card, PayPal, Apple Pay, Google Pay, cash)
   - Step 3: Review order
6. **Order Confirmation** — sees order number and tracking link
7. **Tracking** (`/track/[orderId]`) — real-time map with dispatcher location, 8-step status progression
8. **Loyalty** (`/loyalty`) — checks points balance, tier status, redeems rewards

### Loyalty Points Earning

- Every order earns points (configurable rate)
- Visiting the QR menu in-restaurant earns +10 points daily
- Sharing the menu earns +5 points
- Points unlock tier benefits (Bronze → Silver → Gold)

### Customer Account

**URL:** `/account`

Three tabs:
- **Orders** — order history with real-time status updates
- **Profile** — edit name, email, phone, address
- **Rewards** — loyalty points, tier, available rewards

---

## 21. Troubleshooting

### "I can't log in"

- Make sure you're using the Google account registered as admin
- Clear your browser cookies and try again
- Contact the development team to verify your email is in the admin role

### "Menu items aren't showing on the public site"

- Check that the item is marked as **"Available"** (toggle in admin menu)
- Check that the item has a **stock quantity > 0**
- Check that a **category** is assigned

### "Delivery fees seem wrong"

- Go to **Admin → Settings** and verify the rates
- Go to **Admin → Financial → Active Rates** to see current active rates
- Check that the **Free Delivery Radius** isn't set too high (customers within this radius won't be charged delivery fees)

### "A dispatcher isn't receiving deliveries"

- Go to **Admin → Dispatcher Applications** and confirm they're **Approved**
- Ask the dispatcher to check their **status** is set to "Available"
- Check **Admin → Delivery** to see if assignments are being created

### "Orders are stuck in Pending"

- Go to **Admin → Orders** and manually change the status
- Or check if the **Employee (Kitchen Staff)** portal is being used to accept orders

### "Financial numbers don't look right"

- Check **Admin → Financial → Active Rates** to verify current fee structure
- Ensure the `delivery_settings` table has correct values (check via Admin → Settings)
- Platform fees are created automatically when orders are placed — check the Transactions tab

### "Blog post isn't showing publicly"

- Make sure the post is **Published** (toggle the publish switch)
- Check that a **featured image** is uploaded
- Verify the **slug** is correct

### "Reviews aren't appearing"

- Go to **Admin → Reviews** and **approve** pending reviews
- Only approved reviews are visible to customers

---

## Quick Reference: Admin Pages at a Glance

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin` | Overview KPIs and recent orders |
| Orders | `/admin/orders` | View/manage all customer orders |
| Menu | `/admin/menu` | Add, edit, delete menu items |
| QR Codes | `/admin/menu/qr` | Generate QR codes for in-restaurant menus |
| Delivery | `/admin/delivery` | Assign dispatchers, track deliveries |
| Dispatcher Apps | `/admin/dispatcher-applications` | Approve/reject dispatcher applicants |
| Financial | `/admin/financial` | Revenue, expenses, per-delivery breakdown |
| Blog | `/admin/blog` | Create and manage blog posts |
| Reviews | `/admin/reviews` | Moderate customer reviews |
| Analytics | `/admin/analytics` | Revenue charts, peak hours, category performance |
| Marketing | `/admin/marketing` | Create and manage campaigns |
| Customers | `/admin/customers` | View customer list and details |
| Inventory | `/admin/inventory` | Track and update stock levels |
| Loyalty | `/admin/loyalty` | Configure points, tiers, and rewards |
| Settings | `/admin/settings` | Restaurant info, delivery fees, GPS coordinates |

---

*This manual was generated for The Spice Grille platform. For technical support or feature requests, contact the development team.*
