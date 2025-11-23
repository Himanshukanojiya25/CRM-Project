// Ultra Premium Feedback Analytics Dashboard
class FeedbackAnalytics {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        console.log('📊 Feedback Analytics Initialized');
        this.initCharts();
        this.bindEvents();
        this.loadRealTimeData();
    }

    initCharts() {
        this.initRatingDistribution();
        this.initFeedbackTrends();
        this.initCategoryDistribution();
        this.initResponseTimeGauge();
    }

    initRatingDistribution() {
        // Simulate rating distribution data
        const ratingData = {
            '1 Star': 12,
            '2 Stars': 45,
            '3 Stars': 89,
            '4 Stars': 156,
            '5 Stars': 234
        };

        const bars = document.querySelectorAll('.flex.flex-col.items-center');
        let index = 0;
        
        Object.values(ratingData).forEach((value, i) => {
            const bar = bars[i];
            if (bar) {
                const barElement = bar.querySelector('div[class*="bg-gradient-to-t"]');
                const countElement = bar.querySelector('span:last-child');
                
                // Animate bar height
                this.animateBar(barElement, value / 2.34); // Normalize to max 200px
                
                // Animate count
                if (countElement) {
                    this.animateCounter(countElement, value);
                }
            }
        });
    }

    initFeedbackTrends() {
        // Simulate weekly feedback trends
        const weeklyData = [60, 90, 120, 80, 150, 100, 70];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        const trendBars = document.querySelectorAll('.flex-1.flex.flex-col.items-center');
        
        weeklyData.forEach((value, index) => {
            if (trendBars[index]) {
                const bar = trendBars[index].querySelector('div[class*="bg-gradient-to-t"]');
                this.animateBar(bar, value);
            }
        });
    }

    initCategoryDistribution() {
        const categoryData = [
            { label: 'Bug Reports', value: 35, color: 'red' },
            { label: 'Feature Requests', value: 28, color: 'blue' },
            { label: 'General Feedback', value: 22, color: 'green' },
            { label: 'Support', value: 15, color: 'purple' }
        ];

        // Animate progress bars
        categoryData.forEach((category, index) => {
            const progressBar = document.querySelectorAll('.bg-gray-700.rounded-full.h-2')[index];
            if (progressBar) {
                const fillBar = progressBar.querySelector(`.bg-${category.color}-500`);
                if (fillBar) {
                    setTimeout(() => {
                        fillBar.style.width = `${category.value}%`;
                        fillBar.style.transition = 'width 1s ease-in-out';
                    }, index * 200);
                }
            }
        });
    }

    initResponseTimeGauge() {
        // Animate response time gauge
        const gauge = document.querySelector('.inline-flex.items-center.justify-center');
        if (gauge) {
            gauge.style.transform = 'scale(0)';
            setTimeout(() => {
                gauge.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
                gauge.style.transform = 'scale(1)';
            }, 500);
        }
    }

    animateBar(barElement, targetHeight) {
        if (!barElement) return;
        
        barElement.style.height = '0px';
        setTimeout(() => {
            barElement.style.transition = 'height 1s ease-in-out';
            barElement.style.height = `${targetHeight}px`;
        }, 300);
    }

    animateCounter(element, targetValue) {
        let current = 0;
        const increment = targetValue / 20;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 50);
    }

    bindEvents() {
        // Time period selector
        const timeSelector = document.querySelector('select');
        if (timeSelector) {
            timeSelector.addEventListener('change', (e) => {
                this.updateTimePeriod(e.target.value);
            });
        }

        // Export analytics data
        this.bindExportButton();
        
        // Real-time updates
        this.startRealTimeUpdates();
    }

    updateTimePeriod(period) {
        this.showLoading();
        
        // Simulate API call for new time period
        setTimeout(() => {
            this.hideLoading();
            this.refreshCharts(period);
            this.showNotification(`Analytics updated for ${period}`, 'success');
        }, 1000);
    }

    refreshCharts(period) {
        // Simulate chart data update based on time period
        console.log(`Refreshing charts for: ${period}`);
        
        // Add some visual feedback
        const charts = document.querySelectorAll('.bg-gray-800\\/30');
        charts.forEach(chart => {
            chart.style.opacity = '0.7';
            setTimeout(() => {
                chart.style.opacity = '1';
                chart.style.transition = 'opacity 0.3s ease';
            }, 300);
        });
    }

    bindExportButton() {
        // Add export functionality
        const exportBtn = document.createElement('button');
        exportBtn.className = 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 ml-3';
        exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export Report';
        exportBtn.onclick = () => this.exportAnalytics();
        
        const header = document.querySelector('.flex.justify-between.items-center.mb-6');
        if (header) {
            header.appendChild(exportBtn);
        }
    }

    exportAnalytics() {
        this.showNotification('Preparing analytics report...', 'info');
        
        // Simulate export process
        setTimeout(() => {
            const data = {
                timestamp: new Date().toISOString(),
                metrics: {
                    totalFeedback: 1247,
                    avgRating: 4.2,
                    responseTime: '2.4h',
                    satisfaction: '8.7/10'
                }
            };
            
            // Create downloadable file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Analytics report downloaded!', 'success');
        }, 2000);
    }

    loadRealTimeData() {
        // Simulate real-time data updates
        setInterval(() => {
            this.updateLiveMetrics();
        }, 30000); // Update every 30 seconds
    }

    updateLiveMetrics() {
        // Simulate live metric updates
        const metrics = [
            { selector: '.text-2xl.font-bold.text-white:first-child', change: Math.random() > 0.5 ? 1 : -1 },
            { selector: '.text-2xl.font-bold.text-white:nth-child(2)', change: Math.random() > 0.3 ? 1 : -1 },
            { selector: '.text-2xl.font-bold.text-white:nth-child(3)', change: Math.random() > 0.7 ? 1 : -1 }
        ];

        metrics.forEach(metric => {
            const element = document.querySelector(metric.selector);
            if (element) {
                const current = parseInt(element.textContent);
                const newValue = Math.max(0, current + metric.change);
                
                // Add pulse animation
                element.classList.add('pulse-glow');
                setTimeout(() => {
                    element.classList.remove('pulse-glow');
                }, 1000);
                
                this.animateCounter(element, newValue);
            }
        });
    }

    showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-gray-800/90 rounded-2xl p-6 border border-cyan-500/30 flex items-center space-x-3">
                <div class="loading-spinner"></div>
                <span class="text-white font-medium">Updating analytics...</span>
            </div>
        `;
        overlay.id = 'analytics-loading';
        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.getElementById('analytics-loading');
        if (overlay) {
            overlay.remove();
        }
    }

    showNotification(message, type) {
        if (window.feedbackManager) {
            window.feedbackManager.showNotification(message, type);
        }
    }

    // Advanced analytics methods
    calculateTrends() {
        return {
            weeklyGrowth: '+12%',
            satisfactionTrend: '+5%',
            responseTimeImprovement: '-15%'
        };
    }

    generateInsights() {
        const insights = [
            "Most feedback received on Fridays",
            "Bug reports have increased by 20% this week",
            "Customer satisfaction is trending upward",
            "Response times are improving consistently"
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }
}

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackAnalytics = new FeedbackAnalytics();
    
    // Add custom styles for animations
    const style = document.createElement('style');
    style.textContent = `
        .pulse-glow {
            animation: pulse-glow 1s ease-in-out;
        }
        
        @keyframes pulse-glow {
            0%, 100% {
                box-shadow: 0 0 5px rgba(6, 182, 212, 0.5);
            }
            50% {
                box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);
            }
        }
        
        .loading-spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid #06b6d4;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
});