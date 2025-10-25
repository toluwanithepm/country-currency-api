const express = require('express');
const cors = require('cors');
const countryRoutes = require('./routes/countryRoutes');
const { genericErrorHandler, routeNotFoundHandler } = require('./utils/errorHandler');
const path = require('path');
const fs = require('fs');

// Ensure cache directory exists
const cacheDir = process.env.CACHE_DIR || 'cache';
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
    console.log(`Created cache directory: ${cacheDir}`);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/countries', countryRoutes);

// Status route for health check
app.get('/status', (req, res) => res.status(200).send({ message: 'API is running' }));

// Error Handling Middleware
app.use(routeNotFoundHandler);
app.use(genericErrorHandler);

module.exports = app;
