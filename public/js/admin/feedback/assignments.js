// Advanced Feedback Assignment System
class FeedbackAssignments {
    constructor() {
        this.teamMembers = [];
        this.assignments = [];
        this.init();
    }

    init() {
        console.log('👥 Feedback Assignments Initialized');
        this.loadTeamData();
        this.loadAssignments();
        this.bindAssignmentEvents();
        this.initDragAndDrop();
    }

    loadTeamData() {
        // Simulate team data
        this.teamMembers = [
            {
                id: 1,
                name: 'Sarah Johnson',
                role: 'Support Specialist',
                initials: 'SJ',
                color: 'cyan',
                activeAssignments: 12,
                capacity: 15,
                performance: 94
            },
            {
                id: 2,
                name: 'Mike Chen',
                role: 'Technical Support',
                initials: 'MK',
                color: 'green',
                activeAssignments: 8,
                capacity: 12,
                performance: 88
            },
            {
                id: 3,
                name: 'Emily Parker',
                role: 'Customer Success',
                initials: 'EP',
                color: 'purple',
                activeAssignments: 15,
                capacity: 18,
                performance: 96
            },
            {
                id: 4,
                name: 'David Rodriguez',
                role: 'Support Lead',
                initials: 'DR',
                color: 'orange',
                activeAssignments: 6,
                capacity: 10,
                performance: 92
            }
        ];
    }

    loadAssignments() {
        // Simulate assignments data
        this.assignments = [
            {
                id: 1,
                feedbackId: 'FB-1247',
                title: 'Login page loading too slow',
                assignedTo: 1,
                dueDate: 'Today, 5:00 PM',
                status: 'in-progress',
                priority: 'high'
            },
            {
                id: 2,
                feedbackId: 'FB-1246',
                title: 'Feature request: Dark mode',
                assignedTo: 2,
                dueDate: 'Tomorrow, 10:00 AM',
                status: 'pending-review',
                priority: 'medium'
            },
            {
                id: 3,
                feedbackId: 'FB-1245',
                title: 'Payment gateway issue',
                assignedTo: 3,
                dueDate: 'Overdue',
                status: 'overdue',
                priority: 'urgent'
            }
        ];
    }

    bindAssignmentEvents() {
        // Assign feedback button
        const assignBtn = document.querySelector('button:has(.fa-user-plus)');
        if (assignBtn) {
            assignBtn.addEventListener('click', () => this.showBulkAssignmentModal());
        }

        // Team member clicks
        document.querySelectorAll('.flex.items-center.justify-between.p-3').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const memberName = card.querySelector('.text-white.font-medium').textContent;
                    this.showMemberDetails(memberName);
                }
            });
        });

        // Assignment action buttons
        this.bindAssignmentActions();
    }

    bindAssignmentActions() {
        // View assignment details
        document.querySelectorAll('button:has(.fa-eye)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = this.getAssignmentIdFromRow(e.target.closest('tr'));
                this.viewAssignmentDetails(assignmentId);
            });
        });

        // Edit assignment
        document.querySelectorAll('button:has(.fa-edit)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = this.getAssignmentIdFromRow(e.target.closest('tr'));
                this.editAssignment(assignmentId);
            });
        });
    }

    getAssignmentIdFromRow(row) {
        // Extract assignment ID from data attribute or row content
        const feedbackId = row.querySelector('p.text-gray-400')?.textContent.replace('#', '');
        return this.assignments.find(a => a.feedbackId === feedbackId)?.id;
    }

    showBulkAssignmentModal() {
        if (window.feedbackManager) {
            window.feedbackManager.showModal('Bulk Assign Feedback', this.getBulkAssignmentForm());
        }
    }

    getBulkAssignmentForm() {
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-gray-400 text-sm font-medium mb-2">Select Feedback Items</label>
                    <div class="max-h-48 overflow-y-auto space-y-2">
                        ${this.getFeedbackCheckboxes()}
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-400 text-sm font-medium mb-2">Assign To</label>
                        <select class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                            <option value="">Select Team Member</option>
                            ${this.teamMembers.map(member => 
                                `<option value="${member.id}">${member.name} (${member.activeAssignments}/${member.capacity})</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-gray-400 text-sm font-medium mb-2">Due Date</label>
                        <input type="datetime-local" class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                </div>
                
                <div>
                    <label class="block text-gray-400 text-sm font-medium mb-2">Priority</label>
                    <select class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button class="flex-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-white px-4 py-2.5 rounded-xl transition-all duration-300" onclick="feedbackManager.closeModal()">
                        Cancel
                    </button>
                    <button class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105" onclick="feedbackAssignments.processBulkAssignment()">
                        <i class="fas fa-user-plus mr-2"></i>Assign Selected
                    </button>
                </div>
            </div>
        `;
    }

    getFeedbackCheckboxes() {
        // Simulate feedback items for bulk assignment
        const feedbackItems = [
            { id: 1, title: 'Login page loading too slow', category: 'bug' },
            { id: 2, title: 'Feature request: Dark mode', category: 'feature' },
            { id: 3, title: 'Payment gateway issue', category: 'bug' },
            { id: 4, title: 'Mobile app crash on startup', category: 'bug' },
            { id: 5, title: 'Great customer service experience', category: 'positive' }
        ];

        return feedbackItems.map(item => `
            <label class="flex items-center space-x-3 p-2 hover:bg-gray-700/30 rounded-lg cursor-pointer">
                <input type="checkbox" class="rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-500/50" value="${item.id}">
                <div class="flex-1">
                    <p class="text-white text-sm">${item.title}</p>
                    <p class="text-gray-400 text-xs">#FB-${1000 + item.id}</p>
                </div>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${item.category === 'bug' ? 'red' : item.category === 'feature' ? 'blue' : 'green'}-500/20 text-${item.category === 'bug' ? 'red' : item.category === 'feature' ? 'blue' : 'green'}-400 border border-${item.category === 'bug' ? 'red' : item.category === 'feature' ? 'blue' : 'green'}-500/30">
                    ${item.category}
                </span>
            </label>
        `).join('');
    }

    processBulkAssignment() {
        this.showLoading('Assigning feedback...');
        
        // Simulate bulk assignment
        setTimeout(() => {
            this.hideLoading();
            if (window.feedbackManager) {
                window.feedbackManager.closeModal();
            }
            this.showNotification('Feedback assigned successfully to team members', 'success');
            this.refreshAssignmentsView();
        }, 2000);
    }

    showMemberDetails(memberName) {
        const member = this.teamMembers.find(m => m.name === memberName);
        if (member && window.feedbackManager) {
            window.feedbackManager.showModal(
                `Team Member: ${member.name}`,
                this.getMemberDetailsHTML(member)
            );
        }
    }

    getMemberDetailsHTML(member) {
        return `
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gradient-to-r from-${member.color}-500 to-${member.color}-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        ${member.initials}
                    </div>
                    <div>
                        <h4 class="text-white font-semibold text-lg">${member.name}</h4>
                        <p class="text-gray-400">${member.role}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-700/30 rounded-xl p-3 text-center">
                        <p class="text-${member.color}-400 text-sm">Active</p>
                        <p class="text-white font-bold text-xl">${member.activeAssignments}</p>
                    </div>
                    <div class="bg-gray-700/30 rounded-xl p-3 text-center">
                        <p class="text-${member.color}-400 text-sm">Capacity</p>
                        <p class="text-white font-bold text-xl">${member.capacity}</p>
                    </div>
                </div>
                
                <div>
                    <label class="block text-gray-400 text-sm font-medium mb-2">Performance Score</label>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-${member.color}-500 h-2 rounded-full" style="width: ${member.performance}%"></div>
                    </div>
                    <p class="text-${member.color}-400 text-sm text-center mt-1">${member.performance}% Success Rate</p>
                </div>
                
                <div class="pt-4 border-t border-gray-700/30">
                    <h5 class="text-white font-medium mb-2">Current Assignments</h5>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        ${this.getMemberAssignments(member.id)}
                    </div>
                </div>
            </div>
        `;
    }

    getMemberAssignments(memberId) {
        const memberAssignments = this.assignments.filter(a => a.assignedTo === memberId);
        
        if (memberAssignments.length === 0) {
            return '<p class="text-gray-400 text-sm text-center">No current assignments</p>';
        }

        return memberAssignments.map(assignment => `
            <div class="flex items-center justify-between p-2 bg-gray-700/20 rounded-lg">
                <div class="flex-1">
                    <p class="text-white text-sm truncate">${assignment.title}</p>
                    <p class="text-gray-400 text-xs">${assignment.feedbackId}</p>
                </div>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${assignment.status === 'overdue' ? 'red' : assignment.status === 'in-progress' ? 'orange' : 'blue'}-500/20 text-${assignment.status === 'overdue' ? 'red' : assignment.status === 'in-progress' ? 'orange' : 'blue'}-400">
                    ${assignment.status}
                </span>
            </div>
        `).join('');
    }

    viewAssignmentDetails(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (assignment) {
            // Navigate to feedback view page
            window.location.href = `/admin/feedback/${assignment.feedbackId.toLowerCase()}`;
        }
    }

    editAssignment(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (assignment && window.feedbackManager) {
            window.feedbackManager.showModal(
                'Edit Assignment',
                this.getAssignmentEditForm(assignment)
            );
        }
    }

    getAssignmentEditForm(assignment) {
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-gray-400 text-sm font-medium mb-2">Assigned To</label>
                    <select class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                        ${this.teamMembers.map(member => `
                            <option value="${member.id}" ${member.id === assignment.assignedTo ? 'selected' : ''}>
                                ${member.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-400 text-sm font-medium mb-2">Due Date</label>
                        <input type="datetime-local" class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" value="${this.formatDateForInput(assignment.dueDate)}">
                    </div>
                    
                    <div>
                        <label class="block text-gray-400 text-sm font-medium mb-2">Priority</label>
                        <select class="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                            <option value="low" ${assignment.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${assignment.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${assignment.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="urgent" ${assignment.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button class="flex-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-white px-4 py-2.5 rounded-xl transition-all duration-300" onclick="feedbackManager.closeModal()">
                        Cancel
                    </button>
                    <button class="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105" onclick="feedbackAssignments.saveAssignmentChanges(${assignment.id})">
                        <i class="fas fa-save mr-2"></i>Save Changes
                    </button>
                </div>
            </div>
        `;
    }

    formatDateForInput(dueDate) {
        // Simple date formatting for demo
        if (dueDate === 'Today, 5:00 PM') {
            const today = new Date();
            today.setHours(17, 0, 0, 0);
            return today.toISOString().slice(0, 16);
        }
        return '';
    }

    saveAssignmentChanges(assignmentId) {
        this.showLoading('Updating assignment...');
        
        setTimeout(() => {
            this.hideLoading();
            if (window.feedbackManager) {
                window.feedbackManager.closeModal();
            }
            this.showNotification('Assignment updated successfully', 'success');
            this.refreshAssignmentsView();
        }, 1000);
    }

    refreshAssignmentsView() {
        // Add visual feedback
        const table = document.querySelector('table');
        if (table) {
            table.style.opacity = '0.7';
            setTimeout(() => {
                table.style.opacity = '1';
                table.style.transition = 'opacity 0.3s ease';
            }, 300);
        }
    }

    initDragAndDrop() {
        // This would implement drag-and-drop functionality for assignments
        console.log('Drag and drop initialized for assignments');
    }

    showLoading(message) {
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

    // Advanced assignment algorithms
    autoAssignFeedback(feedbackItems) {
        // Implement intelligent auto-assignment logic
        return this.teamMembers
            .filter(member => member.activeAssignments < member.capacity)
            .sort((a, b) => a.activeAssignments - b.activeAssignments);
    }

    calculateWorkloadScore(member) {
        return (member.activeAssignments / member.capacity) * 100;
    }
}

// Initialize assignments system
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackAssignments = new FeedbackAssignments();
});