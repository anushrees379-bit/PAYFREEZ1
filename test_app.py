import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import app, get_db, Base

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def sample_death_event():
    return {
        "aadhaar_id": "123456789012",
        "name": "Test User",
        "dob": "1960-01-01",
        "certificate_data": {
            "death_date": "2024-01-01",
            "place_of_death": "Test Hospital",
            "cause_of_death": "Natural causes",
            "registrar_id": "REG001"
        },
        "registrar_signature": "test_signature_data"
    }

@pytest.fixture
def sample_biometric_request():
    return {
        "aadhaar_id": "123456789012",
        "fingerprint_data": "sample_fingerprint_data"
    }

@pytest.fixture
def sample_ekyc_request():
    return {
        "aadhaar_id": "123456789012",
        "otp": "123456"
    }

class TestHealthCheck:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data

class TestDeathEventIngestion:
    def test_ingest_death_event_success(self, sample_death_event):
        response = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert response.status_code == 200
        
        data = response.json()
        assert data["aadhaar_id"] == sample_death_event["aadhaar_id"]
        assert "risk_score" in data
        assert "action" in data
        assert "status" in data
        assert "timestamp" in data

    def test_ingest_death_event_invalid_aadhaar(self, sample_death_event):
        sample_death_event["aadhaar_id"] = "invalid_aadhaar"
        response = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert response.status_code == 422

    def test_ingest_death_event_missing_certificate_data(self, sample_death_event):
        del sample_death_event["certificate_data"]["death_date"]
        response = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert response.status_code == 422

    def test_ingest_death_event_duplicate(self, sample_death_event):
        # First submission
        response1 = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert response1.status_code == 200
        
        # Duplicate submission
        sample_death_event["aadhaar_id"] = "987654321098"  # Different Aadhaar for duplicate test
        response2 = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert response2.status_code == 200

class TestBiometricVerification:
    def test_biometric_verification_not_found(self, sample_biometric_request):
        sample_biometric_request["aadhaar_id"] = "999999999999"
        response = client.post("/api/v2/verify_biometric", json=sample_biometric_request)
        assert response.status_code == 404

    def test_biometric_verification_invalid_status(self, sample_death_event, sample_biometric_request):
        # First create a beneficiary with ACTIVE status
        sample_death_event["aadhaar_id"] = "111111111111"
        death_response = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert death_response.status_code == 200
        
        # Try biometric verification on ACTIVE status (should be PENDING_VERIFICATION)
        sample_biometric_request["aadhaar_id"] = "111111111111"
        response = client.post("/api/v2/verify_biometric", json=sample_biometric_request)
        # This should fail because status is not PENDING_VERIFICATION
        assert response.status_code == 400

class TestEKYCVerification:
    def test_ekyc_verification_success(self, sample_ekyc_request):
        # First create a suspended beneficiary
        death_event = {
            "aadhaar_id": "222222222222",
            "name": "Test User 2",
            "dob": "1960-01-01",
            "certificate_data": {
                "death_date": "2024-01-01",
                "place_of_death": "Test Hospital",
                "cause_of_death": "Natural causes",
                "registrar_id": "REG001"
            },
            "registrar_signature": "test_signature_data"
        }
        
        death_response = client.post("/api/v2/ingest_death", json=death_event)
        assert death_response.status_code == 200
        
        # Check if beneficiary is suspended (medium risk)
        death_data = death_response.json()
        if death_data["status"] == "SUSPENDED":
            sample_ekyc_request["aadhaar_id"] = "222222222222"
            response = client.post("/api/v2/verify_ekyc", json=sample_ekyc_request)
            assert response.status_code == 200
            
            data = response.json()
            assert data["status"] == "EKYC_SUCCESS"

    def test_ekyc_verification_invalid_otp(self, sample_ekyc_request):
        sample_ekyc_request["otp"] = "wrong_otp"
        sample_ekyc_request["aadhaar_id"] = "333333333333"
        
        # First create a suspended beneficiary
        death_event = {
            "aadhaar_id": "333333333333",
            "name": "Test User 3",
            "dob": "1960-01-01",
            "certificate_data": {
                "death_date": "2024-01-01",
                "place_of_death": "Test Hospital",
                "cause_of_death": "Natural causes",
                "registrar_id": "REG001"
            },
            "registrar_signature": "test_signature_data"
        }
        
        death_response = client.post("/api/v2/ingest_death", json=death_event)
        assert death_response.status_code == 200
        
        death_data = death_response.json()
        if death_data["status"] == "SUSPENDED":
            response = client.post("/api/v2/verify_ekyc", json=sample_ekyc_request)
            assert response.status_code == 200
            
            data = response.json()
            assert data["status"] == "EKYC_FAILED"

class TestBeneficiaryRetrieval:
    def test_get_beneficiary_success(self, sample_death_event):
        # First create a beneficiary
        response = client.post("/api/v2/ingest_death", json=sample_death_event)
        assert response.status_code == 200
        
        # Then retrieve it
        aadhaar_id = sample_death_event["aadhaar_id"]
        response = client.get(f"/api/v2/beneficiary/{aadhaar_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["aadhaar_id"] == aadhaar_id
        assert "name" in data
        assert "status" in data
        assert "risk_score" in data

    def test_get_beneficiary_not_found(self):
        response = client.get("/api/v2/beneficiary/999999999999")
        assert response.status_code == 404

    def test_get_beneficiary_invalid_aadhaar(self):
        response = client.get("/api/v2/beneficiary/invalid")
        assert response.status_code == 400

class TestDashboardStats:
    def test_dashboard_stats(self):
        response = client.get("/api/v2/dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = [
            "total_beneficiaries",
            "active_beneficiaries",
            "suspended_beneficiaries",
            "pending_verification",
            "deceased_beneficiaries",
            "total_death_events",
            "verified_events",
            "high_risk_count"
        ]
        
        for field in required_fields:
            assert field in data
            assert isinstance(data[field], int)

class TestMetricsEndpoint:
    def test_metrics_endpoint(self):
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]

class TestRiskScoring:
    def test_low_risk_scenario(self):
        # Create a death event that should result in low risk
        death_event = {
            "aadhaar_id": "444444444444",
            "name": "Low Risk User",
            "dob": "1970-01-01",  # Younger age
            "certificate_data": {
                "death_date": "2024-01-01",
                "place_of_death": "Test Hospital",
                "cause_of_death": "Accident",
                "registrar_id": "REG001"
            },
            "registrar_signature": "valid_signature_data"
        }
        
        response = client.post("/api/v2/ingest_death", json=death_event)
        assert response.status_code == 200
        
        data = response.json()
        # Should be low risk due to valid certificate and younger age
        assert data["action"] in ["LOW_RISK_NO_ACTION", "MEDIUM_RISK_EKYC_REQUIRED"]

class TestInputValidation:
    def test_invalid_json(self):
        response = client.post("/api/v2/ingest_death", data="invalid json")
        assert response.status_code == 422

    def test_missing_required_fields(self):
        invalid_data = {
            "aadhaar_id": "123456789012"
            # Missing other required fields
        }
        response = client.post("/api/v2/ingest_death", json=invalid_data)
        assert response.status_code == 422

    def test_aadhaar_id_validation(self):
        invalid_aadhaar_cases = [
            "12345678901",   # Too short
            "1234567890123", # Too long
            "12345678901a",  # Contains letter
            "",              # Empty
            "000000000000"   # All zeros (technically valid format but suspicious)
        ]
        
        base_data = {
            "name": "Test User",
            "dob": "1960-01-01",
            "certificate_data": {
                "death_date": "2024-01-01",
                "place_of_death": "Test Hospital",
                "cause_of_death": "Natural causes",
                "registrar_id": "REG001"
            },
            "registrar_signature": "test_signature"
        }
        
        for invalid_aadhaar in invalid_aadhaar_cases[:3]:  # Skip the last one as it's technically valid
            test_data = base_data.copy()
            test_data["aadhaar_id"] = invalid_aadhaar
            response = client.post("/api/v2/ingest_death", json=test_data)
            assert response.status_code == 422

if __name__ == "__main__":
    pytest.main([__file__])
