// performanceChart.js - Black Text with Light Background
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Fix blurry canvas
    const dpr = window.devicePixelRatio || 1;
    const chart = document.getElementById('performanceChart');
    const rect = chart.getBoundingClientRect();
    
    chart.width = rect.width * dpr;
    chart.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Light blue gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');  // Blue
    gradient.addColorStop(1, 'rgba(147, 197, 253, 0.4)'); // Light Blue

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Performance Score',
                data: [85, 78, 92, 65, 88, 95],
                backgroundColor: gradient,
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 8,
                barPercentage: 0.6,
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)', // ✅ Light gray grid
                        drawBorder: false
                    },
                    ticks: {
                        color: '#000000',  // ✅ Black text
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    background: 'rgba(255, 255, 255, 0.9)' // ✅ Light background
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#000000',  // ✅ Black text
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    background: 'rgba(255, 255, 255, 0.9)' // ✅ Light background
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#000000',  // ✅ Black text
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Initialize chart
if (document.getElementById('performanceChart')) {
    document.addEventListener('DOMContentLoaded', initPerformanceChart);
}