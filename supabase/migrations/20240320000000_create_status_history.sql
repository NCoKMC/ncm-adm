-- Create status history table
CREATE TABLE IF NOT EXISTS kmc_status_history (
    id BIGSERIAL PRIMARY KEY,
    kmc_cd VARCHAR(10) NOT NULL,
    seq_no INTEGER NOT NULL,
    prev_status_cd VARCHAR(1) NOT NULL,
    new_status_cd VARCHAR(1) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kmc_cd, seq_no) REFERENCES kmc_info(kmc_cd, seq_no)
);

-- Create index for faster lookups
CREATE INDEX idx_kmc_status_history_kmc_cd_seq_no ON kmc_status_history(kmc_cd, seq_no);

-- Add RLS policies
ALTER TABLE kmc_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON kmc_status_history
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON kmc_status_history
    FOR INSERT
    TO authenticated
    WITH CHECK (true); 