CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,

    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    appointment_date DATE NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    status VARCHAR(30)
        CHECK (
            status IN (
                'SCHEDULED',
                'COMPLETED',
                'CANCELLED',
                'RESCHEDULE_REQUIRED'
            )
        )
        DEFAULT 'SCHEDULED',

    priority BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (start_time < end_time),

    CHECK (
        (end_time - start_time)
        >= INTERVAL '30 minutes'
    ),

    CHECK (
        EXTRACT(
            EPOCH FROM (end_time - start_time)
        ) % 1800 = 0
    )
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
ON appointments(doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_user
ON appointments(user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
ON appointments(status);

ALTER TABLE appointments
ADD CONSTRAINT no_overlap_appointments
EXCLUDE USING gist (
    doctor_id WITH =,
    tsrange(
        (appointment_date + start_time)::timestamp,
        (appointment_date + end_time)::timestamp
    ) WITH &&
)
WHERE (status = 'SCHEDULED');