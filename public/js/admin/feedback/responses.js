// Advanced Response Management System
class FeedbackResponses {
    constructor() {
        this.currentFeedback = null;
        this.templates = [];
        this.init();
    }

    init() {
        console.log('💬 Feedback Responses Initialized');
        this.loadTemplates();
        this.bindResponseEvents();
        this.initResponseEditor();
        this.setupAutoSave();
    }

    loadTemplates() {
        // Simulate template loading
        this.templates = [
            {
                id: 1,
                name: 'Bug Acknowledgment',
                content: 'Thank you for reporting this issue. We have identified the problem and our team is working on a fix.',
                category: 'bug'
            },
            {
                id: 2,
                name: 'Feature Request',
                content: 'We appreciate your feature suggestion! Our product team will review this for future updates.',
                category: 'feature'
            },
            {
                id: 3,
                name: 'Positive Feedback',
                content: 'Thank you for your kind words! We are thrilled to hear you are enjoying our product.',
                category: 'positive'
            }
        ];
    }

    bindResponseEvents() {
        // Template buttons
        document.querySelectorAll('button:has(.fa-file-alt)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateName = e.target.closest('button').textContent.trim();
                this.applyTemplate(templateName);
            });
        });

        // Attachment handling
        const attachBtn = document.querySelector('button:has(.fa-paperclip)');
        if (attachBtn) {
            attachBtn.addEventListener('click', () => this.handleAttachment());
        }

        // Response form submission
        const responseForm = document.querySelector('form');
        if (responseForm) {
            responseForm.addEventListener('submit', (e) => this.handleResponseSubmit(e));
        }

        // Quick action buttons
        this.bindQuickActions();
    }

    initResponseEditor() {
        // Initialize rich text editor functionality
        const toolbarButtons = document.querySelectorAll('button:has(.fa-bold), button:has(.fa-italic), button:has(.fa-underline)');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.formatText(e));
        });

        // Auto-expand textarea
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', this.autoResizeTextarea);
        }
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    applyTemplate(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (template) {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value = template.content;
                this.autoResizeTextarea({ target: textarea });
                this.showNotification(`Template "${templateName}" applied`, 'success');
            }
        }
    }

    handleAttachment() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '.pdf,.doc,.docx,.jpg,.png,.txt';
        
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.uploadAttachments(files);
        };
        
        fileInput.click();
    }

    uploadAttachments(files) {
        this.showLoading('Uploading attachments...');
        
        // Simulate file upload
        setTimeout(() => {
            this.hideLoading();
            files.forEach(file => {
                this.showNotification(`"${file.name}" uploaded successfully`, 'success');
            });
            
            // Add to attachments list
            this.updateAttachmentsList(files);
        }, 1500);
    }

    updateAttachmentsList(files) {
        const attachmentList = document.createElement('div');
        attachmentList.className = 'mt-4 space-y-2';
        
        files.forEach(file => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between bg-gray-700/30 rounded-lg p-3';
            attachmentItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <i class="fas fa-paperclip text-cyan-400"></i>
                    <div>
                        <p class="text-white text-sm">${file.name}</p>
                        <p class="text-gray-400 text-xs">${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button class="text-red-400 hover:text-red-300 transition-colors duration-300">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add remove functionality
            attachmentItem.querySelector('button').addEventListener('click', () => {
                attachmentItem.remove();
            });
            
            attachmentList.appendChild(attachmentItem);
        });

        // Add to form
        const form = document.querySelector('form');
        const existingList = form.querySelector('.mt-4.space-y-2');
        if (existingList) {
            existingList.remove();
        }
        form.insertBefore(attachmentList, form.querySelector('.flex.justify-between'));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleResponseSubmit(e) {
        e.preventDefault();
        
        const formData = {
            subject: document.querySelector('input[type="text"]')?.value,
            response: document.querySelector('textarea')?.value,
            status: document.querySelector('select')?.value,
            assignee: document.querySelectorAll('select')[1]?.value,
            sendEmail: document.querySelector('input[type="checkbox"]')?.checked,
            timestamp: new Date().toISOString()
        };

        this.sendResponse(formData);
    }

    sendResponse(formData) {
        this.showLoading('Sending response...');
        
        // Simulate API call
        setTimeout(() => {
            this.hideLoading();
            this.showNotification('Response sent successfully!', 'success');
            
            // Update UI
            this.addResponseToTimeline(formData);
            this.clearResponseForm();
            
            // Show success animation
            this.animateSuccess();
        }, 2000);
    }

    addResponseToTimeline(formData) {
        const timeline = document.querySelector('.space-y-4');
        if (timeline) {
            const responseItem = document.createElement('div');
            responseItem.className = 'bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 animate-fade-in';
            responseItem.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            You
                        </div>
                        <span class="text-white font-medium">Your Response</span>
                    </div>
                    <span class="text-gray-400 text-sm">Just now</span>
                </div>
                <p class="text-gray-300">${formData.response}</p>
                ${formData.sendEmail ? '<p class="text-cyan-400 text-xs mt-2"><i class="fas fa-envelope mr-1"></i>Email sent to customer</p>' : ''}
            `;
            
            timeline.appendChild(responseItem);
            
            // Scroll to new response
            responseItem.scrollIntoView({ behavior: 'smooth' });
        }
    }

    clearResponseForm() {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.value = '';
            textarea.style.height = 'auto';
        }
    }

    animateSuccess() {
        const form = document.querySelector('form');
        form.style.transform = 'scale(0.98)';
        form.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            form.style.transform = 'scale(1)';
        }, 300);
    }

    bindQuickActions() {
        // Mark as resolved
        const resolveBtn = document.querySelector('button:has(.fa-check-circle)');
        if (resolveBtn) {
            resolveBtn.addEventListener('click', () => this.markAsResolved());
        }

        // Assign to team
        const assignBtn = document.querySelector('button:has(.fa-user)');
        if (assignBtn) {
            assignBtn.addEventListener('click', () => this.showAssignmentModal());
        }

        // Change category
        const categoryBtn = document.querySelector('button:has(.fa-tags)');
        if (categoryBtn) {
            categoryBtn.addEventListener('click', () => this.showCategoryModal());
        }

        // Archive feedback
        const archiveBtn = document.querySelector('button:has(.fa-archive)');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => this.archiveFeedback());
        }
    }

    markAsResolved() {
        this.showLoading('Updating status...');
        
        setTimeout(() => {
            this.hideLoading();
            this.showNotification('Feedback marked as resolved', 'success');
            
            // Update status badge
            const statusBadge = document.querySelector('.bg-orange-500\\/20');
            if (statusBadge) {
                statusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30';
                statusBadge.innerHTML = '<i class="fas fa-check mr-1"></i>Resolved';
            }
        }, 1000);
    }

    showAssignmentModal() {
        if (window.feedbackManager) {
            window.feedbackManager.showModal('Assign to Team', `
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 text-sm font-medium mb-2">Select Team Member</label>
                        <select class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                            <option value="">Select...</option>
                            <option value="sarah">Sarah Johnson</option>
                            <option value="mike">Mike Chen</option>
                            <option value="emily">Emily Parker</option>
                            <option value="david">David Rodriguez</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-400 text-sm font-medium mb-2">Due Date</label>
                        <input type="datetime-local" class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div class="flex space-x-3">
                        <button class="flex-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-white px-4 py-2.5 rounded-xl transition-all duration-300" onclick="feedbackManager.closeModal()">Cancel</button>
                        <button class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105" onclick="feedbackResponses.assignToTeam()">Assign</button>
                    </div>
                </div>
            `);
        }
    }

    assignToTeam() {
        this.showLoading('Assigning feedback...');
        
        setTimeout(() => {
            this.hideLoading();
            if (window.feedbackManager) {
                window.feedbackManager.closeModal();
            }
            this.showNotification('Feedback assigned successfully', 'success');
        }, 1000);
    }

    showCategoryModal() {
        // Similar to assignment modal
        this.showNotification('Category change modal would open here', 'info');
    }

    archiveFeedback() {
        if (confirm('Are you sure you want to archive this feedback?')) {
            this.showLoading('Archiving feedback...');
            
            setTimeout(() => {
                this.hideLoading();
                this.showNotification('Feedback archived successfully', 'success');
                // Redirect to list page
                setTimeout(() => {
                    window.location.href = '/admin/feedback';
                }, 1000);
            }, 1000);
        }
    }

    setupAutoSave() {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            let timeout;
            textarea.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.autoSaveDraft();
                }, 2000);
            });
        }
    }

    autoSaveDraft() {
        const textarea = document.querySelector('textarea');
        if (textarea && textarea.value.trim()) {
            console.log('Auto-saving draft...');
            // In real implementation, save to localStorage or send to backend
        }
    }

    showLoading(message = 'Processing...') {
        if (window.feedbackManager) {
            window.feedbackManager.showLoading();
        }
    }

    hideLoading() {
        if (window.feedbackManager) {
            window.feedbackManager.hideLoading();
        }
    }

    showNotification(message, type) {
        if (window.feedbackManager) {
            window.feedbackManager.showNotification(message, type);
        }
    }
}

// Initialize response system
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackResponses = new FeedbackResponses();
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fade-in {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-fade-in {
            animation: fade-in 0.5s ease;
        }
    `;
    document.head.appendChild(style);
});