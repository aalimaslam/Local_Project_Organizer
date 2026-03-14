require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', apiRoutes); // We move everything under /api for better cleanliness

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Database Sync & Start
async function start() {
  try {
    await sequelize.authenticate();
    console.log('📦 Database connection established.');
    
    // Sync models (creates tables)
    // In production, you'd use migrations, but for LocalOrg, sync({ alter: true }) is fine for local scale.
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 LocalOrg Backend running on http://localhost:${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Unable to start backend:', error);
    process.exit(1);
  }
}

start();
