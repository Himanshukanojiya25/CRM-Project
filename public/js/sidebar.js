// Sidebar functionality for mobile with overlay and active menu states
class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleBtn = document.querySelector('.sidebar-toggle');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.menuItems = document.querySelectorAll('.menu-item');
        this.init();
    }

    init() {
        console.log('Sidebar Manager Initialized');
        this.setupMenuItems();
        this.setupCurrentPageActiveState();
        this.setupEventListeners();
    }

    setupMenuItems() {
        // Menu items pe click event add karo
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                console.log('Menu item clicked:', item.textContent.trim());
                
                // Remove active class from all items
                this.menuItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Link pe naturally navigate hone do
                const link = item.querySelector('a');
                if (link && !e.target.classList.contains('fas')) {
                    // Browser link pe navigate karega
                    console.log('Navigating to:', link.href);
                }
            });
        });
    }

    setupCurrentPageActiveState() {
        // Current page ke hisaab se active menu set karo
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        
        let activeFound = false;
        
        this.menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                const href = link.getAttribute('href');
                console.log('Checking link:', href);
                
                // Exact match check karo
                if (href === currentPath) {
                    item.classList.add('active');
                    activeFound = true;
                    console.log('Exact match found:', href);
                }
            }
        });
        
        // Agar exact match nahi mila toh partial match check karo
        if (!activeFound) {
            this.menuItems.forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    const href = link.getAttribute('href');
                    if (currentPath.startsWith(href) && href !== '/') {
                        item.classList.add('active');
                        console.log('Partial match found:', href);
                    }
                }
            });
        }
    }

    setupEventListeners() {
        // Mobile functionality agar toggle button hai toh
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Close sidebar when clicking outside (mobile only)
        document.addEventListener('click', (e) => {
            if (this.isSidebarOpen() && 
                !this.sidebar.contains(e.target) && 
                !this.toggleBtn?.contains(e.target)) {
                this.closeSidebar();
            }
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 769) {
                this.closeSidebar();
            }
        });
    }

    isSidebarOpen() {
        return this.sidebar?.classList.contains('active');
    }

    toggleSidebar() {
        this.sidebar?.classList.toggle('active');
        this.overlay?.classList.toggle('active');
        
        if (window.innerWidth < 769) {
            document.body.style.overflow = this.isSidebarOpen() ? 'hidden' : '';
        }
    }

    openSidebar() {
        this.sidebar?.classList.add('active');
        this.overlay?.classList.add('active');
        if (window.innerWidth < 769) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeSidebar() {
        this.sidebar?.classList.remove('active');
        this.overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Sidebar');
    new SidebarManager();
});

// Debugging ke liye
console.log('Sidebar script loaded');