// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Performance Dashboard Loaded Successfully!');
    
    // Add loading animation
    animateKPICards();
});

function animateKPICards() {
    const cards = document.querySelectorAll('.kpi-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}