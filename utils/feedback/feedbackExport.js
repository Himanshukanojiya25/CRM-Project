const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Feedback = require('../../models/feedback/Feedback');
const FeedbackAnalytics = require('../../models/feedback/FeedbackAnalytics');

class FeedbackExport {
    
    // Export feedbacks to Excel
    async exportToExcel(feedbacks, options = {}) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Feedbacks');

            // Add company header
            worksheet.mergeCells('A1:H1');
            worksheet.getCell('A1').value = 'CRM System - Feedback Report';
            worksheet.getCell('A1').font = { size: 16, bold: true };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            // Add report date
            worksheet.mergeCells('A2:H2');
            worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString()}`;
            worksheet.getCell('A2').alignment = { horizontal: 'center' };

            // Define columns
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Subject', key: 'subject', width: 30 },
                { header: 'User', key: 'user', width: 20 },
                { header: 'Rating', key: 'rating', width: 10 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Priority', key: 'priority', width: 12 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created Date', key: 'createdAt', width: 15 },
                { header: 'Assigned To', key: 'assignedTo', width: 20 },
                { header: 'Response Time (hrs)', key: 'responseTime', width: 18 }
            ];

            // Add header style
            worksheet.getRow(4).font = { bold: true };
            worksheet.getRow(4).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6FA' }
            };

            // Add data rows
            feedbacks.forEach((feedback, index) => {
                const row = worksheet.addRow({
                    id: feedback._id.toString().substring(0, 8),
                    subject: feedback.subject,
                    user: feedback.user?.name || 'N/A',
                    rating: feedback.rating,
                    category: this.formatCategory(feedback.category),
                    priority: this.formatPriority(feedback.priority),
                    status: this.formatStatus(feedback.status),
                    createdAt: new Date(feedback.createdAt).toLocaleDateString(),
                    assignedTo: feedback.assignedTo?.name || 'Unassigned',
                    responseTime: feedback.responseTime ? feedback.responseTime.toFixed(2) : 'N/A'
                });

                // Add conditional formatting for priority
                const priorityCell = row.getCell('priority');
                this.applyPriorityStyle(priorityCell, feedback.priority);

                // Add conditional formatting for rating
                const ratingCell = row.getCell('rating');
                this.applyRatingStyle(ratingCell, feedback.rating);
            });

            // Add summary section
            const summaryRow = worksheet.addRow([]);
            worksheet.addRow(['Summary', '', '', '', '', '', '', '', '', '']);
            
            const stats = this.calculateExportStats(feedbacks);
            worksheet.addRow(['Total Feedbacks', stats.total, '', '', '', '', '', '', '', '']);
            worksheet.addRow(['Average Rating', stats.avgRating, '', '', '', '', '', '', '', '']);
            worksheet.addRow(['Resolved', stats.resolved, '', '', '', '', '', '', '', '']);
            worksheet.addRow(['Pending', stats.pending, '', '', '', '', '', '', '', '']);

            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            throw new Error(`Excel export failed: ${error.message}`);
        }
    }

    // Export feedbacks to PDF
    async exportToPDF(feedbacks, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Add header
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .text('CRM System - Feedback Report', 50, 50)
                   .moveDown(0.5);

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 90)
                   .moveDown(1);

                // Add summary
                const stats = this.calculateExportStats(feedbacks);
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Summary', 50, 130)
                   .moveDown(0.5);

                doc.fontSize(10)
                   .font('Helvetica')
                   .text(`Total Feedbacks: ${stats.total}`, 70, 160)
                   .text(`Average Rating: ${stats.avgRating}`, 70, 175)
                   .text(`Resolved: ${stats.resolved}`, 70, 190)
                   .text(`Pending: ${stats.pending}`, 70, 205)
                   .moveDown(2);

                // Add table header
                let yPosition = 250;
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('ID', 50, yPosition)
                   .text('Subject', 100, yPosition)
                   .text('Rating', 300, yPosition)
                   .text('Status', 350, yPosition)
                   .text('Date', 420, yPosition);

                // Add table rows
                yPosition += 20;
                feedbacks.forEach((feedback, index) => {
                    if (yPosition > 700) { // New page if needed
                        doc.addPage();
                        yPosition = 50;
                    }

                    doc.fontSize(8)
                       .font('Helvetica')
                       .text(feedback._id.toString().substring(0, 8), 50, yPosition)
                       .text(feedback.subject.substring(0, 40), 100, yPosition)
                       .text(feedback.rating.toString(), 300, yPosition)
                       .text(this.formatStatus(feedback.status), 350, yPosition)
                       .text(new Date(feedback.createdAt).toLocaleDateString(), 420, yPosition);

                    yPosition += 15;
                });

                doc.end();
            } catch (error) {
                reject(new Error(`PDF export failed: ${error.message}`));
            }
        });
    }

    // Export analytics to Excel
    async exportAnalyticsToExcel(analyticsData, options = {}) {
        try {
            const workbook = new ExcelJS.Workbook();
            
            // Overview sheet
            const overviewSheet = workbook.addWorksheet('Overview');
            this.addAnalyticsOverview(overviewSheet, analyticsData);

            // Trends sheet
            const trendsSheet = workbook.addWorksheet('Trends');
            this.addTrendsData(trendsSheet, analyticsData.trends);

            // Team Performance sheet
            const teamSheet = workbook.addWorksheet('Team Performance');
            this.addTeamPerformance(teamSheet, analyticsData.team);

            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            throw new Error(`Analytics export failed: ${error.message}`);
        }
    }

    // Export to CSV
    async exportToCSV(feedbacks, options = {}) {
        try {
            const headers = ['ID', 'Subject', 'User', 'Rating', 'Category', 'Priority', 'Status', 'Created Date', 'Assigned To', 'Response Time'];
            let csvContent = headers.join(',') + '\n';

            feedbacks.forEach(feedback => {
                const row = [
                    feedback._id.toString().substring(0, 8),
                    `"${feedback.subject.replace(/"/g, '""')}"`,
                    `"${(feedback.user?.name || 'N/A').replace(/"/g, '""')}"`,
                    feedback.rating,
                    this.formatCategory(feedback.category),
                    this.formatPriority(feedback.priority),
                    this.formatStatus(feedback.status),
                    new Date(feedback.createdAt).toLocaleDateString(),
                    `"${(feedback.assignedTo?.name || 'Unassigned').replace(/"/g, '""')}"`,
                    feedback.responseTime ? feedback.responseTime.toFixed(2) : 'N/A'
                ];
                csvContent += row.join(',') + '\n';
            });

            return Buffer.from(csvContent, 'utf-8');
        } catch (error) {
            throw new Error(`CSV export failed: ${error.message}`);
        }
    }

    // Helper methods
    calculateExportStats(feedbacks) {
        const total = feedbacks.length;
        const ratings = feedbacks.map(f => f.rating).filter(r => r);
        const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0;
        const resolved = feedbacks.filter(f => ['resolved', 'closed'].includes(f.status)).length;
        const pending = total - resolved;

        return { total, avgRating, resolved, pending };
    }

    formatCategory(category) {
        const categories = {
            bug: 'Bug Report',
            feature_request: 'Feature Request',
            complaint: 'Complaint',
            appreciation: 'Appreciation',
            general: 'General'
        };
        return categories[category] || category;
    }

    formatPriority(priority) {
        const priorities = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical'
        };
        return priorities[priority] || priority;
    }

    formatStatus(status) {
        const statuses = {
            new: 'New',
            acknowledged: 'Acknowledged',
            in_progress: 'In Progress',
            resolved: 'Resolved',
            closed: 'Closed'
        };
        return statuses[status] || status;
    }

    applyPriorityStyle(cell, priority) {
        const colors = {
            low: 'FF90EE90', // Light Green
            medium: 'FFFFFF00', // Yellow
            high: 'FFFFA500', // Orange
            critical: 'FFFF0000' // Red
        };
        
        if (colors[priority]) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: colors[priority] }
            };
        }
    }

    applyRatingStyle(cell, rating) {
        if (rating <= 2) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFB6C1' } // Light Red
            };
        } else if (rating >= 4) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF90EE90' } // Light Green
            };
        }
    }

    addAnalyticsOverview(sheet, analyticsData) {
        sheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 15 }
        ];

        sheet.addRow({ metric: 'Total Feedbacks', value: analyticsData.overview.total });
        sheet.addRow({ metric: 'Average Rating', value: analyticsData.overview.avgRating });
        sheet.addRow({ metric: 'Average Response Time (hrs)', value: analyticsData.overview.avgResponseTime });
        sheet.addRow({ metric: 'Average Resolution Time (hrs)', value: analyticsData.overview.avgResolutionTime });
        sheet.addRow({ metric: 'SLA Breaches', value: analyticsData.overview.slaBreaches });
    }

    addTrendsData(sheet, trends) {
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Total', key: 'total', width: 10 },
            { header: 'New', key: 'new', width: 10 },
            { header: 'In Progress', key: 'inProgress', width: 12 },
            { header: 'Resolved', key: 'resolved', width: 12 }
        ];

        trends.forEach(trend => {
            const statusCounts = {};
            trend.statuses.forEach(status => {
                statusCounts[status.status] = status.count;
            });

            sheet.addRow({
                date: trend._id,
                total: trend.total,
                new: statusCounts['new'] || 0,
                inProgress: statusCounts['in_progress'] || 0,
                resolved: (statusCounts['resolved'] || 0) + (statusCounts['closed'] || 0)
            });
        });
    }

    addTeamPerformance(sheet, teamData) {
        sheet.columns = [
            { header: 'Admin', key: 'admin', width: 20 },
            { header: 'Total Assigned', key: 'totalAssigned', width: 15 },
            { header: 'Completed', key: 'completed', width: 12 },
            { header: 'Completion Rate %', key: 'completionRate', width: 18 },
            { header: 'Avg. Completion Time (hrs)', key: 'avgCompletionTime', width: 22 }
        ];

        teamData.forEach(admin => {
            sheet.addRow({
                admin: admin.adminName,
                totalAssigned: admin.totalAssigned,
                completed: admin.resolved,
                completionRate: admin.resolutionRate,
                avgCompletionTime: admin.avgResolutionTime
            });
        });
    }
}

module.exports = new FeedbackExport();