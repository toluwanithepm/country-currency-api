-- Create the countries table to cache external data
CREATE TABLE IF NOT EXISTS countries (
    -- id is auto-generated primary key
    id BIGSERIAL PRIMARY KEY,

    -- name is required and unique, used for upserting
    name VARCHAR(255) NOT NULL UNIQUE,

    capital VARCHAR(255),
    region VARCHAR(255),
    
    -- population is required
    population BIGINT NOT NULL,

    -- Currency and rate information
    currency_code VARCHAR(10),
    exchange_rate NUMERIC(18, 6),
    estimated_gdp NUMERIC(25, 6), -- Computed field

    flag_url VARCHAR(512),
    
    -- last_refreshed_at is updated on every upsert
    last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a small table to store global status information
-- We use a fixed ID=1 for the single status row
CREATE TABLE IF NOT EXISTS status (
    id INT PRIMARY KEY,
    total_countries INT NOT NULL,
    last_refreshed_at TIMESTAMP WITH TIME ZONE
);

-- Initialize the status table if it's empty
INSERT INTO status (id, total_countries, last_refreshed_at)
VALUES (1, 0, NULL)
ON CONFLICT (id) DO NOTHING;
