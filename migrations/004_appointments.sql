CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    status VARCHAR(30)
        CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULE_REQUIRED'))
        DEFAULT 'SCHEDULED',

    priority BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (start_time < end_time),

    UNIQUE (doctor_id, appointment_date, start_time)
);


CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
ON appointments(doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_user
ON appointments(user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
ON appointments(status);