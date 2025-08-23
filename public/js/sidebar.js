// Sidebar functionality for mobile
class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleBtn = document.querySelector('.sidebar-toggle');
        this.init();
    }

    init() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.sidebar.classList.contains('active') && 
                !this.sidebar.contains(e.target) && 
                !this.toggleBtn.contains(e.target)) {
                this.closeSidebar();
            }
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebar.classList.contains('active')) {
                this.closeSidebar();
            }
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('active');
    }

    openSidebar() {
        this.sidebar.classList.add('active');
    }

    closeSidebar() {
        this.sidebar.classList.remove('active');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});