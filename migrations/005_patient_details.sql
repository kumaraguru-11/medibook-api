CREATE TABLE IF NOT EXISTS patient_details (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,

    name VARCHAR(100),
    age INT,
    gender VARCHAR(10),
    symptoms TEXT,
    medical_history TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_appointment
ON patient_details(appointment_id);