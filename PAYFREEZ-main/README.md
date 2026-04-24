# Government Fraud Detection System

A comprehensive web application for detecting and preventing fraud in government benefit programs through automated death certificate verification and risk scoring.

## Features

### Core Functionality
- **Death Certificate Processing**: Automated ingestion and verification of death certificates
- **Risk Scoring**: Advanced multi-factor risk assessment algorithm
- **Identity Verification**: Biometric and eKYC verification capabilities
- **Payment Management**: Automated payment suspension via PFMS integration
- **Real-time Monitoring**: Dashboard with live statistics and alerts

### Security Features
- **Digital Signature Verification**: PKI-based certificate validation
- **Multi-factor Authentication**: Biometric and OTP-based verification
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: Protection against abuse
- **CORS Protection**: Secure cross-origin requests

### Web Interface
- **Responsive Dashboard**: Real-time statistics and monitoring
- **Death Event Registration**: User-friendly form for registering death events
- **Verification Portal**: Interface for biometric and eKYC verification
- **Beneficiary Management**: Search and manage beneficiary records
- **Reports & Analytics**: Charts and export capabilities

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Prometheus**: Metrics and monitoring
- **HTTPx**: Async HTTP client for external APIs
- **Pydantic**: Data validation and serialization

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Bootstrap 5**: Responsive UI framework
- **Chart.js**: Interactive charts and graphs
- **Vanilla JavaScript**: No framework dependencies

### Database
- **SQLite**: Default (development)
- **PostgreSQL**: Recommended for production
- **MySQL**: Alternative option

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git (for version control)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd government-fraud-detection
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Environment Configuration
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file with your configuration
# Update database URL, API keys, and other settings
```

### Step 5: Database Setup
```bash
# The application will automatically create the database tables on first run
python app.py
```

### Step 6: Run the Application
```bash
# Development mode
python app.py

# Production mode with Gunicorn
gunicorn app:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Step 7: Access the Application
- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Metrics**: http://localhost:8000/metrics

## API Endpoints

### Death Event Management
- `POST /api/v2/ingest_death` - Submit death certificate
- `GET /api/v2/beneficiary/{aadhaar_id}` - Get beneficiary details

### Verification Services
- `POST /api/v2/verify_biometric` - Biometric verification
- `POST /api/v2/verify_ekyc` - eKYC verification

### Monitoring & Analytics
- `GET /api/v2/dashboard/stats` - Dashboard statistics
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///govfraud.db` |
| `PFMS_URL` | PFMS API endpoint | `https://sandbox-pfms.gov.in/api/suspend` |
| `PFMS_SECRET` | PFMS API secret key | `super-secret-key` |
| `API_SECRET_KEY` | API authentication key | `your-api-secret-key` |
| `RISK_HIGH_THRESHOLD` | High risk threshold (%) | `85` |
| `RISK_MEDIUM_THRESHOLD` | Medium risk threshold (%) | `40` |

### Risk Scoring Algorithm

The system uses a multi-factor risk scoring algorithm:

1. **Certificate Authenticity (40% weight)**
   - Digital signature verification
   - PKI validation

2. **Data Linkage Strength (25% weight)**
   - Cross-system data consistency
   - Identity verification strength

3. **Life Certificate Status (20% weight)**
   - Recent life certificate submission
   - Historical pattern analysis

4. **Transaction Activity (10% weight)**
   - Recent payment transactions
   - Activity patterns

5. **Additional Factors (5% weight)**
   - Age-based risk factors
   - Duplicate death reports

### Risk Thresholds
- **Low Risk (0-39%)**: No action required
- **Medium Risk (40-84%)**: eKYC verification required
- **High Risk (85-100%)**: Biometric verification required

## Security Considerations

### Production Deployment
1. **Change Default Secrets**: Update all default API keys and secrets
2. **Use HTTPS**: Enable SSL/TLS encryption
3. **Database Security**: Use encrypted connections and strong passwords
4. **Firewall Configuration**: Restrict access to necessary ports only
5. **Regular Updates**: Keep dependencies updated
6. **Monitoring**: Enable comprehensive logging and monitoring

### Data Protection
- **Encryption**: Sensitive data encrypted at rest and in transit
- **Audit Logging**: All operations logged for compliance
- **Access Control**: Role-based access control implementation
- **Data Retention**: Configurable data retention policies

## Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

### Test Data
Use the following test data for verification:

- **Valid OTP**: `123456`
- **Test Aadhaar ID**: `123456789012`
- **Failed Biometric**: Use fingerprint data `deceased_person_fingerprint`

## Monitoring & Maintenance

### Metrics
The application exposes Prometheus metrics at `/metrics`:
- Request latency
- Death event processing counters
- Payment suspension counters
- Verification attempt counters
- Risk score distribution

### Health Checks
- **Basic Health**: `GET /health`
- **Database Connectivity**: Included in health check
- **External Dependencies**: Monitor PFMS and UIDAI connectivity

### Logging
Logs are structured and include:
- Request/response logging
- Error tracking
- Security events
- Performance metrics

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env file
   - Ensure database server is running
   - Verify credentials and permissions

2. **PFMS API Errors**
   - Check PFMS_URL and PFMS_SECRET
   - Verify network connectivity
   - Check API rate limits

3. **Certificate Verification Failed**
   - Check CA_CERT_PATH configuration
   - Ensure OpenSSL is installed
   - Verify certificate format

### Support
For technical support or questions:
- Check the API documentation at `/docs`
- Review application logs
- Contact the development team

## License

This software is developed for government use and is subject to applicable government software licensing terms.

## Contributing

Please follow the established coding standards and submit pull requests for review.

## Changelog

### Version 2.0.0
- Complete web interface implementation
- Enhanced risk scoring algorithm
- Improved security features
- Production-ready deployment
- Comprehensive monitoring and metrics
