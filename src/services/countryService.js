const { connectDB } = require('../config/database');
const { fetchCountries, fetchExchangeRates } = require('./apiService');
const { generateSummaryImage } = require('./imageService');
const { CustomError } = require('../utils/errorHandler');

const supabase = connectDB();
const COUNTRIES_TABLE = 'countries';
const STATUS_TABLE = 'status';

/**
 * Calculates a new estimated GDP for a country.
 * @param {number} population
 * @param {number} exchangeRate
 * @returns {number|null} The calculated GDP.
 */
function calculateGdp(population, exchangeRate) {
    // If population is 0, we cannot estimate GDP. Return null.
    if (population === 0 || exchangeRate === null || exchangeRate === 0) return null;
    
    // Generate random multiplier between 1000 and 2000
    const multiplier = Math.random() * (2000 - 1000) + 1000;
    
    // estimated_gdp = population × random(1000–2000) ÷ exchange_rate
    const gdp = (population * multiplier) / exchangeRate;
    return parseFloat(gdp.toFixed(6)); // Store as a fixed precision number
}

/**
 * Processes external country data, calculates GDP, and prepares for upsert.
 * @param {Array} externalCountries
 * @param {Object} rates Exchange rates (USD base).
 * @returns {Array} List of processed country objects.
 */
function processCountryData(externalCountries, rates) {
    const now = new Date().toISOString();
    
    // Use filter/map pipeline to process and then filter invalid results
    const processed = externalCountries.map(country => {
        let currencyCode = null;
        let exchangeRate = null;
        let estimatedGdp = null;

        const population = country.population || 0; // Use 0 if missing

        // 1. Currency Handling
        if (country.currencies && Array.isArray(country.currencies) && country.currencies.length > 0) {
            currencyCode = country.currencies[0].code;
            
            // 2. Exchange Rate & GDP Calculation
            if (rates[currencyCode]) {
                exchangeRate = rates[currencyCode];
                // calculateGdp now handles the population === 0 check
                estimatedGdp = calculateGdp(population, exchangeRate); 
            } else {
                // If currency code is present but rate is not found
                exchangeRate = null;
                estimatedGdp = null;
            }
        } else {
            // If currencies array is empty/missing
            currencyCode = null;
            exchangeRate = null;
            estimatedGdp = null; 
        }

        // Check for required data integrity *before* upserting
        if (!country.name || population === 0 || !currencyCode) {
            // Return null if mandatory fields are missing/invalid
            console.warn(`Skipping country due to missing essential data: Name: ${country.name}, Pop: ${population}, Code: ${currencyCode}`);
            return null;
        }


        // 3. Prepare final object for DB
        return {
            name: country.name,
            capital: country.capital || null,
            region: country.region || null,
            population: population,
            currency_code: currencyCode,
            exchange_rate: exchangeRate,
            estimated_gdp: estimatedGdp,
            flag_url: country.flag || null,
            last_refreshed_at: now
        };
    });

    // Filter out null entries created by the validation check above
    return processed.filter(c => c !== null);
}

/**
 * Fetches data from external APIs, processes it, and updates the database cache.
 */
async function refreshCache() {
    console.log("Starting cache refresh..."); // Added logging
    try {
        // 1. Fetch External Data
        const [countriesData, exchangeRates] = await Promise.all([
            fetchCountries(),
            fetchExchangeRates()
        ]);
        
        // 2. Process Data and filter invalid records
        const processedCountries = processCountryData(countriesData, exchangeRates);
        const now = new Date().toISOString();

        if (processedCountries.length === 0) {
            console.warn("No valid countries found after processing. Aborting upsert.");
            throw new CustomError('No valid country data to save after processing.', 500);
        }

        // 3. Perform Upsert (Update or Insert) using PostgreSQL's ON CONFLICT
        console.log(`Attempting to upsert ${processedCountries.length} records...`); // Added logging
        const { error: upsertError } = await supabase
            .from(COUNTRIES_TABLE)
            .upsert(processedCountries, {
                onConflict: 'name', 
                ignoreDuplicates: false
            });

        if (upsertError) {
            // CRITICAL LOGGING: Now included to debug database failures
            console.error('--- Database Upsert Error ---');
            console.error('Supabase Error Code:', upsertError.code);
            console.error('Supabase Error Details:', upsertError.details);
            console.error('Supabase Error Message:', upsertError.message);
            console.error('-----------------------------');
            throw new CustomError('Database operation failed during refresh', 500);
        }
        
        // 4. Update Global Status
        const { count, error: countError } = await supabase
            .from(COUNTRIES_TABLE)
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error("Database Count Error:", countError);
            throw new CustomError('Failed to count countries after refresh', 500);
        }

        const { data: statusData, error: statusError } = await supabase
            .from(STATUS_TABLE)
            .upsert({ 
                id: 1, 
                total_countries: count, 
                last_refreshed_at: now 
            })
            .select()
            .single();
        
        if (statusError) {
            console.error("Database Status Update Error:", statusError);
            throw new CustomError('Failed to update global status', 500);
        }

        // 5. Generate Summary Image (Async, does not block response)
        const { data: top5, error: top5Error } = await supabase
            .from(COUNTRIES_TABLE)
            .select('*')
            .not('estimated_gdp', 'is', null) // <-- Filter is still here
            .order('estimated_gdp', { ascending: false })
            .limit(5);

        if (!top5Error && statusData) {
            generateSummaryImage(top5, statusData);
        }

        console.log(`Cache refresh complete. Total countries: ${count}`); // Added logging
        return { total_countries: count, last_refreshed_at: now };

    } catch (err) {
        // Re-throw the error for the controller to handle
        console.error("Cache Refresh Fatal Error:", err.message); // Added logging
        throw err;
    }
}

/**
 * Retrieves the global status.
 */
async function getStatus() {
    const { data, error } = await supabase
        .from(STATUS_TABLE)
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows returned
        console.error("Database Status Fetch Error:", error);
        throw new CustomError('Failed to retrieve status data', 500);
    }

    // If no data, return a default state
    if (!data) {
        return { total_countries: 0, last_refreshed_at: null };
    }

    return {
        total_countries: data.total_countries,
        last_refreshed_at: data.last_refreshed_at
    };
}

/**
 * Retrieves all countries with optional filtering and sorting.
 * @param {Object} queryParams - region, currency, sort.
 */
async function getCountries({ region, currency, sort }) {
    let query = supabase.from(COUNTRIES_TABLE).select('*');

    // Filtering
    if (region) {
        query = query.ilike('region', `%${region}%`);
    }
    if (currency) {
        query = query.ilike('currency_code', currency);
    }

    // Sorting
    if (sort) {
        const [field, direction] = sort.split('_');
        const ascending = direction !== 'desc';
        
        // Map sort field to DB column
        let sortColumn = 'name'; // Default sort
        if (field === 'gdp') {
            sortColumn = 'estimated_gdp';
            // FIX: Explicitly exclude NULL GDP records for accurate sorting.
            query = query.not('estimated_gdp', 'is', null);
        } else if (field === 'name') {
            sortColumn = 'name';
        } else if (field === 'population') {
            sortColumn = 'population';
        }

        // Apply sort order (nullsLast is no longer needed since we filter NULLs for GDP sort)
        query = query.order(sortColumn, { ascending, nullsLast: (field !== 'gdp') }); 
    } else {
        // Default sort
        query = query.order('name', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
        console.error("Database Fetch Countries Error:", error);
        throw new CustomError('Failed to retrieve country data', 500);
    }

    return data;
}

/**
 * Retrieves a single country by name.
 * @param {string} name - Country name.
 */
async function getCountryByName(name) {
    // Case-insensitive search requires pattern matching in PostgreSQL
    const { data, error } = await supabase
        .from(COUNTRIES_TABLE)
        .select('*')
        .ilike('name', name)
        .single(); // Expecting one result

    if (error) {
        if (error.code === 'PGRST116') { // No rows returned
            throw new CustomError('Country not found', 404);
        }
        console.error("Database Fetch Country by Name Error:", error);
        throw new CustomError('Failed to retrieve country record', 500);
    }

    return data;
}

/**
 * Deletes a single country record by name.
 * @param {string} name - Country name.
 */
async function deleteCountryByName(name) {
    // Case-insensitive delete
    const { status, error } = await supabase
        .from(COUNTRIES_TABLE)
        .delete()
        .ilike('name', name)
        .select();

    if (error) {
        console.error("Database Delete Error:", error);
        throw new CustomError('Failed to delete country record', 500);
    }
    
    // We rely on the controller to handle the response based on the successful service execution.
    return true; 
}


module.exports = {
    refreshCache,
    getStatus,
    getCountries,
    getCountryByName,
    deleteCountryByName
};
