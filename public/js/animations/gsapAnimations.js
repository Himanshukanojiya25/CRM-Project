// Enhanced GSAP Animations
function initDashboardAnimations() {
    // Animate stat cards with stagger
    gsap.from('.stat-card', {
        duration: 1.2,
        y: 100,
        opacity: 0,
        rotation: -10,
        stagger: 0.3,
        ease: 'back.out(1.7)',
        delay: 0.5
    });

    // Animate chart container
    gsap.from('.chart-container', {
        duration: 1.5,
        scale: 0.8,
        opacity: 0,
        rotationY: 180,
        delay: 1.2,
        ease: 'power3.out'
    });

    // Animate recent activity
    gsap.from('.recent-activity', {
        duration: 1.3,
        x: -200,
        opacity: 0,
        delay: 1.8,
        ease: 'elastic.out(1, 0.8)'
    });

    // Animate header
    gsap.from('.header h1', {
        duration: 1,
        y: -50,
        opacity: 0,
        ease: 'bounce.out'
    });

    // Continuous floating animation
    gsap.to('.stat-card', {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', function() {
    if (typeof gsap !== 'undefined') {
        initDashboardAnimations();
    }
});

// Chart specific animations
function initChartAnimations() {
    // Animate chart entrance
    gsap.from('.chart-container', {
        duration: 2,
        scale: 0.5,
        opacity: 0,
        rotation: 5,
        ease: 'elastic.out(1, 0.8)',
        delay: 1.5
    });

    // Pulse animation for chart
    gsap.to('.chart-container', {
        duration: 3,
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });
}

// Add to existing init function
function initDashboardAnimations() {
    // ... existing animations ...
    initChartAnimations();
}