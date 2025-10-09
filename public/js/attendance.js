// Attendance JavaScript with Monthly Features
class AttendanceManager {
    constructor() {
        this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTodayStatus();
        this.loadMonthlyData(this.currentMonth);
        this.generateCalendar();
    }

    bindEvents() {
        // Check-in/out buttons
        const checkInBtn = document.getElementById('checkInBtn');
        const checkOutBtn = document.getElementById('checkOutBtn');
        
        if (checkInBtn) {
            checkInBtn.addEventListener('click', () => this.checkIn());
        }
        if (checkOutBtn) {
            checkOutBtn.addEventListener('click', () => this.checkOut());
        }
        
        // Month selector
        const monthSelect = document.getElementById('monthSelect');
        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                this.currentMonth = e.target.value;
                this.loadMonthlyData(this.currentMonth);
                this.generateCalendar();
            });
        }
    }

    async checkIn() {
        try {
            console.log('🕐 Attempting checkin...');
            const checkInBtn = document.getElementById('checkInBtn');
            checkInBtn.disabled = true;
            checkInBtn.textContent = 'Checking In...';

            const response = await fetch('/user/attendance/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            console.log('📊 Checkin response:', result);
            
            if (result.success) {
                this.showNotification('✅ Checked in successfully!', 'success');
                this.loadTodayStatus();
                this.loadMonthlyData(this.currentMonth);
            } else {
                this.showNotification('❌ ' + result.message, 'error');
                checkInBtn.disabled = false;
                checkInBtn.textContent = 'Check In';
            }
        } catch (error) {
            console.error('Check-in error:', error);
            this.showNotification('❌ Check-in failed! Please try again.', 'error');
            const checkInBtn = document.getElementById('checkInBtn');
            if (checkInBtn) {
                checkInBtn.disabled = false;
                checkInBtn.textContent = 'Check In';
            }
        }
    }

    async checkOut() {
        try {
            console.log('🕐 Attempting checkout...');
            const checkOutBtn = document.getElementById('checkOutBtn');
            checkOutBtn.disabled = true;
            checkOutBtn.textContent = 'Checking Out...';

            const response = await fetch('/user/attendance/check-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            console.log('📊 Checkout response:', result);
            
            if (result.success) {
                this.showNotification('✅ Checked out successfully!', 'success');
                this.loadTodayStatus();
                this.loadMonthlyData(this.currentMonth);
            } else {
                this.showNotification('❌ ' + result.message, 'error');
                checkOutBtn.disabled = false;
                checkOutBtn.textContent = 'Check Out';
            }
        } catch (error) {
            console.error('Check-out error:', error);
            this.showNotification('❌ Check-out failed! Please try again.', 'error');
            const checkOutBtn = document.getElementById('checkOutBtn');
            if (checkOutBtn) {
                checkOutBtn.disabled = false;
                checkOutBtn.textContent = 'Check Out';
            }
        }
    }

    async loadTodayStatus() {
        try {
            const response = await fetch('/user/attendance/today-status');
            const result = await response.json();
            
            if (result.success) {
                this.updateTodayStatus(result.data);
            }
        } catch (error) {
            console.error('Status load error:', error);
        }
    }

    async loadMonthlyData(monthYear) {
        try {
            const response = await fetch(`/user/attendance/monthly/${monthYear}`);
            const result = await response.json();
            
            if (result.success) {
                this.updateMonthlyStats(result.data.stats);
                this.renderRecords(result.data.records);
                this.updateCalendar(result.data.records);
            }
        } catch (error) {
            console.error('Monthly data load error:', error);
        }
    }

    updateTodayStatus(data) {
        const statusElement = document.getElementById('current-status');
        const checkinTime = document.getElementById('checkinTime');
        const checkoutTime = document.getElementById('checkoutTime');
        const checkInBtn = document.getElementById('checkInBtn');
        const checkOutBtn = document.getElementById('checkOutBtn');
        
        if (!statusElement) return;
        
        // Update status
        const status = data.status || 'absent';
        statusElement.textContent = status.toUpperCase();
        statusElement.className = `status-badge status-${status}`;
        
        // Update times and buttons
        if (data.checkIn) {
            const checkInDate = new Date(data.checkIn);
            checkinTime.textContent = `At: ${checkInDate.toLocaleTimeString()}`;
            if (checkInBtn) {
                checkInBtn.disabled = true;
                checkInBtn.textContent = 'Checked In';
            }
        } else {
            checkinTime.textContent = '';
            if (checkInBtn) {
                checkInBtn.disabled = false;
                checkInBtn.textContent = 'Check In';
            }
        }
        
        if (data.checkOut) {
            const checkOutDate = new Date(data.checkOut);
            checkoutTime.textContent = `At: ${checkOutDate.toLocaleTimeString()}`;
            if (checkOutBtn) {
                checkOutBtn.disabled = true;
                checkOutBtn.textContent = 'Checked Out';
            }
        } else if (data.checkIn) {
            checkoutTime.textContent = '';
            if (checkOutBtn) {
                checkOutBtn.disabled = false;
                checkOutBtn.textContent = 'Check Out';
            }
        } else {
            checkoutTime.textContent = '';
            if (checkOutBtn) {
                checkOutBtn.disabled = true;
                checkOutBtn.textContent = 'Check Out';
            }
        }
    }

    updateMonthlyStats(stats) {
        const presentCount = document.getElementById('presentCount');
        const lateCount = document.getElementById('lateCount');
        const absentCount = document.getElementById('absentCount');
        const totalCount = document.getElementById('totalCount');
        const recordsMonth = document.getElementById('records-month');
        
        if (presentCount) presentCount.textContent = stats.presentDays || 0;
        if (lateCount) lateCount.textContent = stats.lateDays || 0;
        if (absentCount) absentCount.textContent = stats.absentDays || 0;
        if (totalCount) totalCount.textContent = stats.totalDays || 0;
        if (recordsMonth) {
            const [year, month] = stats.monthYear.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
            recordsMonth.textContent = `${monthName} ${year}`;
        }
    }

    renderRecords(records) {
        const tbody = document.getElementById('records-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No attendance records found</td></tr>';
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            const date = new Date(record.date);
            const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-';
            const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-';
            
            // ✅ FIXED: Total hours display with proper formatting
            let totalHoursDisplay = '-';
            if (record.totalHours && record.totalHours > 0) {
                totalHoursDisplay = `${record.totalHours} hrs`;
            } else if (record.checkIn && record.checkOut) {
                // Calculate hours if not stored in database
                const diffMs = new Date(record.checkOut) - new Date(record.checkIn);
                const hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
                totalHoursDisplay = `${hours} hrs`;
            }
            
            row.innerHTML = `
                <td>${date.toLocaleDateString('en-IN')}</td>
                <td>${checkInTime}</td>
                <td>${checkOutTime}</td>
                <td><strong class="hours-display">${totalHoursDisplay}</strong></td>
                <td><span class="status-badge status-${record.status}">${record.status.toUpperCase()}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    generateCalendar() {
        const calendar = document.getElementById('attendanceCalendar');
        if (!calendar) return;

        const [year, month] = this.currentMonth.split('-');
        const currentMonthDate = new Date(year, month - 1, 1);
        
        let html = '<div class="calendar-header">';
        html += `<span class="month-name">${currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>`;
        html += '</div><div class="calendar-grid">';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            html += `<div class="calendar-day header">${day}</div>`;
        });
        
        // Add empty cells for days before month start
        const firstDay = currentMonthDate.getDay();
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of month
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            html += `<div class="calendar-day" data-date="${dateStr}">${day}</div>`;
        }
        
        html += '</div>';
        calendar.innerHTML = html;
    }

    updateCalendar(records) {
        if (!records) return;
        
        records.forEach(record => {
            const recordDate = new Date(record.date);
            const dateStr = `${recordDate.getFullYear()}-${(recordDate.getMonth() + 1).toString().padStart(2, '0')}-${recordDate.getDate().toString().padStart(2, '0')}`;
            const dayElement = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
            
            if (dayElement) {
                dayElement.classList.add(`attendance-${record.status}`);
                
                // Create tooltip with hours info
                let tooltip = `${record.status}`;
                if (record.checkIn) {
                    tooltip += ` - IN: ${new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }
                if (record.checkOut) {
                    tooltip += ` - OUT: ${new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }
                if (record.totalHours) {
                    tooltip += ` - ${record.totalHours} hrs`;
                }
                
                dayElement.title = tooltip;
            }
        });
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            font-size: 14px;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttendanceManager();
});