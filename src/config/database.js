const { createClient } = require('@supabase/supabase-js');
const { CustomError } = require('../utils/errorHandler');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

/**
 * Initializes and returns the Supabase client.
 * @returns {object} Supabase client instance.
 */
function connectDB() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new CustomError('Database configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env.', 500);
    }

    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabase;
}

module.exports = { connectDB };
