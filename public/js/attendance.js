// Attendance JavaScript with Monthly Features
class AttendanceManager {
    constructor() {
        this.currentMonth = moment().format('YYYY-MM');
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
        document.getElementById('checkInBtn').addEventListener('click', () => this.checkIn());
        document.getElementById('checkOutBtn').addEventListener('click', () => this.checkOut());
        
        // Month selector
        document.getElementById('monthSelect').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.loadMonthlyData(this.currentMonth);
            this.generateCalendar();
        });
    }

    async checkIn() {
        try {
            const response = await fetch('/user/attendance/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Checked in successfully!', 'success');
                this.loadTodayStatus();
                this.loadMonthlyData(this.currentMonth);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            this.showNotification('Check-in failed!', 'error');
            console.error('Check-in error:', error);
        }
    }

    async checkOut() {
        try {
            const response = await fetch('/user/attendance/check-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Checked out successfully!', 'success');
                this.loadTodayStatus();
                this.loadMonthlyData(this.currentMonth);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            this.showNotification('Check-out failed!', 'error');
            console.error('Check-out error:', error);
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
        
        // Update status
        statusElement.textContent = data.status.toUpperCase();
        statusElement.className = `status-badge status-${data.status}`;
        
        // Update times
        if (data.checkIn) {
            checkinTime.textContent = `At: ${moment(data.checkIn).format('HH:mm:ss')}`;
            document.getElementById('checkInBtn').disabled = true;
        } else {
            checkinTime.textContent = '';
            document.getElementById('checkInBtn').disabled = false;
        }
        
        if (data.checkOut) {
            checkoutTime.textContent = `At: ${moment(data.checkOut).format('HH:mm:ss')}`;
            document.getElementById('checkOutBtn').disabled = true;
        } else if (data.checkIn) {
            checkoutTime.textContent = '';
            document.getElementById('checkOutBtn').disabled = false;
        } else {
            checkoutTime.textContent = '';
            document.getElementById('checkOutBtn').disabled = true;
        }
    }

    updateMonthlyStats(stats) {
        document.getElementById('presentCount').textContent = stats.presentDays;
        document.getElementById('lateCount').textContent = stats.lateDays;
        document.getElementById('absentCount').textContent = stats.absentDays;
        document.getElementById('totalCount').textContent = stats.totalDays;
        document.getElementById('records-month').textContent = moment(stats.monthYear, 'YYYY-MM').format('MMMM YYYY');
    }

    renderRecords(records) {
        const tbody = document.getElementById('records-body');
        tbody.innerHTML = '';

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No attendance records found</td></tr>';
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${moment(record.date).format('DD MMM YYYY')}</td>
                <td>${record.checkIn ? moment(record.checkIn).format('HH:mm:ss') : '-'}</td>
                <td>${record.checkOut ? moment(record.checkOut).format('HH:mm:ss') : '-'}</td>
                <td>${record.totalHours || '-'}</td>
                <td><span class="status-badge status-${record.status}">${record.status.toUpperCase()}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    generateCalendar() {
        const calendar = document.getElementById('attendanceCalendar');
        const currentMonth = moment(this.currentMonth, 'YYYY-MM');
        
        let html = '<div class="calendar-header">';
        html += `<span class="month-name">${currentMonth.format('MMMM YYYY')}</span>`;
        html += '</div><div class="calendar-grid">';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            html += `<div class="calendar-day header">${day}</div>`;
        });
        
        // Add empty cells for days before month start
        const firstDay = currentMonth.startOf('month').day();
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of month
        const daysInMonth = currentMonth.daysInMonth();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = currentMonth.clone().date(day);
            html += `<div class="calendar-day" data-date="${date.format('YYYY-MM-DD')}">${day}</div>`;
        }
        
        html += '</div>';
        calendar.innerHTML = html;
    }

    updateCalendar(records) {
        records.forEach(record => {
            const dateStr = moment(record.date).format('YYYY-MM-DD');
            const dayElement = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
            
            if (dayElement) {
                dayElement.classList.add(`attendance-${record.status}`);
                dayElement.title = `${record.status} - ${record.checkIn ? moment(record.checkIn).format('HH:mm') : 'No check-in'}`;
            }
        });
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttendanceManager();
});