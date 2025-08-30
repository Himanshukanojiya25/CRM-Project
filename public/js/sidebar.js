// Sidebar functionality for mobile with overlay
class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleBtn = document.querySelector('.sidebar-toggle');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.init();
    }

    init() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from propagating to document
                this.toggleSidebar();
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isSidebarOpen() &&
                !this.sidebar.contains(e.target) &&
                !this.toggleBtn.contains(e.target)) {
                this.closeSidebar();
            }
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarOpen()) {
                this.closeSidebar();
            }
        });

        // Close sidebar when clicking on sidebar links (mobile only)
        const sidebarLinks = document.querySelectorAll('.sidebar a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 769) {
                    this.closeSidebar();
                }
            });
        });
    }

    isSidebarOpen() {
        return this.sidebar.classList.contains('active');
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('active');
        if (this.overlay) this.overlay.classList.toggle('active');
        
        // Prevent body scrolling when sidebar is open on mobile
        if (window.innerWidth < 769) {
            document.body.style.overflow = this.isSidebarOpen() ? 'hidden' : '';
        }
    }

    openSidebar() {
        this.sidebar.classList.add('active');
        if (this.overlay) this.overlay.classList.add('active');
        if (window.innerWidth < 769) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeSidebar() {
        this.sidebar.classList.remove('active');
        if (this.overlay) this.overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
    
    // Additional mobile responsiveness checks
    function handleWindowResize() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        // Auto-close sidebar when resizing to desktop
        if (window.innerWidth >= 769) {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Add resize listener
    window.addEventListener('resize', handleWindowResize);
});

// Fallback function for onclick attributes (if needed)
function toggleSidebar() {
    const manager = new SidebarManager();
    manager.toggleSidebar();
}