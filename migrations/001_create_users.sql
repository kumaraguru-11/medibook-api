CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('USER', 'DOCTOR', 'ADMIN', 'UNASSIGNED')) 
        DEFAULT 'UNASSIGNED' NOT NULL,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Doctor-specific fields
    specialty VARCHAR(100),
    experience INT,
    description TEXT,
    verification_status VARCHAR(20) 
        CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')) 
        DEFAULT 'PENDING'
);


CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_users_verification_status 
ON users(verification_status);
