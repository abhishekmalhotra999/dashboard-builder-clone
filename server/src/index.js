require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const dashboardsRouter = require('./routes/dashboards');
const uploadsRouter = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/dashboards', dashboardsRouter);
app.use('/api/upload', uploadsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Dashboard Builder API running on http://localhost:${PORT}`);
});
