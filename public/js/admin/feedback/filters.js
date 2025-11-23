// Advanced Filter System for Feedback Management
class FeedbackFilters {
    constructor() {
        this.activeFilters = {};
        this.init();
    }

    init() {
        this.bindFilterEvents();
        this.loadSavedFilters();
    }

    bindFilterEvents() {
        // Status filter
        const statusFilter = document.querySelector('select:first-of-type');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.activeFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        // Category filter
        const categoryFilter = document.querySelectorAll('select')[1];
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.activeFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Date range filter
        this.initDateRangeFilter();
        
        // Priority filter
        this.initPriorityFilter();
    }

    initDateRangeFilter() {
        // This would be implemented with a date picker library
        console.log('Date range filter initialized');
    }

    initPriorityFilter() {
        // Priority filter implementation
        console.log('Priority filter initialized');
    }

    applyFilters() {
        this.showLoading();
        
        // Simulate API call with filters
        setTimeout(() => {
            this.hideLoading();
            this.updateFilterResults();
            this.saveFilters();
            this.showNotification('Filters applied successfully', 'success');
        }, 800);
    }

    updateFilterResults() {
        const results = document.querySelector('tbody');
        if (!results) return;

        const rows = results.querySelectorAll('tr');
        let visibleCount = 0;

        rows.forEach(row => {
            let shouldShow = true;

            // Apply status filter
            if (this.activeFilters.status && this.activeFilters.status !== 'All Status') {
                const status = row.querySelector('[class*="bg-"]:has(.fa-clock, .fa-check, .fa-exclamation)');
                if (status && !status.textContent.toLowerCase().includes(this.activeFilters.status.toLowerCase())) {
                    shouldShow = false;
                }
            }

            // Apply category filter
            if (this.activeFilters.category && this.activeFilters.category !== 'All Categories') {
                const category = row.querySelector('[class*="bg-"]:has(.fa-bug, .fa-thumbs-up)');
                if (category && !category.textContent.toLowerCase().includes(this.activeFilters.category.toLowerCase())) {
                    shouldShow = false;
                }
            }

            if (shouldShow) {
                row.style.display = '';
                visibleCount++;
                this.animateRow(row, 'fadeIn');
            } else {
                row.style.display = 'none';
            }
        });

        this.updateResultsCount(visibleCount);
    }

    updateResultsCount(count) {
        const countElement = document.querySelector('[class*="text-gray-400"]:contains("Showing")');
        if (countElement) {
            countElement.textContent = `Showing ${count} of ${this.getTotalCount()} results`;
        }
    }

    getTotalCount() {
        return document.querySelectorAll('tbody tr').length;
    }

    saveFilters() {
        localStorage.setItem('feedbackFilters', JSON.stringify(this.activeFilters));
    }

    loadSavedFilters() {
        const saved = localStorage.getItem('feedbackFilters');
        if (saved) {
            this.activeFilters = JSON.parse(saved);
            this.applySavedFiltersToUI();
        }
    }

    applySavedFiltersToUI() {
        // Apply saved filters to select elements
        if (this.activeFilters.status) {
            const statusSelect = document.querySelector('select:first-of-type');
            if (statusSelect) statusSelect.value = this.activeFilters.status;
        }

        if (this.activeFilters.category) {
            const categorySelect = document.querySelectorAll('select')[1];
            if (categorySelect) categorySelect.value = this.activeFilters.category;
        }
    }

    clearFilters() {
        this.activeFilters = {};
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.value = select.querySelector('option').value;
        });
        
        this.applyFilters();
        this.showNotification('Filters cleared', 'info');
    }

    exportFilteredData() {
        const filteredData = this.getFilteredData();
        // Implement export functionality
        console.log('Exporting filtered data:', filteredData);
        this.showNotification('Export started...', 'info');
    }

    getFilteredData() {
        // Return filtered data for export
        return {
            filters: this.activeFilters,
            timestamp: new Date().toISOString()
        };
    }

    showLoading() {
        // Show loading state
        const table = document.querySelector('table');
        if (table) {
            table.style.opacity = '0.7';
        }
    }

    hideLoading() {
        const table = document.querySelector('table');
        if (table) {
            table.style.opacity = '1';
        }
    }

    animateRow(row, animation) {
        row.style.animation = `${animation} 0.3s ease`;
    }

    showNotification(message, type) {
        // Use the notification system from main.js
        if (window.feedbackManager) {
            window.feedbackManager.showNotification(message, type);
        }
    }
}

// Initialize filters when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackFilters = new FeedbackFilters();
});