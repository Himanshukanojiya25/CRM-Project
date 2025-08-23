// Attendance functionality with animations
class AttendanceSystem {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadTodayStatus();
        this.setupEventListeners();
    }

    async loadTodayStatus() {
        try {
            const response = await fetch('/user/attendance/today-status', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.updateUI(data.data);
            }
        } catch (error) {
            console.error('Status load error:', error);
        }
    }

    updateUI(data) {
        // Update status badge
        const statusElement = document.getElementById('current-status');
        if (statusElement) {
            statusElement.className = `status-badge status-${data.status || 'absent'}`;
            statusElement.textContent = data.status ? data.status.toUpperCase() : 'ABSENT';
        }

        // Update check-in/out buttons
        this.updateButtons(data);
    }

    updateButtons(data) {
        const checkInBtn = document.getElementById('checkInBtn');
        const checkOutBtn = document.getElementById('checkOutBtn');

        if (data.checkIn && !data.checkOut) {
            checkInBtn.disabled = true;
            checkInBtn.innerHTML = '<i class="fas fa-check"></i> Already Checked In';
            checkOutBtn.disabled = false;
        } else if (data.checkIn && data.checkOut) {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
            checkInBtn.innerHTML = '<i class="fas fa-check"></i> Checked In';
            checkOutBtn.innerHTML = '<i class="fas fa-check"></i> Checked Out';
        }
    }

    setupEventListeners() {
        document.getElementById('checkInBtn')?.addEventListener('click', () => this.checkIn());
        document.getElementById('checkOutBtn')?.addEventListener('click', () => this.checkOut());
    }

    async checkIn() {
        try {
            const btn = document.getElementById('checkInBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking In...';
            btn.disabled = true;

            const response = await fetch('/user/attendance/check-in', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Checked in successfully!', 'success');
                await this.loadTodayStatus();
            } else {
                this.showNotification('❌ ' + data.message, 'error');
            }
        } catch (error) {
            this.showNotification('❌ Check-in failed', 'error');
        }
    }

    async checkOut() {
        try {
            const btn = document.getElementById('checkOutBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Out...';
            btn.disabled = true;

            const response = await fetch('/user/attendance/check-out', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Checked out successfully!', 'success');
                await this.loadTodayStatus();
            } else {
                this.showNotification('❌ ' + data.message, 'error');
            }
        } catch (error) {
            this.showNotification('❌ Check-out failed', 'error');
        }
    }

    showNotification(message, type) {
        // Create animated notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        notification.style.background = type === 'success' ? '#4CAF50' : '#F44336';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AttendanceSystem();
});