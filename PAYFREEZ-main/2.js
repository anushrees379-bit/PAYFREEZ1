// React Frontend for Government Fraud Detection System
// This file serves as a more advanced React-based frontend

const { useState, useEffect, useCallback } = React;

// Main App Component
function App() {
    const [currentSection, setCurrentSection] = useState('dashboard');
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const apiBase = '/api/v2';

    // Load dashboard data
    const loadDashboardStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBase}/dashboard/stats`);
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            addNotification('Error loading dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardStats();
    }, [loadDashboardStats]);

    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const renderSection = () => {
        switch (currentSection) {
            case 'dashboard':
                return <Dashboard stats={stats} onRefresh={loadDashboardStats} />;
            case 'death-events':
                return <DeathEventForm onSubmit={addNotification} />;
            case 'verification':
                return <VerificationPanel onSubmit={addNotification} />;
            case 'beneficiaries':
                return <BeneficiarySearch onSubmit={addNotification} />;
            default:
                return <Dashboard stats={stats} onRefresh={loadDashboardStats} />;
        }
    };

    return (
        <div className="container-fluid">
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
                <div className="container">
                    <a className="navbar-brand" href="#">
                        <i className="fas fa-shield-alt me-2"></i>
                        Government Fraud Detection System
                    </a>
                </div>
            </nav>

            <div className="row">
                <div className="col-md-3 col-lg-2">
                    <Sidebar currentSection={currentSection} onSectionChange={setCurrentSection} />
                </div>
                <div className="col-md-9 col-lg-10">
                    {loading && <LoadingSpinner />}
                    {renderSection()}
                </div>
            </div>

            <NotificationContainer notifications={notifications} />
        </div>
    );
}

// Sidebar Component
function Sidebar({ currentSection, onSectionChange }) {
    const menuItems = [
        { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { id: 'death-events', icon: 'fas fa-file-medical-alt', label: 'Death Events' },
        { id: 'verification', icon: 'fas fa-user-check', label: 'Verification' },
        { id: 'beneficiaries', icon: 'fas fa-users', label: 'Beneficiaries' },
    ];

    return (
        <div className="sidebar bg-white rounded p-3 shadow-sm">
            <ul className="nav nav-pills flex-column">
                {menuItems.map(item => (
                    <li key={item.id} className="nav-item">
                        <a
                            className={`nav-link ${currentSection === item.id ? 'active' : ''}`}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onSectionChange(item.id);
                            }}
                        >
                            <i className={`${item.icon} me-2`}></i>
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Dashboard Component
function Dashboard({ stats, onRefresh }) {
    const statsCards = [
        { 
            title: 'Total Beneficiaries', 
            value: stats.total_beneficiaries || 0, 
            icon: 'fas fa-users', 
            color: 'primary' 
        },
        { 
            title: 'Active', 
            value: stats.active_beneficiaries || 0, 
            icon: 'fas fa-check-circle', 
            color: 'success' 
        },
        { 
            title: 'Suspended', 
            value: stats.suspended_beneficiaries || 0, 
            icon: 'fas fa-pause-circle', 
            color: 'warning' 
        },
        { 
            title: 'High Risk', 
            value: stats.high_risk_count || 0, 
            icon: 'fas fa-exclamation-triangle', 
            color: 'danger' 
        },
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Dashboard</h2>
                <button className="btn btn-primary" onClick={onRefresh}>
                    <i className="fas fa-sync-alt me-2"></i>Refresh
                </button>
            </div>

            <div className="row mb-4">
                {statsCards.map((card, index) => (
                    <div key={index} className="col-lg-3 col-md-6 mb-3">
                        <div className={`card border-${card.color}`}>
                            <div className="card-body text-center">
                                <i className={`${card.icon} fa-2x text-${card.color} mb-3`}></i>
                                <h3 className="card-title">{card.value.toLocaleString()}</h3>
                                <p className="card-text text-muted">{card.title}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>System Status</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="d-flex align-items-center">
                                        <span className="badge bg-success rounded-pill me-2"></span>
                                        API Service: Online
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex align-items-center">
                                        <span className="badge bg-success rounded-pill me-2"></span>
                                        Database: Connected
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex align-items-center">
                                        <span className="badge bg-warning rounded-pill me-2"></span>
                                        PFMS: Sandbox Mode
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Death Event Form Component
function DeathEventForm({ onSubmit }) {
    const [formData, setFormData] = useState({
        aadhaar_id: '',
        name: '',
        dob: '',
        death_date: '',
        place_of_death: '',
        cause_of_death: '',
        registrar_id: '',
        registrar_signature: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                aadhaar_id: formData.aadhaar_id,
                name: formData.name,
                dob: formData.dob,
                certificate_data: {
                    death_date: formData.death_date,
                    place_of_death: formData.place_of_death,
                    cause_of_death: formData.cause_of_death,
                    registrar_id: formData.registrar_id
                },
                registrar_signature: formData.registrar_signature
            };

            const response = await fetch('/api/v2/ingest_death', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                onSubmit('Death event submitted successfully', 'success');
                // Reset form
                setFormData({
                    aadhaar_id: '',
                    name: '',
                    dob: '',
                    death_date: '',
                    place_of_death: '',
                    cause_of_death: '',
                    registrar_id: '',
                    registrar_signature: ''
                });
            } else {
                const error = await response.json();
                onSubmit(`Error: ${error.detail}`, 'error');
            }
        } catch (error) {
            onSubmit(`Error: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const getRiskBadgeClass = (score) => {
        if (score >= 85) return 'bg-danger';
        if (score >= 40) return 'bg-warning text-dark';
        return 'bg-success';
    };

    return (
        <div>
            <h2 className="mb-4">Death Event Registration</h2>

            <div className="card">
                <div className="card-header">
                    <h5>Register New Death Event</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Aadhaar ID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="aadhaar_id"
                                        value={formData.aadhaar_id}
                                        onChange={handleChange}
                                        pattern="[0-9]{12}"
                                        maxLength="12"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Date of Death</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="death_date"
                                        value={formData.death_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Place of Death</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="place_of_death"
                                        value={formData.place_of_death}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Registrar ID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="registrar_id"
                                        value={formData.registrar_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Cause of Death</label>
                            <textarea
                                className="form-control"
                                name="cause_of_death"
                                value={formData.cause_of_death}
                                onChange={handleChange}
                                rows="3"
                                required
                            ></textarea>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Digital Signature</label>
                            <textarea
                                className="form-control"
                                name="registrar_signature"
                                value={formData.registrar_signature}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Digital signature from registrar"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane me-2"></i>
                                    Submit Death Event
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {result && (
                <div className="card mt-4">
                    <div className="card-header">
                        <h5>Processing Result</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <p><strong>Aadhaar ID:</strong> {result.aadhaar_id}</p>
                                <p><strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(result.status)}`}>{result.status}</span></p>
                                <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="col-md-6">
                                <p><strong>Risk Score:</strong> <span className={`badge ${getRiskBadgeClass(result.risk_score)}`}>{result.risk_score.toFixed(1)}%</span></p>
                                <p><strong>Action:</strong> {result.action.replace(/_/g, ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Verification Panel Component
function VerificationPanel({ onSubmit }) {
    return (
        <div>
            <h2 className="mb-4">Identity Verification</h2>
            <div className="row">
                <div className="col-lg-6">
                    <BiometricVerification onSubmit={onSubmit} />
                </div>
                <div className="col-lg-6">
                    <EKYCVerification onSubmit={onSubmit} />
                </div>
            </div>
        </div>
    );
}

// Biometric Verification Component
function BiometricVerification({ onSubmit }) {
    const [formData, setFormData] = useState({ aadhaar_id: '', fingerprint_data: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/v2/verify_biometric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                onSubmit(`Biometric verification: ${data.status}`, data.status.includes('SUCCESS') ? 'success' : 'warning');
            } else {
                const error = await response.json();
                onSubmit(`Error: ${error.detail}`, 'error');
            }
        } catch (error) {
            onSubmit(`Error: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h5>Biometric Verification</h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Aadhaar ID</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.aadhaar_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, aadhaar_id: e.target.value }))}
                            pattern="[0-9]{12}"
                            maxLength="12"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Fingerprint Data</label>
                        <textarea
                            className="form-control"
                            value={formData.fingerprint_data}
                            onChange={(e) => setFormData(prev => ({ ...prev, fingerprint_data: e.target.value }))}
                            rows="4"
                            placeholder="Base64 encoded fingerprint data"
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-success" disabled={submitting}>
                        <i className="fas fa-fingerprint me-2"></i>
                        {submitting ? 'Verifying...' : 'Verify Biometric'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// eKYC Verification Component
function EKYCVerification({ onSubmit }) {
    const [formData, setFormData] = useState({ aadhaar_id: '', otp: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/v2/verify_ekyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                onSubmit(`eKYC verification: ${data.status}`, data.status.includes('SUCCESS') ? 'success' : 'warning');
            } else {
                const error = await response.json();
                onSubmit(`Error: ${error.detail}`, 'error');
            }
        } catch (error) {
            onSubmit(`Error: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h5>eKYC Verification</h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Aadhaar ID</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.aadhaar_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, aadhaar_id: e.target.value }))}
                            pattern="[0-9]{12}"
                            maxLength="12"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">OTP</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.otp}
                            onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                            pattern="[0-9]{6}"
                            maxLength="6"
                            placeholder="6-digit OTP"
                            required
                        />
                        <div className="form-text">For testing, use: 123456</div>
                    </div>
                    <button type="submit" className="btn btn-info" disabled={submitting}>
                        <i className="fas fa-mobile-alt me-2"></i>
                        {submitting ? 'Verifying...' : 'Verify eKYC'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Beneficiary Search Component
function BeneficiarySearch({ onSubmit }) {
    const [aadhaarId, setAadhaarId] = useState('');
    const [beneficiary, setBeneficiary] = useState(null);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);

        try {
            const response = await fetch(`/api/v2/beneficiary/${aadhaarId}`);
            
            if (response.ok) {
                const data = await response.json();
                setBeneficiary(data);
                onSubmit('Beneficiary found', 'success');
            } else if (response.status === 404) {
                setBeneficiary(null);
                onSubmit('Beneficiary not found', 'warning');
            } else {
                const error = await response.json();
                onSubmit(`Error: ${error.detail}`, 'error');
            }
        } catch (error) {
            onSubmit(`Error: ${error.message}`, 'error');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div>
            <h2 className="mb-4">Beneficiary Search</h2>
            
            <div className="card">
                <div className="card-header">
                    <h5>Search Beneficiary</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="row">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={aadhaarId}
                                    onChange={(e) => setAadhaarId(e.target.value)}
                                    placeholder="Enter Aadhaar ID"
                                    pattern="[0-9]{12}"
                                    maxLength="12"
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <button type="submit" className="btn btn-primary" disabled={searching}>
                                    <i className="fas fa-search me-2"></i>
                                    {searching ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {beneficiary && (
                        <div className="card">
                            <div className="card-header">
                                <h5>Beneficiary Details</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Aadhaar ID:</strong> {beneficiary.aadhaar_id}</p>
                                        <p><strong>Name:</strong> {beneficiary.name}</p>
                                        <p><strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(beneficiary.status)}`}>{beneficiary.status}</span></p>
                                        <p><strong>Risk Score:</strong> <span className={`badge ${getRiskBadgeClass(beneficiary.risk_score)}`}>{beneficiary.risk_score.toFixed(1)}%</span></p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Verification Attempts:</strong> {beneficiary.verification_attempts}</p>
                                        <p><strong>Last Verification:</strong> {beneficiary.last_verification_at ? new Date(beneficiary.last_verification_at).toLocaleString() : 'Never'}</p>
                                        <p><strong>Created:</strong> {new Date(beneficiary.created_at).toLocaleString()}</p>
                                        <p><strong>Updated:</strong> {new Date(beneficiary.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Utility Components
function LoadingSpinner() {
    return (
        <div className="d-flex justify-content-center p-4">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
}

function NotificationContainer({ notifications }) {
    return (
        <div className="toast-container position-fixed bottom-0 end-0 p-3">
            {notifications.map(notification => (
                <div key={notification.id} className={`toast show bg-${notification.type === 'error' ? 'danger' : notification.type} text-white`}>
                    <div className="toast-body">
                        {notification.message}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Utility Functions
function getStatusBadgeClass(status) {
    const statusMap = {
        'ACTIVE': 'bg-success',
        'SUSPENDED': 'bg-warning text-dark',
        'PENDING_VERIFICATION': 'bg-info text-dark',
        'DECEASED': 'bg-secondary'
    };
    return statusMap[status] || 'bg-secondary';
}

function getRiskBadgeClass(score) {
    if (score >= 85) return 'bg-danger';
    if (score >= 40) return 'bg-warning text-dark';
    return 'bg-success';
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));