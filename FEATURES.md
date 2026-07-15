# Spice Grill / Fable OS — Feature Inventory

## Customer-Facing Features

### Menu Browsing
- Category-filtered food menu with descriptions, pricing, and images
- QR code menu view for in-restaurant scanning
- Dedicated menu detail pages per item

### Cart & Checkout
- Add/remove items with quantity management (persisted via Zustand + localStorage)
- Full checkout flow with delivery address and shipping method selection
- Online payment processing via Paystack

### User Accounts & Authentication
- Email/password registration and login (Supabase Auth)
- Google OAuth single sign-on
- Personal account management page

### Order Management
- View order history with real-time status updates
- Individual order detail pages
- Delivery order tracking by order ID with live status

### Loyalty Program
- Points accumulation on purchases
- Points redemption and validation
- Per-user loyalty status tracking

### Blog
- Public blog with categorized articles
- Rich text content powered by Tiptap editor

### Dispatcher Portal
- Dispatcher registration and application flow
- Live delivery tracking with interactive map (Leaflet)
- Dispatcher status management

---

## Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with key business metrics and stats |
| **Orders Management** | View, filter, update status, and modify orders |
| **Menu Management** | Full CRUD for food items and categories |
| **QR Code Generator** | Generate QR codes for menu access |
| **Delivery Management** | Assign dispatchers, track delivery lifecycle (pending → preparing → ready_for_pickup → assigned → picked_up → on_the_way → delivered) |
| **Dispatcher Applications** | Approve or reject dispatcher registrations |
| **Blog Admin** | Create, edit, and publish blog posts with rich text editor |
| **Analytics** | Sales data, order trends, and performance metrics |
| **Customer Management** | View and manage customer list and details |
| **Inventory Management** | Track stock levels and ingredient quantities |
| **Marketing** | Campaign management tools |
| **Reviews** | View and moderate customer reviews |
| **Loyalty Admin** | Configure loyalty reward rules and parameters |
| **Settings** | App-wide configuration |

---

## Technical Infrastructure

- **Authentication**: Supabase Auth with PKCE flow and role-based access control (admin/user)
- **Database**: Supabase PostgreSQL with Row-Level Security policies, stored procedures, and triggers
- **State Management**: Zustand for client-side cart state with localStorage persistence
- **Styling**: Tailwind CSS v4 with custom design system
- **Animations**: Framer Motion for page transitions and component animations
- **Maps**: Leaflet + react-leaflet for real-time delivery tracking
- **Rich Text Editing**: Tiptap editor for blog and content management
- **Payments**: Paystack payment gateway integration
- **PWA**: Progressive Web App support for mobile installation
- **Notifications**: Sonner toast notifications for user feedback
- **Smooth Scroll**: Lenis for premium scroll experience
- **Deployment**: Hosted on Vercel with GitHub auto-deploy
