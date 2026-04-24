// Government Fraud Detection System - Frontend JavaScript

class FraudDetectionApp {
    constructor() {
        this.apiBase = '/api/v2';
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.setupToasts();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    this.showSection(href.substring(1));
                }
            });
        });

        // Forms
        this.setupForms();
    }

    setupForms() {
        // Death Event Form
        const deathForm = document.getElementById('death-event-form');
        if (deathForm) {
            deathForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitDeathEvent();
            });
        }

        // Biometric Verification Form
        const biometricForm = document.getElementById('biometric-form');
        if (biometricForm) {
            biometricForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitBiometricVerification();
            });
        }

        // eKYC Verification Form
        const ekycForm = document.getElementById('ekyc-form');
        if (ekycForm) {
            ekycForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitEKYCVerification();
            });
        }

        // Search Form
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchBeneficiary();
            });
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('fade-in');
        }

        // Update navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.sidebar .nav-link[onclick="showSection('${sectionId}')"]`)?.classList.add('active');

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    async loadDashboard() {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBase}/dashboard/stats`);
            const stats = await response.json();
            this.renderDashboardStats(stats);
            this.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Error loading dashboard data', 'error');
            this.hideLoading();
        }
    }

    renderDashboardStats(stats) {
        const statsContainer = document.getElementById('stats-cards');
        if (!statsContainer) return;

        const cards = [
            {
                title: 'Total Beneficiaries',
                value: stats.total_beneficiaries || 0,
                icon: 'fas fa-users',
                class: 'info'
            },
            {
                title: 'Active',
                value: stats.active_beneficiaries || 0,
                icon: 'fas fa-check-circle',
                class: 'success'
            },
            {
                title: 'Suspended',
                value: stats.suspended_beneficiaries || 0,
                icon: 'fas fa-pause-circle',
                class: 'warning'
            },
            {
                title: 'High Risk',
                value: stats.high_risk_count || 0,
                icon: 'fas fa-exclamation-triangle',
                class: 'danger'
            }
        ];

        statsContainer.innerHTML = cards.map(card => `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card ${card.class}">
                    <div class="card-body text-center">
                        <i class="${card.icon} fa-2x mb-3"></i>
                        <div class="stats-number">${card.value.toLocaleString()}</div>
                        <div class="stats-label">${card.title}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async submitDeathEvent() {
        try {
            this.showLoading();
            
            const formData = this.getFormData('death-event-form');
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

            const response = await fetch(`${this.apiBase}/ingest_death`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                this.displayDeathEventResult(result);
                this.showToast('Death event submitted successfully', 'success');
                document.getElementById('death-event-form').reset();
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Submission failed');
            }
        } catch (error) {
            console.error('Error submitting death event:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayDeathEventResult(result) {
        const resultContainer = document.getElementById('death-event-result');
        if (!resultContainer) return;

        const riskClass = this.getRiskClass(result.risk_score);
        const statusClass = this.getStatusClass(result.status);

        resultContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Processing Result</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Beneficiary Information</h6>
                            <p><strong>Aadhaar ID:</strong> ${result.aadhaar_id}</p>
                            <p><strong>Status:</strong> <span class="badge ${statusClass}">${result.status}</span></p>
                            <p><strong>Timestamp:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Risk Assessment</h6>
                            <p><strong>Risk Score:</strong> <span class="badge ${riskClass}">${result.risk_score.toFixed(1)}%</span></p>
                            <p><strong>Recommended Action:</strong> ${result.action.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    ${this.getActionInstructions(result.action)}
                </div>
            </div>
        `;
        resultContainer.style.display = 'block';
    }

    getActionInstructions(action) {
        const instructions = {
            'HIGH_RISK_BIOMETRIC_REQUIRED': `
                <div class="alert alert-danger mt-3">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>High Risk Detected</h6>
                    <p>Biometric verification is required. Payments have been suspended pending verification.</p>
                </div>
            `,
            'MEDIUM_RISK_EKYC_REQUIRED': `
                <div class="alert alert-warning mt-3">
                    <h6><i class="fas fa-exclamation-circle me-2"></i>Medium Risk Detected</h6>
                    <p>eKYC verification is required. Payments have been temporarily suspended.</p>
                </div>
            `,
            'LOW_RISK_NO_ACTION': `
                <div class="alert alert-success mt-3">
                    <h6><i class="fas fa-check-circle me-2"></i>Low Risk</h6>
                    <p>No immediate action required. Beneficiary status remains active.</p>
                </div>
            `
        };
        return instructions[action] || '';
    }

    async submitBiometricVerification() {
        try {
            this.showLoading();
            
            const formData = this.getFormData('biometric-form');
            const response = await fetch(`${this.apiBase}/verify_biometric`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    aadhaar_id: formData.bio_aadhaar_id,
                    fingerprint_data: formData.fingerprint_data
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.displayVerificationResult(result, 'biometric');
                this.showToast('Biometric verification completed', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Verification failed');
            }
        } catch (error) {
            console.error('Error in biometric verification:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async submitEKYCVerification() {
        try {
            this.showLoading();
            
            const formData = this.getFormData('ekyc-form');
            const response = await fetch(`${this.apiBase}/verify_ekyc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    aadhaar_id: formData.ekyc_aadhaar_id,
                    otp: formData.otp
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.displayVerificationResult(result, 'ekyc');
                this.showToast('eKYC verification completed', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Verification failed');
            }
        } catch (error) {
            console.error('Error in eKYC verification:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayVerificationResult(result, type) {
        const resultContainer = document.getElementById('verification-results');
        if (!resultContainer) return;

        const isSuccess = result.status.includes('SUCCESS') || result.status.includes('ALIVE');
        const alertClass = isSuccess ? 'alert-success' : 'alert-danger';
        const icon = isSuccess ? 'fas fa-check-circle' : 'fas fa-times-circle';

        resultContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">${type.toUpperCase()} Verification Result</h5>
                </div>
                <div class="card-body">
                    <div class="alert ${alertClass}">
                        <h6><i class="${icon} me-2"></i>${result.status.replace(/_/g, ' ')}</h6>
                        <p><strong>Aadhaar ID:</strong> ${result.aadhaar_id}</p>
                        <p><strong>Verification Attempts:</strong> ${result.verification_attempts}</p>
                    </div>
                </div>
            </div>
        `;
    }

    async searchBeneficiary() {
        try {
            this.showLoading();
            
            const aadhaarId = document.getElementById('search_aadhaar_id').value;
            const response = await fetch(`${this.apiBase}/beneficiary/${aadhaarId}`);

            if (response.ok) {
                const beneficiary = await response.json();
                this.displayBeneficiaryDetails(beneficiary);
            } else if (response.status === 404) {
                this.showToast('Beneficiary not found', 'warning');
                document.getElementById('beneficiary-results').innerHTML = '';
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Search failed');
            }
        } catch (error) {
            console.error('Error searching beneficiary:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayBeneficiaryDetails(beneficiary) {
        const resultsContainer = document.getElementById('beneficiary-results');
        if (!resultsContainer) return;

        const riskClass = this.getRiskClass(beneficiary.risk_score);
        const statusClass = this.getStatusClass(beneficiary.status);

        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Beneficiary Details</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Personal Information</h6>
                            <p><strong>Aadhaar ID:</strong> ${beneficiary.aadhaar_id}</p>
                            <p><strong>Name:</strong> ${beneficiary.name}</p>
                            <p><strong>Date of Birth:</strong> ${beneficiary.dob || 'N/A'}</p>
                            <p><strong>Status:</strong> <span class="badge ${statusClass}">${beneficiary.status}</span></p>
                        </div>
                        <div class="col-md-6">
                            <h6>Risk & Verification</h6>
                            <p><strong>Risk Score:</strong> <span class="badge ${riskClass}">${beneficiary.risk_score.toFixed(1)}%</span></p>
                            <p><strong>Verification Attempts:</strong> ${beneficiary.verification_attempts}</p>
                            <p><strong>Last Verification:</strong> ${beneficiary.last_verification_at ? new Date(beneficiary.last_verification_at).toLocaleString() : 'Never'}</p>
                            <p><strong>Recent Death Events:</strong> ${beneficiary.recent_death_events}</p>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6>Timestamps</h6>
                            <p><strong>Created:</strong> ${new Date(beneficiary.created_at).toLocaleString()}</p>
                            <p><strong>Last Updated:</strong> ${new Date(beneficiary.updated_at).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadReports() {
        this.loadCharts();
    }

    loadCharts() {
        // Risk Score Distribution Chart
        const riskCtx = document.getElementById('riskChart');
        if (riskCtx && !this.charts.risk) {
            this.charts.risk = new Chart(riskCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Low Risk (0-40)', 'Medium Risk (40-85)', 'High Risk (85-100)'],
                    datasets: [{
                        data: [70, 25, 5], // Sample data
                        backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Status Overview Chart
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx && !this.charts.status) {
            this.charts.status = new Chart(statusCtx, {
                type: 'bar',
                data: {
                    labels: ['Active', 'Suspended', 'Pending', 'Deceased'],
                    datasets: [{
                        label: 'Count',
                        data: [1250, 75, 25, 10], // Sample data
                        backgroundColor: ['#198754', '#ffc107', '#0dcaf0', '#6c757d'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    // Utility Functions
    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    getRiskClass(score) {
        if (score >= 85) return 'risk-high';
        if (score >= 40) return 'risk-medium';
        return 'risk-low';
    }

    getStatusClass(status) {
        const statusMap = {
            'ACTIVE': 'status-active',
            'SUSPENDED': 'status-suspended',
            'PENDING_VERIFICATION': 'status-pending',
            'DECEASED': 'status-deceased'
        };
        return statusMap[status] || 'bg-secondary';
    }

    showLoading() {
        document.getElementById('loading-spinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-spinner').style.display = 'none';
    }

    setupToasts() {
        // Initialize toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toastId = 'toast-' + Date.now();
        
        const toastHtml = `
            <div id="${toastId}" class="toast show toast-${type}" role="alert">
                <div class="toast-body">
                    <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close float-end" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global function for navigation (called from HTML)
function showSection(sectionId) {
    if (window.app) {
        window.app.showSection(sectionId);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FraudDetectionApp();
});
