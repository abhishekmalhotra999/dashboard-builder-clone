# Dashboard Builder

A drag-and-drop dashboard builder built with **React** on the frontend and **Node.js + Express** on the backend. Create dashboards with charts, text, and image widgets — all saved to a MySQL database.

## Tech Stack

- **Frontend** — React 18, Vite, react-grid-layout, Chart.js, Quill
- **Backend** — Node.js, Express
- **Database** — MySQL

## Installation

Open two terminals and run the following:

```bash
# Terminal 1 — Backend
cd server
npm i
npm run dev
# Runs on http://localhost:3001
```

```bash
# Terminal 2 — Frontend
cd client
npm i
npm run dev
# Runs on http://localhost:5173
```

## Environment Setup

Create a file at `server/.env` with these credentials:

```env
DB_HOST=srv679.hstgr.io
DB_USER=u146181273_dashboard_b
DB_PASSWORD=DashboardBuilder@123
DB_NAME=u146181273_dashboard_b
DB_PORT=3306
PORT=3001
```

## Features

- **Drag & drop** widgets from the sidebar onto the canvas
- **Widget types** — Heading (rich text), Bar chart, Line chart, Image
- **Right panel** — Edit chart type, title, Y-axis, legend, color theme, data points, image URL/alt/fit
- **Layers panel** — View and select all widgets on the canvas
- **Save & autosave** — Manual save (button or Ctrl+S) + autosave after 2s of inactivity
- **Dashboard management** — Create new dashboards, rename, delete
- **Canvas background** — Customizable background color
- **Persistent storage** — Full layout and widget data saved to MySQL, restored on reload
