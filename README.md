# 🍫 Little Brownie Co.

A full-stack e-commerce web app built for **Little Brownie Co.**, a handcrafted brownie bakery based in Bengaluru. The platform lets customers browse the menu, place orders, track deliveries, and get in touch — while giving the business a clean, modern storefront to manage sales online.

**🔗 Live site:** [www.littlebrownieco.in](https://www.littlebrownieco.in/)

---

## ✨ Features

- **Product menu & catalog** — browse brownies (loaves, slabs, boxes, tubs, and more) with pricing, descriptions, and images
- **Shopping cart & checkout** — add items to cart, review order, and complete purchase
- **Order tracking** — customers can track the status of their order after placing it
- **WhatsApp integration** — one-click chat for orders, custom gifting requests, and quotes
- **Reviews section** — collects and displays customer feedback
- **Informational pages** — About Us, FAQs, Ingredients & Allergens, Sustainable Packaging, and Order/Delivery Policies
- **Responsive design** — works cleanly across mobile and desktop
- **Backend powered by Supabase** — for data storage, auth, and order management

---

## 🛠️ Tech Stack

**Frontend**
- [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) for routing and SSR
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)-style components for accessible, reusable UI primitives
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for form handling and validation
- [Recharts](https://recharts.org/) for data visualization
- [Lucide React](https://lucide.dev/) for icons

**Backend / Infra**
- [Supabase](https://supabase.com/) for database, authentication, and backend services
- [Vite](https://vitejs.dev/) as the build tool

**Tooling**
- ESLint + Prettier for code quality and formatting
- npm for package management

---

## 📂 Project Structure

```
LittleBrownieCo/
├── public/              # Static assets
├── src/                 # Application source code (components, routes, pages, logic)
├── supabase/            # Supabase config, migrations, and backend setup
├── .env.example         # Environment variable template
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- A [Supabase](https://supabase.com/) project (for backend/database features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/neha28kudale/LittleBrownieCo.git
   cd LittleBrownieCo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project URL and keys (and any other required values) in the `.env` file.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### Other useful scripts

| Command             | Description                              |
|----------------------|-------------------------------------------|
| `npm run build`      | Build the app for production             |
| `npm run build:dev`  | Build in development mode                |
| `npm run preview`    | Preview the production build locally     |
| `npm run lint`       | Run ESLint checks                        |
| `npm run format`     | Format code with Prettier                |

---

## 📌 About This Project

This project was built to give a small, real-world bakery business a proper online ordering presence — from product discovery all the way to checkout and order tracking. It reflects practical, end-to-end product thinking: understanding a real customer's needs, designing a usable storefront, and building it with a modern, production-ready tech stack.

---

## 📬 Contact

Built by **Neha Kudale** — [GitHub](https://github.com/neha28kudale)

For questions about the project, reach out via [WhatsApp](https://wa.me/9850416581) 
