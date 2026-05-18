# Dashboard Builder

A dynamic drag-and-drop dashboard builder inspired by Webflow/Figma. Add, resize, and arrange **Text**, **Image**, and **Chart** widgets on a free-form canvas. Layouts persist to a MySQL database.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, react-grid-layout, react-quill, Chart.js |
| Backend  | Node.js, Express |
| Database | MySQL (remote Hostinger or local) |

## Prerequisites

- Node.js >= 18
- npm >= 9
- MySQL database

## Setup

### 1. Clone & install dependencies

```bash
# Server
cd server && npm install

# Client (new terminal)
cd client && npm install
```

### 2. Configure environment

The `server/.env` file is pre-configured with the remote Hostinger database. To use a different database, edit `server/.env`:

```
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
PORT=5000
```

### 3. Import the database schema

Run `sql/schema.sql` on your MySQL database. In MySQL CLI:

```sql
source sql/schema.sql
```

Or import via phpMyAdmin / MySQL Workbench.

Optionally load sample data:

```sql
source sql/sample_data.sql
```

### 4. Run the application

**Terminal 1 — Backend API:**

```bash
cd server
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend:**

```bash
cd client
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> **Note:** Port 5173 is the Vite default. If it's taken (e.g. by another dev server), Vite auto-picks the next free port — check the terminal output for the actual URL. The backend runs on port **3001**.

## Features

| Feature | Details |
|---------|---------|
| **Add widgets** | Click any item in the left sidebar to add to canvas |
| **Drag & resize** | Drag by header, resize from bottom-right handle |
| **Text widget** | Double-click to open rich text editor (bold, italic, font size, color, lists) |
| **Image widget** | Click placeholder to upload; supports PNG/JPG/GIF/WebP up to 10 MB |
| **Chart widget** | Bar & line charts with seeded dynamic data; toggle type in right panel |
| **Right panel** | Live position/size readout + per-widget properties (chart type, color theme, alt text) |
| **Save** | Persists full layout to MySQL; restored automatically on page reload |
| **Multiple dashboards** | Create and switch dashboards via the top bar |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboards` | List all dashboards |
| `POST` | `/api/dashboards` | Create a new dashboard |
| `GET` | `/api/dashboards/:id` | Get dashboard with widgets |
| `PUT` | `/api/dashboards/:id/layout` | Save full layout |
| `DELETE` | `/api/dashboards/:id` | Delete a dashboard |
| `POST` | `/api/upload` | Upload an image |

## Project Structure

```
dashboard-builder-clone/
├── client/            # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── TopBar.jsx
│       │   ├── LeftSidebar.jsx
│       │   ├── Canvas.jsx
│       │   ├── RightPanel.jsx
│       │   └── widgets/
│       │       ├── TextWidget.jsx
│       │       ├── ImageWidget.jsx
│       │       └── ChartWidget.jsx
│       ├── api/dashboardApi.js
│       └── App.jsx
├── server/            # Node.js + Express API
│   ├── src/
│   │   ├── db.js
│   │   ├── routes/dashboards.js
│   │   ├── routes/uploads.js
│   │   └── index.js
│   └── uploads/       # Stored image files
├── sql/
│   ├── schema.sql
│   └── sample_data.sql
└── README.md
```
