// ===== DEPARTMENT MANAGEMENT PREMIUM JAVASCRIPT =====
// Advanced Interactive Functionality with Modern ES6+

class PremiumDepartmentManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.totalPages = 0;
        this.departments = [];
        this.filters = {
            search: '',
            status: '',
            sortBy: 'name',
            sortOrder: 'asc',
            minEmployees: '',
            maxEmployees: '',
            tags: []
        };
        this.viewMode = 'table';
        this.isLoading = false;
        
        // Bind methods to ensure proper 'this' context
        this.renderPagination = this.renderPagination.bind(this);
        this.loadDepartments = this.loadDepartments.bind(this);
        this.goToPage = this.goToPage.bind(this);
        
        this.init();
    }

    // ===== PAGINATION =====
    renderPagination() {
        const pagination = document.getElementById('pagination');
        const showingStart = document.getElementById('showingStart');
        const showingEnd = document.getElementById('showingEnd');
        const totalItems = document.getElementById('totalItems');

        if (!pagination) {
            console.warn('Pagination element not found');
            return;
        }

        const start = (this.currentPage - 1) * this.limit + 1;
        const end = Math.min(this.currentPage * this.limit, this.totalPages * this.limit);

        if (showingStart) showingStart.textContent = start;
        if (showingEnd) showingEnd.textContent = end;
        if (totalItems) totalItems.textContent = this.totalPages * this.limit;

        let html = '';

        // Previous button
        if (this.currentPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="premiumManager.goToPage(${this.currentPage - 1}); return false;">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
            `;
        }

        // Page numbers
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="premiumManager.goToPage(${i}); return false;">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="premiumManager.goToPage(${this.currentPage + 1}); return false;">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            `;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadDepartments();
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== INITIALIZATION =====
    async init() {
        try {
            await this.loadDepartments();
            this.setupEventListeners();
            this.setupRealTimeUpdates();
            this.setupKeyboardShortcuts();
            this.initializeAnimations();
            
            console.log('🚀 Premium Department Manager Initialized');
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Real-time search with advanced debouncing
        this.setupSearch();
        
        // Filter changes
        this.setupFilters();
        
        // View mode toggles
        this.setupViewToggles();
        
        // Form submissions
        this.setupForms();
        
        // Modal interactions
        this.setupModals();
        
        // Export functionality
        this.setupExports();
    }

    setupSearch() {
        let searchTimeout;
        const searchInput = document.getElementById('globalSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadDepartments();
                }, 300);
            });
            
            // Clear search button
            this.addClearSearchButton(searchInput);
        }
    }

    addClearSearchButton(searchInput) {
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.className = 'btn btn-sm btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-3';
        clearBtn.style.display = 'none';
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.filters.search = '';
            this.currentPage = 1;
            this.loadDepartments();
            clearBtn.style.display = 'none';
        });
        
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(clearBtn);
        
        searchInput.addEventListener('input', (e) => {
            clearBtn.style.display = e.target.value ? 'block' : 'none';
        });
    }

    setupFilters() {
        const filterElements = ['statusFilter', 'sortBy', 'minEmployees', 'maxEmployees'];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.loadDepartments();
                });
            }
        });

        // Advanced tag filtering
        this.setupTagFiltering();
    }

    setupTagFiltering() {
        const tagContainer = document.getElementById('tagFilter');
        if (!tagContainer) return;

        // Implementation for tag-based filtering
        console.log('Tag filtering setup complete');
    }

    setupViewToggles() {
        const viewToggleButtons = document.querySelectorAll('[data-view-mode]');
        viewToggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const viewMode = e.target.dataset.viewMode;
                this.setViewMode(viewMode);
            });
        });
    }

    setupForms() {
        const createForm = document.getElementById('createDepartmentForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createDepartment();
            });
        }

        // Bulk operations form
        this.setupBulkOperations();
    }

    setupBulkOperations() {
        const bulkActions = document.getElementById('bulkActions');
        if (bulkActions) {
            // Implementation for bulk operations
        }
    }

    setupModals() {
        // Enhanced modal interactions
        const modals = document.querySelectorAll('.modal-premium');
        modals.forEach(modal => {
            modal.addEventListener('shown.bs.modal', () => {
                this.animateModalEntrance(modal);
            });
        });
    }

    animateModalEntrance(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.8)';
            modalContent.style.opacity = '0';
            
            setTimeout(() => {
                modalContent.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }, 50);
        }
    }

    setupExports() {
        const exportButtons = document.querySelectorAll('[data-export-format]');
        exportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const format = e.target.dataset.exportFormat;
                this.exportData(format);
            });
        });
    }

    // ===== DATA MANAGEMENT =====
    async loadDepartments() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit,
                ...this.filters
            });

            const response = await fetch(`/api/admin/departments?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.departments = result.data;
                this.totalPages = result.pagination.pages;
                
                this.renderDepartments();
                this.renderPagination(); // This should work now
                this.updateStats(result.statistics);
                this.updateFilters(result.filters);
                
                this.showSuccess('Departments loaded successfully');
            } else {
                throw new Error(result.message || 'Failed to load departments');
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Network error: Unable to connect to server';
        } else if (error.message.includes('HTTP error')) {
            return 'Server error: Please try again later';
        } else {
            return error.message || 'An unexpected error occurred';
        }
    }

    // ===== RENDERING =====
    renderDepartments() {
        const tableView = document.getElementById('departmentsTable');
        const gridView = document.getElementById('departmentsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.departments.length === 0) {
            this.showEmptyState();
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        if (this.viewMode === 'table') {
            this.renderTableView(tableView);
        } else {
            this.renderGridView(gridView);
        }

        this.initializeInteractiveElements();
    }

    renderTableView(container) {
        if (!container) return;
        
        container.innerHTML = this.departments.map(dept => `
            <tr class="department-row animate-in" data-dept-id="${dept._id}">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="dept-color-indicator" style="background-color: ${dept.settings?.color || '#3B82F6'}"></div>
                        <div>
                            <h6 class="mb-1 fw-semibold">${this.escapeHtml(dept.name)}</h6>
                            <small class="text-muted">${this.escapeHtml(dept.code)}</small>
                            ${dept.description ? `<small class="text-muted d-block mt-1">${this.truncateText(dept.description, 60)}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    ${dept.manager ? `
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <div>
                                <div class="fw-semibold">${dept.manager.firstName} ${dept.manager.lastName}</div>
                                <small class="text-muted">${dept.manager.email}</small>
                            </div>
                        </div>
                    ` : '<span class="text-muted">Not assigned</span>'}
                </td>
                <td class="text-center">
                    <div class="fw-bold text-dark fs-5">${dept.metrics?.employeeCount || 0}</div>
                    <small class="text-muted">employees</small>
                </td>
                <td>
                    <div class="fw-semibold">
                        $${(dept.budget?.utilized || 0).toLocaleString()} / $${(dept.budget?.allocated || 0).toLocaleString()}
                    </div>
                    <div class="progress-3d mt-2">
                        <div class="progress-bar" 
                             style="width: ${Math.min(dept.budget?.utilizationPercentage || 0, 100)}%; 
                                    background: ${this.getUtilizationColor(dept.budget?.utilizationPercentage)}">
                        </div>
                    </div>
                    <small class="text-muted">${dept.budget?.utilizationPercentage || 0}% utilized</small>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="performance-circle me-3" 
                             data-score="${dept.metrics?.performanceScore || 0}">
                        </div>
                        <i class="fas fa-${this.getPerformanceIcon(dept.metrics?.performanceScore)} ${this.getPerformanceColor(dept.metrics?.performanceScore)}"></i>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${dept.status}">${dept.status}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="premiumManager.viewDepartment('${dept._id}')" 
                                title="View Details" data-bs-toggle="tooltip">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="premiumManager.editDepartment('${dept._id}')" 
                                title="Edit Department" data-bs-toggle="tooltip">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="premiumManager.showAnalytics('${dept._id}')" 
                                title="View Analytics" data-bs-toggle="tooltip">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="premiumManager.quickActions('${dept._id}')" 
                                title="Quick Actions" data-bs-toggle="tooltip">
                            <i class="fas fa-bolt"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="premiumManager.deleteDepartment('${dept._id}')" 
                                title="Archive Department" data-bs-toggle="tooltip">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderGridView(container) {
        if (!container) return;
        
        container.innerHTML = this.departments.map(dept => `
            <div class="col-xl-4 col-lg-6 mb-4">
                <div class="department-card" data-dept-id="${dept._id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="d-flex align-items-center">
                                <div class="dept-color-indicator-lg me-3" 
                                     style="background-color: ${dept.settings?.color || '#3B82F6'}"></div>
                                <div>
                                    <h5 class="card-title mb-1">${this.escapeHtml(dept.name)}</h5>
                                    <span class="gradient-badge">${this.escapeHtml(dept.code)}</span>
                                </div>
                            </div>
                            <span class="status-badge status-${dept.status}">${dept.status}</span>
                        </div>
                        
                        <p class="card-text text-muted mb-3">${dept.description || 'No description provided'}</p>
                        
                        <div class="department-metrics mb-3">
                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="metric-value">${dept.metrics?.employeeCount || 0}</div>
                                    <small class="text-muted">Employees</small>
                                </div>
                                <div class="col-4">
                                    <div class="metric-value ${this.getPerformanceColor(dept.metrics?.performanceScore)}">
                                        ${dept.metrics?.performanceScore || 0}%
                                    </div>
                                    <small class="text-muted">Performance</small>
                                </div>
                                <div class="col-4">
                                    <div class="metric-value">${dept.budget?.utilizationPercentage || 0}%</div>
                                    <small class="text-muted">Budget Used</small>
                                </div>
                            </div>
                        </div>

                        <div class="department-progress mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small class="text-muted">Budget Utilization</small>
                                <small class="text-muted">${dept.budget?.utilizationPercentage || 0}%</small>
                            </div>
                            <div class="progress-3d">
                                <div class="progress-bar" 
                                     style="width: ${Math.min(dept.budget?.utilizationPercentage || 0, 100)}%;
                                            background: ${this.getUtilizationColor(dept.budget?.utilizationPercentage)}">
                                </div>
                            </div>
                        </div>

                        <div class="department-actions">
                            <div class="btn-group w-100">
                                <button class="btn btn-outline-primary btn-sm" onclick="premiumManager.viewDepartment('${dept._id}')">
                                    <i class="fas fa-eye me-1"></i>View
                                </button>
                                <button class="btn btn-outline-success btn-sm" onclick="premiumManager.editDepartment('${dept._id}')">
                                    <i class="fas fa-edit me-1"></i>Edit
                                </button>
                                <button class="btn btn-outline-info btn-sm" onclick="premiumManager.showAnalytics('${dept._id}')">
                                    <i class="fas fa-chart-bar me-1"></i>Stats
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ===== UTILITY METHODS =====
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getUtilizationColor(percentage) {
        if (percentage < 50) return 'linear-gradient(90deg, #10b981, #34d399)';
        if (percentage < 80) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        return 'linear-gradient(90deg, #ef4444, #f87171)';
    }

    getPerformanceColor(score) {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-warning';
        return 'text-danger';
    }

    getPerformanceIcon(score) {
        if (score >= 80) return 'trophy';
        if (score >= 60) return 'chart-line';
        return 'exclamation-triangle';
    }

    // ===== INTERACTIVE FEATURES =====
    initializeInteractiveElements() {
        this.initializePerformanceCircles();
        this.initializeTooltips();
        this.initializeRowAnimations();
    }

    initializePerformanceCircles() {
        document.querySelectorAll('.performance-circle').forEach(circle => {
            const score = parseInt(circle.dataset.score);
            const circumference = 2 * Math.PI * 20;
            const offset = circumference - (score / 100) * circumference;
            
            circle.innerHTML = `
                <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#f3f4f6" stroke-width="4"/>
                    <circle cx="25" cy="25" r="20" fill="none" 
                            stroke="${this.getPerformanceColor(score).replace('text-', '')}" 
                            stroke-width="4" 
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            transform="rotate(-90 25 25)"
                            style="transition: stroke-dashoffset 1s ease-in-out;"/>
                    <text x="25" y="28" text-anchor="middle" font-size="10" fill="#374151">${score}%</text>
                </svg>
            `;
        });
    }

    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    initializeRowAnimations() {
        const rows = document.querySelectorAll('.department-row, .department-card');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.5s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // ===== VIEW MANAGEMENT =====
    setViewMode(mode) {
        this.viewMode = mode;
        const tableView = document.getElementById('tableView');
        const gridView = document.getElementById('gridView');
        const tableBtn = document.querySelector('[data-view-mode="table"]');
        const gridBtn = document.querySelector('[data-view-mode="grid"]');

        if (mode === 'table') {
            if (tableView) tableView.style.display = 'block';
            if (gridView) gridView.style.display = 'none';
            tableBtn?.classList.add('active');
            gridBtn?.classList.remove('active');
        } else {
            if (tableView) tableView.style.display = 'none';
            if (gridView) gridView.style.display = 'block';
            tableBtn?.classList.remove('active');
            gridBtn?.classList.add('active');
        }

        this.renderDepartments();
    }

    // ===== DEPARTMENT ACTIONS =====
    async createDepartment() {
        try {
            const form = document.getElementById('createDepartmentForm');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            // Enhanced data validation
            if (!this.validateDepartmentData(data)) {
                return;
            }

            const response = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Department created successfully!');
                this.closeCreateModal();
                form.reset();
                await this.loadDepartments();
            } else {
                throw new Error(result.message || 'Failed to create department');
            }
        } catch (error) {
            console.error('Error creating department:', error);
            this.showError(error.message);
        }
    }

    validateDepartmentData(data) {
        if (!data.name?.trim()) {
            this.showError('Department name is required');
            return false;
        }

        if (!data.code?.trim()) {
            this.showError('Department code is required');
            return false;
        }

        if (!/^[A-Z0-9]{2,10}$/.test(data.code)) {
            this.showError('Department code must be 2-10 uppercase alphanumeric characters');
            return false;
        }

        return true;
    }

    async deleteDepartment(departmentId) {
        const result = await Swal.fire({
            title: 'Archive Department?',
            text: "This will move the department to archived status. You can restore it later.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, archive it!',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    const response = await fetch(`/api/admin/departments/${departmentId}`, {
                        method: 'DELETE'
                    });
                    return response.json();
                } catch (error) {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                }
            }
        });

        if (result.isConfirmed) {
            if (result.value.success) {
                this.showSuccess('Department archived successfully!');
                await this.loadDepartments();
            } else {
                this.showError(result.value.message || 'Failed to archive department');
            }
        }
    }

    viewDepartment(departmentId) {
        window.location.href = `/admin/departments/${departmentId}`;
    }

    editDepartment(departmentId) {
        window.location.href = `/admin/departments/${departmentId}/edit`;
    }

    showAnalytics(departmentId) {
        window.location.href = `/admin/departments/analytics?id=${departmentId}`;
    }

    quickActions(departmentId) {
        // Implementation for quick actions menu
        console.log('Quick actions for department:', departmentId);
    }

    // ===== EXPORT FUNCTIONALITY =====
    async exportData(format) {
        try {
            const queryParams = new URLSearchParams({
                ...this.filters,
                format: format
            });

            const response = await fetch(`/api/admin/departments/export?${queryParams}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `departments-export-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showSuccess(`Data exported successfully as ${format.toUpperCase()}`);
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data');
        }
    }

    // ===== UI STATE MANAGEMENT =====
    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const content = document.getElementById('tableView') || document.getElementById('gridView');
        
        if (loadingState) loadingState.style.display = 'block';
        if (content) content.style.opacity = '0.5';
    }

    hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const content = document.getElementById('tableView') || document.getElementById('gridView');
        
        if (loadingState) loadingState.style.display = 'none';
        if (content) content.style.opacity = '1';
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const tableView = document.getElementById('tableView');
        const gridView = document.getElementById('gridView');
        
        if (emptyState) emptyState.style.display = 'block';
        if (tableView) tableView.style.display = 'none';
        if (gridView) gridView.style.display = 'none';
    }

    // ===== NOTIFICATION SYSTEM =====
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.department-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `department-notification alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border: none;
            border-radius: 10px;
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // ===== REAL-TIME UPDATES =====
    setupRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.loadDepartments();
        }, 30000);

        // Listen for department updates from other tabs
        this.setupCrossTabCommunication();
    }

    setupCrossTabCommunication() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'departmentUpdated' && e.newValue) {
                this.showSuccess('Department data updated from another tab');
                this.loadDepartments();
            }
        });
    }

    // ===== KEYBOARD SHORTCUTS =====
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N - New department
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showCreateModal();
            }
            
            // Ctrl/Cmd + F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('globalSearch');
                if (searchInput) searchInput.focus();
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    showCreateModal() {
        const modal = new bootstrap.Modal(document.getElementById('createModal'));
        modal.show();
    }

    closeCreateModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        if (modal) modal.hide();
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
    }

    // ===== ANIMATIONS =====
    initializeAnimations() {
        // Initialize any additional animations
        this.initializeScrollAnimations();
    }

    initializeScrollAnimations() {
        // Implementation for scroll-based animations
    }

    // ===== STATS UPDATES =====
    updateStats(statistics) {
        const elements = {
            'totalDepartments': statistics?.departmentCount || 0,
            'activeDepartments': statistics?.activeDepartments || 0,
            'avgPerformance': statistics?.avgPerformance ? statistics.avgPerformance.toFixed(1) + '%' : '0%',
            'avgUtilization': statistics?.avgUtilization ? statistics.avgUtilization.toFixed(1) + '%' : '0%',
            'totalEmployees': statistics?.totalEmployees || 0,
            'activeGrowth': statistics?.growthRate ? statistics.growthRate.toFixed(1) + '%' : '0%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateValue(element, parseInt(element.textContent) || 0, value, 1000);
            }
        });
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(start + (end - start) * progress);
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    }

    updateFilters(appliedFilters) {
        // Update filter UI based on applied filters
        console.log('Filters updated:', appliedFilters);
    }
}

// ===== GLOBAL INITIALIZATION =====
let premiumManager;

document.addEventListener('DOMContentLoaded', function() {
    try {
        premiumManager = new PremiumDepartmentManager();
        window.premiumManager = premiumManager;
        
        // Additional global event listeners
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Reload data when tab becomes visible
                premiumManager.loadDepartments();
            }
        });
    } catch (error) {
        console.error('Failed to initialize Premium Department Manager:', error);
    }
});

// Global utility functions
window.resetFilters = function() {
    if (premiumManager) {
        premiumManager.filters = {
            search: '',
            status: '',
            sortBy: 'name',
            sortOrder: 'asc'
        };
        
        const searchInput = document.getElementById('globalSearch');
        const statusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (sortBy) sortBy.value = 'name';
        
        premiumManager.currentPage = 1;
        premiumManager.loadDepartments();
    }
};

window.applyFilters = function() {
    if (premiumManager) {
        premiumManager.currentPage = 1;
        premiumManager.loadDepartments();
    }
};

// Error boundary for unhandled errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    if (premiumManager) {
        premiumManager.showError('An unexpected error occurred. Please refresh the page.');
    }
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}