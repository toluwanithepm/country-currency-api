const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const { CustomError } = require('../utils/errorHandler');

const CACHE_DIR = process.env.CACHE_DIR || 'cache';
const IMAGE_PATH = path.join(process.cwd(), CACHE_DIR, 'summary.png');

/**
 * Converts a number to a string with a fixed precision and adds a suffix (M, B, T).
 * @param {number} num The number to format.
 * @returns {string} The formatted string.
 */
function formatValue(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num === 0) return '0';
    
    // Use positive number for calculation
    const absNum = Math.abs(num);
    
    if (absNum >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (absNum >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (absNum >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (absNum >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(0);
}

/**
 * Generates a summary image file with top GDP countries and status.
 * @param {Array} topCountries Top 5 countries by GDP.
 * @param {Object} statusData Global status data.
 */
async function generateSummaryImage(topCountries, statusData) {
    try {
        const width = 600;
        const height = 400;
        const backgroundColor = '#1e293b'; // Slate 800
        const primaryColor = '#fcd34d'; // Amber 300
        const secondaryColor = '#e2e8f0'; // Slate 200
        const tertiaryColor = '#60a5fa'; // Blue 400

        // Create an SVG with text elements
        let svgContent = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${backgroundColor}" rx="10"/>
                
                <text x="50%" y="35" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="${primaryColor}" font-weight="bold">
                    Global Cache Summary
                </text>

                <!-- Status Info -->
                <text x="50%" y="80" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${secondaryColor}">
                    Total Countries: ${statusData.total_countries}
                </text>
                <text x="50%" y="105" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${secondaryColor}">
                    Last Refresh: ${new Date(statusData.last_refreshed_at).toLocaleTimeString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                </text>

                <!-- Top GDP List Header -->
                <text x="50%" y="155" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="${tertiaryColor}" font-weight="bold">
                    Top 5 Estimated GDP (USD)
                </text>
        `;

        // Draw Top 5 List
        topCountries.forEach((country, index) => {
            const yPosition = 190 + (index * 35);
            const gdp = formatValue(country.estimated_gdp);
            
            // Country Name (left aligned)
            svgContent += `
                <text x="150" y="${yPosition}" dominant-baseline="middle" text-anchor="start" font-family="Arial, sans-serif" font-size="16" fill="${secondaryColor}">
                    ${index + 1}. ${country.name}
                </text>
            `;
            // Estimated GDP (right aligned)
            svgContent += `
                <text x="450" y="${yPosition}" dominant-baseline="middle" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="${primaryColor}" font-weight="bold">
                    $${gdp}
                </text>
            `;
        });

        svgContent += `</svg>`;

        // Use sharp to convert SVG to PNG
        await sharp(Buffer.from(svgContent))
            .png()
            .toFile(IMAGE_PATH);

    } catch (error) {
        console.error("Error generating summary image:", error.message);
        // The service should not crash the main thread if image generation fails, but log the error.
        // If the file exists, it will remain; if not, it won't be created.
    }
}

module.exports = {
    generateSummaryImage,
    IMAGE_PATH
};
