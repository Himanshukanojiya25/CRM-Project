// profile.js - Profile Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded successfully');

    // Handle profile image errors safely
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.addEventListener('error', function() {
            console.log('Profile image not found, using default');
            this.src = '/images/default-avatar.png';
            // Remove the event listener to prevent infinite loop
            this.removeEventListener('error', arguments.callee);
        });

        // Pre-check if image exists
        const testImage = new Image();
        testImage.onload = function() {
            console.log('Profile image loaded successfully');
        };
        testImage.onerror = function() {
            console.log('Profile image not found, setting default');
            profileImage.src = '/images/default-avatar.png';
        };
        testImage.src = profileImage.src;
    }

    // Copy button functionality
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const textToCopy = this.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                alert('Failed to copy text to clipboard');
            }
        });
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Set initial theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        // Update icon based on current theme
        const updateThemeIcon = () => {
            const icon = themeToggle.querySelector('i');
            if (document.documentElement.classList.contains('dark')) {
                icon.className = 'fas fa-sun';
                themeToggle.title = 'Switch to Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                themeToggle.title = 'Switch to Dark Mode';
            }
        };

        themeToggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            updateThemeIcon();
        });

        updateThemeIcon(); // Set initial icon
    }

    // Share profile functionality
    const shareBtn = document.getElementById('shareProfileBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            if (navigator.share) {
                navigator.share({
                    title: 'Profile - CRM System',
                    text: 'Check out my profile',
                    url: window.location.href
                }).catch(err => {
                    console.log('Error sharing:', err);
                });
            } else {
                // Fallback: Copy URL to clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    alert('Profile link copied to clipboard!');
                }).catch(() => {
                    alert('Please copy the URL manually: ' + window.location.href);
                });
            }
        });
    }

    // Initialize Bootstrap tabs
    const tabTriggers = document.querySelectorAll('#profileTabs button[data-bs-toggle="tab"]');
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = new bootstrap.Tab(this);
            tab.show();
        });
    });

    console.log('All profile functionality initialized');
});