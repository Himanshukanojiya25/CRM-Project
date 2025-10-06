// public/users/js/feedback.js - ADVANCED FEEDBACK SYSTEM
class FeedbackSystem {
    constructor() {
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.isAutoSaving = false;
        this.drafts = this.loadDrafts();
        this.currentDraftId = null;
        
        this.init();
    }

    init() {
        this.initRichTextEditor();
        this.initAutoSave();
        this.initTemplates();
        this.initFileUpload();
        this.initDraftsManagement();
        this.initFormValidation();
        this.updateDraftsCount();
    }

    // Rich Text Editor Functionality
    initRichTextEditor() {
        const editor = document.getElementById('richTextEditor');
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        const toolbar = document.getElementById('richTextToolbar');

        // Set initial placeholder
        if (!editor.innerHTML.trim()) {
            editor.innerHTML = '';
        }

        // Update character count
        editor.addEventListener('input', () => {
            const text = this.stripHtml(editor.innerHTML);
            charCount.textContent = text.length;
            messageInput.value = editor.innerHTML;
            
            // Auto-save trigger
            this.triggerAutoSave();
        });

        // Toolbar functionality
        toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('.toolbar-btn');
            if (!button) return;

            e.preventDefault();
            const command = button.dataset.command;
            const value = button.dataset.value;

            this.executeRichTextCommand(command, value, button);
        });

        // Handle paste events to clean HTML
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Load saved content
        this.loadEditorContent();
    }

    executeRichTextCommand(command, value, button) {
        const editor = document.getElementById('richTextEditor');
        
        try {
            switch (command) {
                case 'bold':
                case 'italic':
                case 'underline':
                case 'insertUnorderedList':
                case 'insertOrderedList':
                    document.execCommand(command, false, null);
                    break;
                
                case 'createLink':
                    const url = prompt('Enter URL:');
                    if (url) {
                        document.execCommand('createLink', false, url);
                    }
                    break;
                
                case 'insertImage':
                    const imageUrl = prompt('Enter image URL:');
                    if (imageUrl) {
                        document.execCommand('insertImage', false, imageUrl);
                    }
                    break;
                
                case 'formatBlock':
                    document.execCommand('formatBlock', false, value);
                    break;
                
                case 'insertHTML':
                    document.execCommand('insertHTML', false, value);
                    break;
            }
            
            editor.focus();
            this.triggerAutoSave();
        } catch (error) {
            console.error('Rich text command error:', error);
        }
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    loadEditorContent() {
        const savedDraft = localStorage.getItem('currentFeedbackDraft');
        if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            document.getElementById('richTextEditor').innerHTML = draft.message || '';
            document.getElementById('messageInput').value = draft.message || '';
            
            const text = this.stripHtml(draft.message || '');
            document.getElementById('charCount').textContent = text.length;
        }
    }

    // Auto-Save System
    initAutoSave() {
        // Start auto-save interval (every 30 seconds)
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000);

        // Save on form field changes
        const formFields = ['title', 'pageUrl', 'prioritySelect', 'isAnonymous', 'isPublic'];
        formFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', () => this.triggerAutoSave());
                element.addEventListener('change', () => this.triggerAutoSave());
            }
        });

        // Save on category change
        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', () => this.triggerAutoSave());
        });

        // Save on rating change
        document.querySelectorAll('input[name="rating"]').forEach(radio => {
            radio.addEventListener('change', () => this.triggerAutoSave());
        });
    }

    triggerAutoSave() {
        if (!this.isAutoSaving) {
            this.isAutoSaving = true;
            setTimeout(() => {
                this.autoSave();
                this.isAutoSaving = false;
            }, 1000);
        }
    }

    autoSave() {
        const formData = this.getFormData();
        
        // Don't save empty forms
        if (!formData.title && !formData.message) return;

        const draft = {
            ...formData,
            lastSaved: new Date().toISOString(),
            autoSaved: true
        };

        // Save to current draft
        localStorage.setItem('currentFeedbackDraft', JSON.stringify(draft));
        
        this.showAutoSaveIndicator();
        this.lastSaveTime = new Date();
    }

    showAutoSaveIndicator() {
        const indicator = document.getElementById('autoSaveIndicator');
        const text = document.getElementById('autoSaveText');
        const lastSaved = document.getElementById('lastSaved');
        
        if (indicator) {
            indicator.classList.remove('d-none');
            text.textContent = 'Auto-saved';
            lastSaved.textContent = 'Just now';
            
            setTimeout(() => {
                indicator.classList.add('d-none');
            }, 3000);
        }
    }

    // Template System
    initTemplates() {
        document.querySelectorAll('.template-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateType = e.target.closest('.template-btn').dataset.template;
                this.applyTemplate(templateType);
            });
        });
    }

    applyTemplate(templateType) {
        const templates = {
            bug: {
                title: "Bug Report: [Brief Description]",
                message: `<h3>🐛 Bug Report</h3>

<p><strong>Description:</strong> [Detailed description of the bug]</p>

<p><strong>Steps to Reproduce:</strong></p>
<ol>
  <li>Go to [page/feature]</li>
  <li>Click on [element]</li>
  <li>Observe the error</li>
</ol>

<p><strong>Expected Behavior:</strong> [What should happen]</p>

<p><strong>Actual Behavior:</strong> [What actually happens]</p>

<p><strong>Environment:</strong></p>
<ul>
  <li>Browser: [Browser and version]</li>
  <li>Device: [Device type]</li>
  <li>OS: [Operating system]</li>
</ul>`
            },
            feature: {
                title: "Feature Request: [Feature Name]",
                message: `<h3>💡 Feature Request</h3>

<p><strong>Feature Description:</strong> [Detailed description of the requested feature]</p>

<p><strong>Problem it Solves:</strong> [What problem will this feature solve?]</p>

<p><strong>Proposed Solution:</strong> [How should the feature work?]</p>

<p><strong>Benefits:</strong></p>
<ul>
  <li>[Benefit 1]</li>
  <li>[Benefit 2]</li>
  <li>[Benefit 3]</li>
</ul>

<p><strong>Additional Context:</strong> [Any other relevant information]</p>`
            },
            complaint: {
                title: "Complaint: [Issue Summary]",
                message: `<h3>⚠️ Complaint</h3>

<p><strong>Issue:</strong> [Clear description of the issue]</p>

<p><strong>Impact:</strong> [How this issue affects me/my work]</p>

<p><strong>Timeline:</strong> [When did this start happening?]</p>

<p><strong>Expected Resolution:</strong> [What would resolve this issue for you?]</p>

<p><strong>Contact Preference:</strong> [How would you like to be updated?]</p>`
            },
            suggestion: {
                title: "Suggestion: [Improvement Idea]",
                message: `<h3>👆 Suggestion</h3>

<p><strong>Current Situation:</strong> [Describe the current process/feature]</p>

<p><strong>Suggested Improvement:</strong> [Your suggestion for improvement]</p>

<p><strong>Reasoning:</strong> [Why this improvement would be beneficial]</p>

<p><strong>Implementation Ideas:</strong> [Any ideas on how this could be implemented]</p>

<p><strong>Potential Impact:</strong> [How this would improve the user experience]</p>`
            }
        };

        const template = templates[templateType];
        if (template) {
            document.getElementById('title').value = template.title;
            document.getElementById('richTextEditor').innerHTML = template.message;
            document.getElementById('messageInput').value = template.message;
            
            // Set appropriate category
            document.querySelector(`input[name="category"][value="${templateType}"]`).checked = true;
            
            // Update character count
            const text = this.stripHtml(template.message);
            document.getElementById('charCount').textContent = text.length;
            
            this.showTemplateAppliedMessage(templateType);
        }
    }

    showTemplateAppliedMessage(templateType) {
        // You can add a toast notification here
        console.log(`${templateType} template applied`);
    }

    // File Upload System
    initFileUpload() {
        // Screenshots upload
        const screenshotUpload = document.getElementById('screenshotUpload');
        const screenshotsInput = document.getElementById('screenshots');
        
        if (screenshotUpload && screenshotsInput) {
            screenshotUpload.addEventListener('click', () => screenshotsInput.click());
            screenshotsInput.addEventListener('change', (e) => this.handleFileSelect(e, 'screenshotPreview'));
            this.initDragAndDrop(screenshotUpload, screenshotsInput, 'screenshotPreview');
        }

        // Attachments upload
        const attachmentUpload = document.getElementById('attachmentUpload');
        const attachmentsInput = document.getElementById('attachments');
        
        if (attachmentUpload && attachmentsInput) {
            attachmentUpload.addEventListener('click', () => attachmentsInput.click());
            attachmentsInput.addEventListener('change', (e) => this.handleFileSelect(e, 'attachmentPreview'));
            this.initDragAndDrop(attachmentUpload, attachmentsInput, 'attachmentPreview');
        }
    }

    handleFileSelect(event, previewId) {
        const files = event.target.files;
        const preview = document.getElementById(previewId);
        preview.innerHTML = '';
        
        if (files.length > 0) {
            const fileList = document.createElement('div');
            fileList.className = 'file-list';
            
            Array.from(files).forEach((file, index) => {
                const fileItem = this.createFilePreviewItem(file, index, event.target.id, previewId);
                fileList.appendChild(fileItem);
            });
            
            preview.appendChild(fileList);
            
            // Update upload area text
            const uploadArea = event.target.parentElement;
            uploadArea.querySelector('h5').textContent = `${files.length} file(s) selected`;
            uploadArea.classList.add('has-files');
        }
    }

    createFilePreviewItem(file, index, inputId, previewId) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';
        
        let icon = 'fa-file';
        if (file.type.startsWith('image/')) {
            icon = 'fa-file-image';
        } else if (file.type.includes('pdf')) {
            icon = 'fa-file-pdf';
        } else if (file.type.includes('word') || file.type.includes('document')) {
            icon = 'fa-file-word';
        } else if (file.type.includes('zip') || file.type.includes('rar')) {
            icon = 'fa-file-archive';
        }
        
        fileItem.innerHTML = `
            <i class="fas ${icon} text-primary"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="btn-remove-file" data-index="${index}" data-input="${inputId}" data-preview="${previewId}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add remove event listener
        const removeBtn = fileItem.querySelector('.btn-remove-file');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(index, inputId, previewId);
        });
        
        return fileItem;
    }

    removeFile(index, inputId, previewId) {
        const input = document.getElementById(inputId);
        const files = Array.from(input.files);
        files.splice(index, 1);
        
        // Create new FileList
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        input.files = dt.files;
        
        // Update preview
        this.handleFileSelect({ target: input }, previewId);
    }

    initDragAndDrop(uploadArea, input, previewId) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            input.files = e.dataTransfer.files;
            this.handleFileSelect({ target: input }, previewId);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Drafts Management System
    initDraftsManagement() {
        // View Drafts button
        const viewDraftsBtn = document.getElementById('viewDraftsBtn');
        if (viewDraftsBtn) {
            viewDraftsBtn.addEventListener('click', () => this.showDraftsModal());
        }

        // Save Draft button
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewFeedback());
        }
    }

    saveDraft() {
        const formData = this.getFormData();
        
        // Validate required fields
        if (!formData.title && !formData.message) {
            alert('Please add at least a title or message to save as draft.');
            return;
        }

        const draftId = this.currentDraftId || 'draft_' + Date.now();
        const draft = {
            id: draftId,
            ...formData,
            savedAt: new Date().toISOString(),
            title: formData.title || 'Untitled Draft',
            isManualSave: true
        };

        // Remove auto-saved draft
        localStorage.removeItem('currentFeedbackDraft');

        // Save to drafts list
        this.saveDraftToList(draft);
        
        this.showDraftSavedMessage();
        this.updateDraftsCount();
        this.currentDraftId = null;
    }

    saveDraftToList(draft) {
        // Remove existing draft with same ID
        this.drafts = this.drafts.filter(d => d.id !== draft.id);
        
        // Add new draft
        this.drafts.unshift(draft);
        
        // Keep only last 10 drafts
        if (this.drafts.length > 10) {
            this.drafts = this.drafts.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('feedbackDrafts', JSON.stringify(this.drafts));
    }

    loadDrafts() {
        try {
            const drafts = localStorage.getItem('feedbackDrafts');
            return drafts ? JSON.parse(drafts) : [];
        } catch (error) {
            console.error('Error loading drafts:', error);
            return [];
        }
    }

    showDraftsModal() {
        this.loadDraftsIntoModal();
        const modal = new bootstrap.Modal(document.getElementById('draftsModal'));
        modal.show();
    }

    loadDraftsIntoModal() {
        const draftsList = document.getElementById('draftsList');
        
        if (this.drafts.length === 0) {
            draftsList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-save fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No drafts saved yet.</p>
                </div>
            `;
            return;
        }

        draftsList.innerHTML = this.drafts.map(draft => `
            <div class="draft-item" data-draft-id="${draft.id}">
                <div class="draft-title">${this.escapeHtml(draft.title)}</div>
                <div class="draft-preview">${this.getDraftPreview(draft.message)}</div>
                <div class="draft-meta">
                    <i class="fas fa-calendar me-1"></i>
                    ${new Date(draft.savedAt).toLocaleDateString()} at 
                    ${new Date(draft.savedAt).toLocaleTimeString()}
                    ${draft.autoSaved ? ' (Auto-saved)' : ''}
                </div>
                <div class="draft-actions">
                    <button class="btn btn-primary btn-sm load-draft" data-draft-id="${draft.id}">
                        <i class="fas fa-edit me-1"></i>Load
                    </button>
                    <button class="btn btn-outline-primary btn-sm submit-draft" data-draft-id="${draft.id}">
                        <i class="fas fa-paper-plane me-1"></i>Submit
                    </button>
                    <button class="btn btn-outline-danger btn-sm delete-draft" data-draft-id="${draft.id}">
                        <i class="fas fa-trash me-1"></i>Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to draft actions
        draftsList.querySelectorAll('.load-draft').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const draftId = e.target.closest('.load-draft').dataset.draftId;
                this.loadDraft(draftId);
                bootstrap.Modal.getInstance(document.getElementById('draftsModal')).hide();
            });
        });

        draftsList.querySelectorAll('.submit-draft').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const draftId = e.target.closest('.submit-draft').dataset.draftId;
                this.submitDraft(draftId);
            });
        });

        draftsList.querySelectorAll('.delete-draft').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const draftId = e.target.closest('.delete-draft').dataset.draftId;
                this.deleteDraft(draftId);
            });
        });
    }

    loadDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (draft) {
            // Populate form fields
            document.getElementById('title').value = draft.title || '';
            document.getElementById('richTextEditor').innerHTML = draft.message || '';
            document.getElementById('messageInput').value = draft.message || '';
            document.getElementById('pageUrl').value = draft.pageUrl || '';
            document.getElementById('prioritySelect').value = draft.priority || 'medium';
            document.getElementById('isAnonymous').checked = draft.isAnonymous || false;
            document.getElementById('isPublic').checked = draft.isPublic || false;

            // Set category
            if (draft.category) {
                document.querySelector(`input[name="category"][value="${draft.category}"]`).checked = true;
            }

            // Set rating
            if (draft.rating) {
                document.querySelector(`input[name="rating"][value="${draft.rating}"]`).checked = true;
            }

            // Update character count
            const text = this.stripHtml(draft.message || '');
            document.getElementById('charCount').textContent = text.length;

            this.currentDraftId = draftId;
            this.showDraftLoadedMessage();
        }
    }

    submitDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (draft && confirm('Are you sure you want to submit this draft?')) {
            this.loadDraft(draftId);
            this.deleteDraft(draftId);
            document.getElementById('feedbackForm').submit();
        }
    }

    deleteDraft(draftId) {
        if (confirm('Are you sure you want to delete this draft?')) {
            this.drafts = this.drafts.filter(d => d.id !== draftId);
            localStorage.setItem('feedbackDrafts', JSON.stringify(this.drafts));
            this.loadDraftsIntoModal();
            this.updateDraftsCount();
            
            if (this.currentDraftId === draftId) {
                this.currentDraftId = null;
            }
        }
    }

    getDraftPreview(message) {
        if (!message) return 'No content';
        const text = this.stripHtml(message);
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    updateDraftsCount() {
        const draftsCount = document.getElementById('draftsCount');
        if (draftsCount) {
            draftsCount.textContent = this.drafts.length;
        }
    }

    showDraftSavedMessage() {
        const saveBtn = document.getElementById('saveDraftBtn');
        const originalText = saveBtn.innerHTML;
        
        saveBtn.innerHTML = '<i class="fas fa-check me-2"></i>Draft Saved!';
        saveBtn.classList.remove('btn-outline-secondary');
        saveBtn.classList.add('btn-success');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-outline-secondary');
        }, 2000);
    }

    showDraftLoadedMessage() {
        // You can add a toast notification here
        console.log('Draft loaded successfully');
    }

    // Form Validation and Submission
    initFormValidation() {
        const form = document.getElementById('feedbackForm');
        if (form) {
            form.addEventListener('submit', (e) => this.validateAndSubmit(e));
        }
    }

    validateAndSubmit(e) {
        const title = document.getElementById('title').value.trim();
        const message = document.getElementById('richTextEditor').innerHTML.trim();

        if (!title) {
            e.preventDefault();
            alert('Please enter a feedback title');
            document.getElementById('title').focus();
            return;
        }

        if (!message || message === '<br>' || this.stripHtml(message).trim() === '') {
            e.preventDefault();
            alert('Please enter a feedback message');
            document.getElementById('richTextEditor').focus();
            return;
        }

        // Clear current draft and auto-save
        localStorage.removeItem('currentFeedbackDraft');
        clearInterval(this.autoSaveInterval);

        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
        submitBtn.disabled = true;
    }

    previewFeedback() {
        const formData = this.getFormData();
        
        if (!formData.title && !formData.message) {
            alert('Please add some content to preview.');
            return;
        }

        // Open preview in new tab or show modal
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(this.generatePreviewHtml(formData));
        previewWindow.document.close();
    }

    generatePreviewHtml(formData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Feedback Preview</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                .preview-header { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                .preview-content { background: white; padding: 20px; border-radius: 10px; border: 1px solid #dee2e6; }
                .preview-meta { color: #6c757d; font-size: 0.9em; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="preview-header">
                <h1>Feedback Preview</h1>
                <p>This is how your feedback will appear to the admin team.</p>
            </div>
            
            <div class="preview-content">
                <div class="preview-meta">
                    <strong>Category:</strong> ${formData.category} | 
                    <strong>Priority:</strong> ${formData.priority} |
                    <strong>Rating:</strong> ${formData.rating || 'Not rated'}
                </div>
                
                <h2>${this.escapeHtml(formData.title)}</h2>
                <div>${formData.message}</div>
                
                ${formData.pageUrl ? `<p><strong>Page URL:</strong> ${this.escapeHtml(formData.pageUrl)}</p>` : ''}
                
                <div class="preview-meta" style="margin-top: 20px;">
                    <strong>Privacy:</strong> 
                    ${formData.isAnonymous ? 'Anonymous' : 'Visible with name'} | 
                    ${formData.isPublic ? 'Public' : 'Private'}
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Utility Methods
    getFormData() {
        return {
            title: document.getElementById('title').value,
            message: document.getElementById('richTextEditor').innerHTML,
            category: document.querySelector('input[name="category"]:checked')?.value || 'general',
            priority: document.getElementById('prioritySelect').value,
            rating: document.querySelector('input[name="rating"]:checked')?.value || null,
            pageUrl: document.getElementById('pageUrl').value,
            isAnonymous: document.getElementById('isAnonymous').checked,
            isPublic: document.getElementById('isPublic').checked
        };
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Initialize the feedback system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.feedbackSystem = new FeedbackSystem();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (window.feedbackSystem) {
            window.feedbackSystem.destroy();
        }
    });
});

// Global functions for backward compatibility
function handleFileSelect(input, previewId) {
    if (window.feedbackSystem) {
        window.feedbackSystem.handleFileSelect({ target: input }, previewId);
    }
}

function removeFile(index, inputId, previewId) {
    if (window.feedbackSystem) {
        window.feedbackSystem.removeFile(index, inputId, previewId);
    }
}

function formatFileSize(bytes) {
    if (window.feedbackSystem) {
        return window.feedbackSystem.formatFileSize(bytes);
    }
    return '0 Bytes';
}