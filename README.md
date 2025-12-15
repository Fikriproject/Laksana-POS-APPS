# 🚀 Kasir Laksana - Premium Modern POS System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React_%2B_Vite-61DAFB.svg?logo=react)
![TailwindCSS](https://img.shields.io/badge/styling-TailwindCSS-06B6D4.svg?logo=tailwindcss)
![PHP](https://img.shields.io/badge/backend-PHP_Native-777BB4.svg?logo=php)
![MySQL](https://img.shields.io/badge/database-MySQL-4479A1.svg?logo=mysql)

**Kasir Laksana** is a state-of-the-art Point of Sale (POS) application designed for modern retail businesses. Built with a focus on User Experience (UX) and performance, it features a **Premium Soft UI** design, real-time transaction processing, and comprehensive inventory management.

## ✨ Key Features

- **🎨 Premium Soft UI Design**: A stunning, modern interface with glassmorphism effects, smooth animations, and a fully responsive layout.
- **🌗 Dark & Light Mode**: Seamlessly switch between themes for comfortable viewing in any lighting condition.
- **📱 Multi-Device Support**: Optimized for PC, Tablet, and Mobile. Use your PC as a server and connect multiple cashier devices via local network.
- **🛒 Advanced POS Terminal**:
  - Fast product search (Scan/Type).
  - Dynamic cart management with stock validation.
  - Custom tax & discount handling (Fixed/Percentage).
  - **Local Storage Backup**: Never lose a cart session on refresh.
- **📦 Inventory Management**: Track stock levels, low stock alerts, and manage suppliers.
- **📊 Interactive Reports**: Visual sales data with charts, top-selling products, and revenue analysis.
- **🖨️ Receipt Printing**: Professional thermal receipt printing support with custom store details.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: TailwindCSS
- **Icons**: Material Symbols Rounded
- **State Management**: React Context API
- **Notifications**: React Hot Toast

### Backend
- **Language**: PHP (Native/Vanilla)
- **Database**: MySQL
- **Architecture**: REST API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) & pnpm
- PHP (v8.0+)
- MySQL Server

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kasir-laksana.git
   cd kasir-laksana
   ```

2. **Frontend Setup**
   ```bash
   cd apps/admin-dashboard
   pnpm install
   ```

3. **Backend Setup**
   - Import `apps/api/database/schema.sql` to your MySQL database (create a DB named `pos_cashier`).
   - Copy `.env.example` to `.env` in `apps/api` and configure your DB credentials.
   ```bash
   cd apps/api
   composer install
   ```

### 🏃‍♂️ Running the App

**1. Start Backend Server**
```bash
cd apps/api
# Serve on localhost:8000
php -S 127.0.0.1:8000 -t public
```

**2. Start Frontend**
```bash
cd apps/admin-dashboard
pnpm dev
```
Access the app at `http://localhost:5173`.

## 🌐 Network Access (Multi-Device)

To use other devices on the same Wi-Fi:
1. Find your host PC's IP address (e.g., `192.168.1.17`).
2. Run the frontend with host exposed: `pnpm dev --host`.
3. Open `http://YOUR_IP:5173` on the cashier's tablet/phone.

## 📸 Screenshots

*(Placeholder: Add your screenshots here)*

---
Developed with ❤️ by **[Your Name/Team]**
