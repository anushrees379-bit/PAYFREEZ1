# Government Fraud Detection System - Project Structure

```
government-fraud-detection/
├── app.py                          # Main FastAPI application
├── requirements.txt                # Python dependencies
├── README.md                       # Comprehensive documentation
├── .env.example                    # Environment configuration template
├── Dockerfile                      # Docker container configuration
├── docker-compose.yml              # Multi-service Docker setup
├── prometheus.yml                  # Monitoring configuration
├── init.sql                        # Database initialization
├── test_app.py                     # Comprehensive test suite
├── start.py                        # Python startup script
├── setup.bat                       # Windows setup script
├── start.bat                       # Windows development startup
├── start-production.bat            # Windows production startup
├── 2.js                           # React frontend components
└── static/                        # Web assets
    ├── index.html                 # Main HTML page
    ├── css/
    │   └── style.css              # Custom styles
    └── js/
        └── app.js                 # JavaScript application
```

## Quick Start Guide

### Windows Users

1. **Setup (One-time)**
   ```cmd
   setup.bat
   ```

2. **Start Development Server**
   ```cmd
   start.bat
   ```

3. **Start Production Server**
   ```cmd
   start-production.bat
   ```

### Linux/Mac Users

1. **Setup**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

2. **Start Development**
   ```bash
   python start.py
   ```

3. **Start Production**
   ```bash
   python start.py --production
   ```

### Docker Deployment

```bash
# Single container
docker build -t fraud-detection .
docker run -p 8000:8000 fraud-detection

# Full stack with monitoring
docker-compose up -d
```

## Application URLs

- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Metrics**: http://localhost:8000/metrics
- **Prometheus** (Docker): http://localhost:9090
- **Grafana** (Docker): http://localhost:3000

## Features Overview

### Web Interface
- **Dashboard**: Real-time statistics and system status
- **Death Event Registration**: User-friendly form for death certificates
- **Identity Verification**: Biometric and eKYC verification interfaces
- **Beneficiary Management**: Search and view beneficiary records
- **Reports & Analytics**: Charts and data visualization

### API Endpoints
- `POST /api/v2/ingest_death` - Process death certificates
- `POST /api/v2/verify_biometric` - Biometric verification
- `POST /api/v2/verify_ekyc` - eKYC verification
- `GET /api/v2/beneficiary/{id}` - Beneficiary lookup
- `GET /api/v2/dashboard/stats` - Dashboard statistics

### Security Features
- Digital signature verification
- Risk scoring algorithm
- Audit logging
- Input validation
- CORS protection

### Monitoring & Metrics
- Prometheus metrics
- Health checks
- Request latency tracking
- Event counters
- Risk score distribution

## Configuration

### Environment Variables

Key configuration options in `.env`:

```
DATABASE_URL=sqlite:///govfraud.db
PFMS_URL=https://sandbox-pfms.gov.in/api/suspend
PFMS_SECRET=your-secret-key
API_SECRET_KEY=your-api-key
RISK_HIGH_THRESHOLD=85
RISK_MEDIUM_THRESHOLD=40
```

### Risk Scoring

The system uses a multi-factor algorithm:
- Certificate authenticity (40%)
- Data linkage strength (25%)
- Life certificate status (20%)
- Transaction activity (10%)
- Additional factors (5%)

### Risk Actions
- **Low Risk (0-39%)**: No action required
- **Medium Risk (40-84%)**: eKYC verification + payment suspension
- **High Risk (85-100%)**: Biometric verification required

## Testing

### Test Data
- **Valid OTP**: `123456`
- **Test Aadhaar**: `123456789012`
- **Failed Biometric**: `deceased_person_fingerprint`

### Run Tests
```bash
pytest test_app.py -v
pytest --cov=app --cov-report=html
```

## Production Deployment

### Requirements
- Python 3.8+
- PostgreSQL (recommended)
- SSL certificates
- Reverse proxy (Nginx)
- Process manager (systemd/supervisor)

### Security Checklist
- [ ] Change default secrets
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Enable audit logging
- [ ] Regular security updates

## Support

### Troubleshooting
1. Check logs for errors
2. Verify database connectivity
3. Test API endpoints at `/docs`
4. Check environment configuration

### Performance Tuning
- Use PostgreSQL for production
- Enable connection pooling
- Configure proper worker count
- Set up caching with Redis
- Monitor metrics regularly

## License

Government software - internal use only.

## Contributing

1. Follow PEP 8 coding standards
2. Add tests for new features
3. Update documentation
4. Submit pull requests for review

---

This is a production-ready fraud detection system with comprehensive web interface, API, monitoring, and security features.
