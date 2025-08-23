// public/admin/js/employees.js

// Delete employee function
async function deleteEmployee(userId) {
  console.log('🖱️ Delete clicked for:', userId);
  
  if (confirm('Are you sure you want to delete this employee?')) {
    try {
      console.log('🚀 Sending DELETE request...');
      
      const response = await fetch(`/admin/employees/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // ✅ Cookies send karne ke liye
      });

      console.log('📨 Response status:', response.status);
      
      const result = await response.json();
      console.log('📦 Response data:', result);
      
      if (response.ok) {
        alert('✅ Employee deleted successfully!');
        location.reload();
      } else {
        alert('❌ Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('💥 Delete error:', error);
      alert('❌ Error deleting employee: ' + error.message);
    }
  }
}

// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Employee JS loaded'); // Debug
    
    const modal = document.getElementById('userModal');
    const addBtn = document.getElementById('addUserBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const userForm = document.getElementById('userForm');

    // Open modal
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'block';
        });
    }

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
            if (userForm) userForm.reset();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
            if (userForm) userForm.reset();
        });
    }

    // Close modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (modal) modal.style.display = 'none';
            if (userForm) userForm.reset();
        }
    });

    // Form submission
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted'); // Debug
            
            // ✅ CORRECTED FORM DATA - Password include karo
            const formData = {
                name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value, // ✅ Yeh add karo
                departmentName: document.getElementById('department').value,
                role: document.getElementById('role').value,
                status: document.getElementById('status').value,
                joiningDate: document.getElementById('joiningDate').value
            };

            try {
                const response = await fetch('/admin/employees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // ✅ Cookies ke liye
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    alert('Employee added successfully!');
                    if (modal) modal.style.display = 'none';
                    if (userForm) userForm.reset();
                    location.reload();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error adding employee: ' + error.message);
            }
        });
    }
});