const Attendance = require('../models/Attendance');
const moment = require('moment');

class AttendanceArchive {
    // Archive records older than 1 month
    static async archiveOldRecords() {
        try {
            const oneMonthAgo = moment().subtract(1, 'month').endOf('month');
            
            const result = await Attendance.updateMany(
                {
                    date: { $lte: oneMonthAgo.toDate() },
                    isArchived: false
                },
                {
                    $set: {
                        isArchived: true,
                        archivedAt: new Date()
                    }
                }
            );

            console.log(`Archived ${result.modifiedCount} attendance records`);
            return result.modifiedCount;
        } catch (error) {
            console.error('Archive error:', error);
            throw error;
        }
    }

    // Delete records older than 3 months
    static async cleanupOldRecords() {
        try {
            const threeMonthsAgo = moment().subtract(3, 'months').startOf('month');
            
            const result = await Attendance.deleteMany({
                date: { $lte: threeMonthsAgo.toDate() }
            });

            console.log(`Deleted ${result.deletedCount} old attendance records`);
            return result.deletedCount;
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        }
    }

    // Auto archive and cleanup (call this via cron job)
    static async autoArchiveAndCleanup() {
        try {
            const archived = await this.archiveOldRecords();
            const deleted = await this.cleanupOldRecords();
            
            return {
                archived,
                deleted,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Auto archive/cleanup failed:', error);
            throw error;
        }
    }
}

module.exports = AttendanceArchive;