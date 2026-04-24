-- Initialize Government Fraud Detection Database
-- This script creates the initial database structure and sample data

-- Create database (PostgreSQL)
-- CREATE DATABASE govfraud;

-- Connect to the database
-- \c govfraud;

-- Sample beneficiaries for testing
INSERT INTO beneficiaries (aadhaar_id, name, dob, status, risk_score, created_at, updated_at, verification_attempts) VALUES
('123456789012', 'John Doe', '1960-01-15', 'ACTIVE', 15.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
('234567890123', 'Jane Smith', '1955-06-22', 'ACTIVE', 8.2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
('345678901234', 'Robert Johnson', '1948-12-03', 'SUSPENDED', 65.8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2),
('456789012345', 'Mary Williams', '1965-09-18', 'PENDING_VERIFICATION', 87.3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
('567890123456', 'David Brown', '1950-03-27', 'DECEASED', 95.1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3)
ON CONFLICT (aadhaar_id) DO NOTHING;

-- Sample death events for testing
INSERT INTO death_events (aadhaar_id, certificate_data, registrar_signature, is_verified, verification_method, received_at, processed_at) VALUES
('567890123456', '{"death_date": "2024-01-15", "place_of_death": "City Hospital", "cause_of_death": "Natural causes", "registrar_id": "REG001"}', 'SAMPLE_SIGNATURE_DATA', true, 'PKI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('456789012345', '{"death_date": "2024-02-10", "place_of_death": "Home", "cause_of_death": "Heart failure", "registrar_id": "REG002"}', 'SAMPLE_SIGNATURE_DATA', false, 'UNVERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample audit logs
INSERT INTO audit_logs (aadhaar_id, event_type, details, created_at) VALUES
('567890123456', 'DEATH_EVENT_INGESTED', '{"risk_score": 95.1, "action": "HIGH_RISK_BIOMETRIC_REQUIRED", "certificate_authentic": true}', CURRENT_TIMESTAMP),
('456789012345', 'DEATH_EVENT_INGESTED', '{"risk_score": 87.3, "action": "HIGH_RISK_BIOMETRIC_REQUIRED", "certificate_authentic": false}', CURRENT_TIMESTAMP),
('345678901234', 'EKYC_VERIFICATION', 'FAILED - Attempt 2', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beneficiary_status ON beneficiaries(status);
CREATE INDEX IF NOT EXISTS idx_beneficiary_risk ON beneficiaries(risk_score);
CREATE INDEX IF NOT EXISTS idx_death_event_aadhaar ON death_events(aadhaar_id);
CREATE INDEX IF NOT EXISTS idx_death_event_received ON death_events(received_at);
CREATE INDEX IF NOT EXISTS idx_audit_type_date ON audit_logs(event_type, created_at);

-- Views for reporting
CREATE OR REPLACE VIEW beneficiary_summary AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(risk_score) as avg_risk_score,
    MAX(risk_score) as max_risk_score,
    MIN(risk_score) as min_risk_score
FROM beneficiaries 
GROUP BY status;

CREATE OR REPLACE VIEW daily_death_events AS
SELECT 
    DATE(received_at) as event_date,
    COUNT(*) as total_events,
    SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_events,
    SUM(CASE WHEN is_verified = false THEN 1 ELSE 0 END) as unverified_events
FROM death_events 
GROUP BY DATE(received_at)
ORDER BY event_date DESC;

CREATE OR REPLACE VIEW high_risk_beneficiaries AS
SELECT 
    aadhaar_id,
    name,
    risk_score,
    status,
    verification_attempts,
    last_verification_at,
    updated_at
FROM beneficiaries 
WHERE risk_score >= 85
ORDER BY risk_score DESC;
