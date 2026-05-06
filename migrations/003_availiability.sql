CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,

    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- status TEXT CHECK (status IN ('AVAILABLE','BLOCKED','CANCELLED')) NOT NULL DEFAULT 'AVAILABLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (start_time < end_time)
);

-- Prevent overlapping availability slots for the same doctor
ALTER TABLE availability
ADD CONSTRAINT no_overlap_availability
EXCLUDE USING gist (
    doctor_id WITH =,
    tsrange(
        (date + start_time)::timestamp,
        (date + end_time)::timestamp
    ) WITH &&
)
-- WHERE (status = 'AVAILABLE');

-- Index for faster lookups by doctor and date
CREATE INDEX IF NOT EXISTS idx_availability_doctor_date
ON availability (doctor_id, date);

-- Minimum 30 minutes
ALTER TABLE availability
ADD CONSTRAINT min_slot_duration
CHECK (
  (end_time - start_time) >= INTERVAL '30 minutes'
);

-- Must be multiple of 30 minutes
ALTER TABLE availability
ADD CONSTRAINT slot_multiple_30min
CHECK (
  EXTRACT(EPOCH FROM (end_time - start_time)) % 1800 = 0
);