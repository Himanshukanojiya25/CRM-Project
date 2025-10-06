// Attendance Management
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Attendance JS Loaded');
    
    // Check-in button
    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) {
        checkInBtn.addEventListener('click', handleCheckIn);
    }
    
    // Check-out button
    const checkOutBtn = document.getElementById('checkOutBtn');
    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', handleCheckOut);
    }
    
    // Load today's status
    loadTodayStatus();
});

async function handleCheckIn() {
    try {
        const btn = document.getElementById('checkInBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking In...';

        const response = await fetch('/user/attendance/check-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        console.log('Check-in response:', result);

        if (result.success) {
            showAlert('Check-in successful!', 'success');
            // Refresh status
            setTimeout(() => {
                loadTodayStatus();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Check In';
            }, 2000);
        } else {
            showAlert(result.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Check In';
        }
    } catch (error) {
        console.error('Check-in error:', error);
        showAlert('Check-in failed!', 'error');
        const btn = document.getElementById('checkInBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Check In';
        }
    }
}

async function handleCheckOut() {
    try {
        const btn = document.getElementById('checkOutBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Out...';

        const response = await fetch('/user/attendance/check-out', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        console.log('Check-out response:', result);

        if (result.success) {
            showAlert('Check-out successful!', 'success');
            // Refresh status
            setTimeout(() => {
                loadTodayStatus();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Check Out';
            }, 2000);
        } else {
            showAlert(result.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Check Out';
        }
    } catch (error) {
        console.error('Check-out error:', error);
        showAlert('Check-out failed!', 'error');
        const btn = document.getElementById('checkOutBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Check Out';
        }
    }
}

async function loadTodayStatus() {
    try {
        const response = await fetch('/user/attendance/today-status');
        const result = await response.json();
        
        if (result.success) {
            updateUI(result.data);
        }
    } catch (error) {
        console.error('Status load error:', error);
    }
}

function updateUI(data) {
    const statusElement = document.getElementById('todayStatus');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    
    if (statusElement) {
        if (data.status === 'present' || data.status === 'late' || data.status === 'half-day') {
            statusElement.innerHTML = `<span class="badge bg-success">${data.status.toUpperCase()}</span>`;
            if (checkInBtn) checkInBtn.disabled = true;
            if (checkOutBtn && !data.checkOut) {
                checkOutBtn.disabled = false;
            } else if (checkOutBtn) {
                checkOutBtn.disabled = true;
            }
        } else {
            statusElement.innerHTML = '<span class="badge bg-warning">NOT MARKED</span>';
            if (checkInBtn) checkInBtn.disabled = false;
            if (checkOutBtn) checkOutBtn.disabled = true;
        }
    }
}

function showAlert(message, type) {
    // Simple alert system
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}