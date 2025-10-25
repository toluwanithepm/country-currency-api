const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const path = require('path');
const fs = require('fs');

// POST /countries/refresh -> Fetch all countries and exchange rates, then cache them
router.post('/refresh', countryController.refreshCache);

// NEW ROUTE: POST /countries -> Create a new country record, protected by validation
// This line was missing and caused the 404 error.
router.post('/', countryController.validateCountryData, countryController.createCountry);

// GET /countries -> Get all countries from the DB (support filters and sorting)
router.get('/', countryController.getCountries);

// GET /countries/status -> Show total countries and last refresh timestamp
router.get('/status', countryController.getStatus);

// GET /countries/image -> Serve the generated summary image
router.get('/image', (req, res, next) => {
    const imagePath = path.join(process.cwd(), process.env.CACHE_DIR || 'cache', 'summary.png');
    
    if (fs.existsSync(imagePath)) {
        // Send the file and set the correct content type
        res.sendFile(imagePath, (err) => {
            if (err) {
                console.error("Error sending image file:", err);
                next(err); 
            }
        });
    } else {
        // Return JSON error if image is not found, as required
        next({ status: 404, message: 'Summary image not found', isCustom: true });
    }
});


// GET /countries/:name -> Get one country by name
router.get('/:name', countryController.getCountryByName);

// DELETE /countries/:name -> Delete a country record
router.delete('/:name', countryController.deleteCountryByName);

module.exports = router;
