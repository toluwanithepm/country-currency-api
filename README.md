## **README.md**

```markdown
# Country Currency & Exchange Rate API

A RESTful API that fetches country data from external sources, matches currencies with real-time exchange rates, calculates estimated GDP, and provides comprehensive CRUD operations with data persistence in Supabase (PostgreSQL).

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Locally](#running-locally)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)

---

## 🚀 Features

- ✅ Fetch and cache country data from REST Countries API
- ✅ Match currencies with real-time exchange rates
- ✅ Calculate estimated GDP for each country
- ✅ Filter countries by region and currency
- ✅ Sort countries by estimated GDP
- ✅ Generate visual summary reports (PNG images)
- ✅ Full CRUD operations
- ✅ Supabase PostgreSQL database
- ✅ Comprehensive error handling
- ✅ Case-insensitive country name searches

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** (free tier works) - [Sign up here](https://supabase.com/)

To check if Node.js and npm are installed:

```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```

---

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/country-currency-api.git
cd country-currency-api
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

This will install all required packages listed in `package.json`.

### Step 3: Create Required Folders

```bash
mkdir cache
touch cache/.gitkeep
```

---

## 🔑 Environment Variables

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Configure Variables

Open `.env` in your text editor and fill in the values:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-public-key

# External APIs (Optional - defaults provided)
RESTCOUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_API_URL=https://open.er-api.com/v6/latest/USD

# API Timeout in milliseconds (Optional)
API_TIMEOUT=30000
```

### Environment Variables Explained

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | Server port number | `3000` |
| `NODE_ENV` | No | Environment mode | `development` |
| `SUPABASE_URL` | **YES** | Your Supabase project URL | None |
| `SUPABASE_KEY` | **YES** | Your Supabase anon/public key | None |
| `RESTCOUNTRIES_API_URL` | No | REST Countries API endpoint | Provided |
| `EXCHANGE_API_URL` | No | Exchange rates API endpoint | Provided |
| `API_TIMEOUT` | No | External API timeout (ms) | `30000` |

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `country-currency-api`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get API Credentials

1. In your Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy the following:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public key** → This is your `SUPABASE_KEY`
4. Paste these into your `.env` file

### Step 3: Run Database Schema

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste the contents of `sql/schema.sql` (provided below)
4. Click **"Run"** or press `Ctrl+Enter`
5. You should see: **"Success. No rows returned"**

**sql/schema.sql:**
```sql
-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    capital VARCHAR(255),
    region VARCHAR(255),
    population BIGINT NOT NULL,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(20, 6),
    estimated_gdp DECIMAL(30, 2),
    flag_url TEXT,
    last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_currency ON countries(currency_code);
CREATE INDEX IF NOT EXISTS idx_countries_gdp ON countries(estimated_gdp DESC);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    total_countries INTEGER DEFAULT 0,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO system_settings (id, last_refreshed_at, total_countries) 
VALUES (1, NOW(), 0)
ON CONFLICT (id) DO NOTHING;
```

### Step 4: Verify Tables

1. Go to **Table Editor** in Supabase
2. You should see two tables:
   - `countries` (empty)
   - `system_settings` (1 row)

---

## 🏃 Running Locally

### Start the Development Server

```bash
npm run dev
```

Or for production mode:
```bash
npm start
```

### Expected Output

```
Testing Supabase connection...
✓ Supabase connection established
==================================================
✓ Server running on port 3000
✓ Environment: development
✓ API Base URL: http://localhost:3000
==================================================

Available endpoints:
  POST   /countries/refresh
  GET    /countries
  GET    /countries/:name
  DELETE /countries/:name
  GET    /status
  GET    /countries/image
==================================================
```

### Verify Server is Running

Open your browser and go to:
```
http://localhost:3000
```

You should see:
```json
{
  "message": "Country Currency & Exchange API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "refresh": "POST /countries/refresh",
    "getAllCountries": "GET /countries",
    "getCountry": "GET /countries/:name",
    "deleteCountry": "DELETE /countries/:name",
    "status": "GET /status",
    "image": "GET /countries/image"
  }
}
```

---

## 📚 API Endpoints

### Base URL
```
http://localhost:3000
```

### 1. **POST /countries/refresh**
Fetch and cache all countries data from external APIs.

**Request:**
```bash
curl -X POST http://localhost:3000/countries/refresh
```

**Response (200 OK):**
```json
{
  "message": "Countries refreshed successfully",
  "total_countries": 250,
  "last_refreshed_at": "2025-10-25T14:30:00.000Z"
}
```

**Response (503 Service Unavailable):**
```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from restcountries.com"
}
```

---

### 2. **GET /countries**
Get all countries with optional filters and sorting.

**Request:**
```bash
# Get all countries
curl http://localhost:3000/countries

# Filter by region
curl "http://localhost:3000/countries?region=Africa"

# Filter by currency
curl "http://localhost:3000/countries?currency=NGN"

# Sort by GDP (descending)
curl "http://localhost:3000/countries?sort=gdp_desc"

# Combine filters
curl "http://localhost:3000/countries?region=Africa&sort=gdp_desc"
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `region` | string | Filter by region | `Africa`, `Europe`, `Asia`, `Americas`, `Oceania` |
| `currency` | string | Filter by currency code | `NGN`, `USD`, `EUR`, `GBP` |
| `sort` | string | Sort results | `gdp_desc` (only option) |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-25T14:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Ghana",
    "capital": "Accra",
    "region": "Africa",
    "population": 31072940,
    "currency_code": "GHS",
    "exchange_rate": 15.34,
    "estimated_gdp": 3029834520.6,
    "flag_url": "https://flagcdn.com/gh.svg",
    "last_refreshed_at": "2025-10-25T14:30:00.000Z"
  }
]
```

---

### 3. **GET /countries/:name**
Get a single country by name (case-insensitive).

**Request:**
```bash
# All these work the same (case-insensitive)
curl http://localhost:3000/countries/Nigeria
curl http://localhost:3000/countries/nigeria
curl http://localhost:3000/countries/NIGERIA
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139589,
  "currency_code": "NGN",
  "exchange_rate": 1600.23,
  "estimated_gdp": 25767448125.2,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-10-25T14:30:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Country not found"
}
```

---

### 4. **DELETE /countries/:name**
Delete a country record by name (case-insensitive).

**Request:**
```bash
curl -X DELETE http://localhost:3000/countries/Nigeria
```

**Response (200 OK):**
```json
{
  "message": "Country deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Country not found"
}
```

---

### 5. **GET /status**
Get system status and statistics.

**Request:**
```bash
curl http://localhost:3000/status
```

**Response (200 OK):**
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-25T14:30:00.000Z"
}
```

---

### 6. **GET /countries/image**
Get the generated summary image showing top 5 countries by GDP.

**Request:**
```bash
# View in browser
http://localhost:3000/countries/image

# Download with curl
curl http://localhost:3000/countries/image --output summary.png
```

**Response (200 OK):**
- Content-Type: `image/png`
- Returns the summary image

**Response (404 Not Found):**
```json
{
  "error": "Summary image not found"
}
```

---

## 🧪 Testing

### Test with cURL

```bash
# 1. Check server health
curl http://localhost:3000/

# 2. Refresh data (takes 10-30 seconds)
curl -X POST http://localhost:3000/countries/refresh

# 3. Get all countries
curl http://localhost:3000/countries

# 4. Filter by region
curl "http://localhost:3000/countries?region=Africa"

# 5. Get single country
curl http://localhost:3000/countries/Nigeria

# 6. Get status
curl http://localhost:3000/status

# 7. Download image
curl http://localhost:3000/countries/image --output test-summary.png
```

### Test with Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new request for each endpoint
3. Set the correct HTTP method (GET, POST, DELETE)
4. Add query parameters where needed

### Verify Database

1. Go to Supabase → **Table Editor** → **countries**
2. After running `/countries/refresh`, you should see ~250 rows
3. Check `system_settings` table for last refresh timestamp

---

## 🚀 Deployment

### Deploy to Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository

3. **Add Environment Variables**
   - Click on your service
   - Go to **"Variables"** tab
   - Add all variables from your `.env` file

4. **Generate Domain**
   - Go to **"Settings"** → **"Domains"**
   - Click **"Generate Domain"**
   - Your API will be available at the generated URL

5. **Test Deployed API**
   ```bash
   curl https://your-app.up.railway.app/status
   ```

### Other Deployment Options

- **Heroku**: [Documentation](https://devcenter.heroku.com/)
- **AWS EC2**: [Documentation](https://aws.amazon.com/ec2/)
- **DigitalOcean**: [Documentation](https://www.digitalocean.com/products/app-platform)
- **Fly.io**: [Documentation](https://fly.io/docs/)

**Note:** Vercel and Render are NOT allowed for this project.

---

## 📁 Project Structure

```
country-currency-api/
├── .env                          # Environment variables (DO NOT COMMIT)
├── .env.example                  # Example environment file
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── README.md                     # This file
├── server.js                     # Application entry point
├── cache/                        # Generated images
│   └── .gitkeep                  # Keep folder in git
├── sql/
│   └── schema.sql                # Database schema
└── src/
    ├── app.js                    # Express app setup
    ├── config/
    │   └── database.js           # Supabase configuration
    ├── controllers/
    │   └── countryController.js  # Request handlers
    ├── routes/
    │   └── countryRoutes.js      # Route definitions
    ├── services/
    │   ├── apiService.js         # External API calls
    │   ├── countryService.js     # Business logic
    │   └── imageService.js       # Image generation
    └── utils/
        └── errorHandler.js       # Error handling utilities
```

---

## 📦 Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Web framework |
| `dotenv` | ^16.3.1 | Environment variable management |
| `@supabase/supabase-js` | ^2.39.0 | Supabase client |
| `axios` | ^1.6.2 | HTTP client for external APIs |
| `canvas` | ^2.11.2 | Image generation |
| `cors` | ^2.8.5 | Cross-origin resource sharing |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.0.2 | Auto-restart server on file changes |

### Install All Dependencies

```bash
npm install
```

### Install Production Only

```bash
npm install --production
```

### Install Specific Package

```bash
npm install express
npm install --save-dev nodemon
```

---

## 🐛 Troubleshooting

### Canvas Installation Issues

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas
```

**Windows:**
```bash
npm install --global windows-build-tools
npm install canvas
```

### Port Already in Use

```bash
# Kill process on port 3000
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Supabase Connection Failed

- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Ensure no extra spaces or quotes
- Verify database schema was run successfully
- Check Supabase project is active

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Toluwani Oluwamuyiwa - goldenwritertolu@gmail.com

---

## 🙏 Acknowledgments

- [REST Countries API](https://restcountries.com/)
- [Exchange Rate API](https://www.exchangerate-api.com/)
- [Supabase](https://supabase.com/)

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: goldenwritertolu@gmail.com

---

## ✅ Quick Start Checklist

- [ ] Node.js v18+ installed
- [ ] Cloned repository
- [ ] Ran `npm install`
- [ ] Created Supabase project
- [ ] Copied `.env.example` to `.env`
- [ ] Added Supabase credentials to `.env`
- [ ] Ran database schema in Supabase SQL Editor
- [ ] Started server with `npm run dev`
- [ ] Tested health endpoint at `http://localhost:3000`
- [ ] Ran `POST /countries/refresh` successfully
- [ ] Verified data in Supabase Table Editor

**You're ready to go! 🚀**
```

---

This comprehensive README covers everything needed to set up, run, and deploy your API. Copy this into your project's `README.md` file!
