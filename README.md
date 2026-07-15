<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

<h1 align="center">Ooty Estate Explorer</h1>

<p align="center">
  <strong>A premium, map-centric real estate platform tailored exclusively for Ooty (Udhagamandalam).</strong>
</p>

## 📖 Overview

Ooty Estate Explorer is a modern web application designed to revolutionize how people discover properties in the Nilgiris. Built with a heavy emphasis on map-first discovery, users can seamlessly browse tea estates, resorts, vacant plots, and flats through an interactive, highly responsive interface.

Whether viewed on a mobile device or a large desktop monitor, the platform delivers a premium, immersive experience complete with full-screen galleries, real-time map clustering, and bookmarking capabilities.

## ✨ Key Features

- **🗺️ Map-First Discovery:** Interactive map powered by MapLibre GL JS, featuring custom markers, dynamic clustering, and a sleek dark-mode aesthetic.
- **📱 True Responsive Design:** Meticulously optimized for Mobile, Tablet, and Desktop. Features include swipeable bottom-sheet preview cards on mobile and floating anchored panels on desktop.
- **🔐 Secure Admin Dashboard:** A protected portal for administrators to seamlessly create, edit, publish, and delete property listings with an integrated location pin-dropper.
- **🖼️ Immersive Galleries:** Full-screen photo and video viewer with thumbnail navigation and swipe gestures for property tours.
- **❤️ Saved Properties:** Wishlist functionality allowing users to effortlessly bookmark and retrieve their favorite listings.
- **⚡ Blazing Fast:** Built on Vite and React for instant page loads and buttery-smooth map panning.

## 🛠️ Technology Stack

- **Frontend Core:** React 18, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Framer Motion (for micro-animations), Lucide React (icons)
- **Mapping:** MapLibre GL JS (via OpenFreeMap tiles)
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Storage, Authentication)

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

- Node.js (v18 or higher recommended)
- A Supabase account (for database and authentication)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vanjinathan23/Ooty_Project.git
   cd Ooty_Project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 📂 Project Structure

```text
src/
├── components/         # Reusable UI components (Map, Sidebar, Forms)
├── utils/              # Helper functions (Currency formatting, etc.)
├── types.ts            # Global TypeScript interfaces
├── supabase.ts         # Supabase client initialization
├── App.tsx             # Main application and routing logic
└── index.css           # Global Tailwind and custom CSS directives
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
<p align="center">
  <i>Built with ❤️ for the Queen of Hill Stations</i>
</p>
