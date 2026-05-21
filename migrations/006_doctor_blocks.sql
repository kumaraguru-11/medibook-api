CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS doctor_blocks (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (start_time < end_time),

    CHECK (
       (end_time - start_time) >= INTERVAL '30 minutes'
     ),

    CHECK (
    EXTRACT(EPOCH FROM (end_time - start_time)) % 1800 = 0
    )
);

CREATE INDEX IF NOT EXISTS idx_blocks_doctor_date
ON doctor_blocks(doctor_id, date);

ALTER TABLE doctor_blocks
ADD CONSTRAINT unique_doctor_block
UNIQUE (
  doctor_id,
  date,
  start_time,
  end_time
);

ALTER TABLE doctor_blocks
ADD CONSTRAINT no_overlap_doctor_blocks
EXCLUDE USING GIST(
    doctor_Id with =,
    tsrange(
        (date+start_time)::timestamp,
        (date+end_time)::timestamp
    ) WITH &&
);

