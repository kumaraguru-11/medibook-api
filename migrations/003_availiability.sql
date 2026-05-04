CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_doctor_date
ON availability(doctor_id, date);