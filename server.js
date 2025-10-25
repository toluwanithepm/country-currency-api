const dotenv = require('dotenv');
const path = require('path');
const { setLogLevel } = require('@supabase/supabase-js');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Set Supabase log level to suppress verbose messages in production
// setLogLevel('silent'); // Optional: Uncomment to silence Supabase logs

const app = require('./src/app');
const { connectDB } = require('./src/config/database');

// Ensure DB connection is attempted on startup (to check credentials)
try {
    connectDB();
    console.log("Supabase client initialized.");
} catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the API at http://localhost:${PORT}`);
});
