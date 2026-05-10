CREATE TABLE IF NOT EXISTS doctor_blocks (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_blocks_doctor_date
ON doctor_blocks(doctor_id, date);