const axios = require('axios');
const { CustomError } = require('../utils/errorHandler');

const COUNTRIES_API = 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

/**
 * Fetches country data from the external API.
 * @returns {Promise<Array>} List of country objects.
 */
async function fetchCountries() {
    try {
        const response = await axios.get(COUNTRIES_API, { timeout: 15000 });
        return response.data;
    } catch (error) {
        throw new CustomError('External data source unavailable', 503, 'Could not fetch data from Restcountries API');
    }
}

/**
 * Fetches exchange rates against USD from the external API.
 * @returns {Promise<Object>} Object containing currency rates.
 */
async function fetchExchangeRates() {
    try {
        const response = await axios.get(EXCHANGE_RATE_API, { timeout: 15000 });
        if (response.data && response.data.rates) {
            return response.data.rates;
        }
        throw new Error('Invalid exchange rate response structure.');
    } catch (error) {
        throw new CustomError('External data source unavailable', 503, 'Could not fetch data from Open ER API');
    }
}

module.exports = {
    fetchCountries,
    fetchExchangeRates
};
