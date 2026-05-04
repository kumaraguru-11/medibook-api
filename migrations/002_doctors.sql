CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    experience INT,
    description TEXT,
    verification_status VARCHAR(20)
        CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED'))
        DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_verification ON doctors(verification_status);