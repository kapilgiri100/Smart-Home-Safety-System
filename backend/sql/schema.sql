-- Guardian smart-home database schema (plain PostgreSQL, no ORM)
-- Run with: psql -U postgres -d smart_home_db -f sql/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appliances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) UNIQUE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    fire_status BOOLEAN NOT NULL DEFAULT FALSE,
    gas_status BOOLEAN NOT NULL DEFAULT FALSE,
    water_level NUMERIC(5, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    event TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Default appliances (id order matches the dashboard cards)
INSERT INTO
    appliances (name, status)
VALUES ('Light', FALSE),
    ('Fan', FALSE),
    ('TV', FALSE),
    ('Smart Socket', FALSE) ON CONFLICT (name) DO NOTHING;

-- Single sensor row the backend keeps updating in place
INSERT INTO
    sensors (
        fire_status,
        gas_status,
        water_level
    )
SELECT FALSE, FALSE, 0
WHERE
    NOT EXISTS (
        SELECT 1
        FROM sensors
    );