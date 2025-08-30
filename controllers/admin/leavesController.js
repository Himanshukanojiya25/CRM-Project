const Leave = require('../../models/Leave');
const Employee = require('../../models/Employee'); // Make sure to use the correct model

// Function to fetch all pending leave requests and render the admin view
exports.getPendingLeaves = async (req, res) => {
    try {
        const pendingLeaves = await Leave.find({ status: 'pending' }).populate('employeeId');
        res.render('admin/leaves/list', {
            leaves: pendingLeaves,
            pageTitle: 'Pending Leave Requests'
        });
    } catch (error) {
        console.error('Error fetching pending leaves:', error);
        res.status(500).send('Server Error');
    }
};

// Function to approve a leave request (Now redirects instead of returning JSON)
exports.approveLeave = async (req, res) => {
    try {
        const leaveId = req.params.id;
        const leave = await Leave.findByIdAndUpdate(leaveId, { status: 'approved' }, { new: true });
        if (!leave) {
            return res.status(404).send('Leave request not found.');
        }
        res.redirect('/admin/leaves'); // Redirect back to the list of leaves
    } catch (error) {
        console.error('Error approving leave:', error);
        res.status(500).send('Server Error');
    }
};

// Function to reject a leave request (Now redirects instead of returning JSON)
exports.rejectLeave = async (req, res) => {
    try {
        const leaveId = req.params.id;
        const leave = await Leave.findByIdAndUpdate(leaveId, { status: 'rejected' }, { new: true });
        if (!leave) {
            return res.status(404).send('Leave request not found.');
        }
        res.redirect('/admin/leaves'); // Redirect back to the list of leaves
    } catch (error) {
        console.error('Error rejecting leave:', error);
        res.status(500).send('Server Error');
    }
};