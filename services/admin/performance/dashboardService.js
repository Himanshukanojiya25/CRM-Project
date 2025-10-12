// Direct import karo models ko
const SalesDeal = require('../../../models/performance/SalesDeal');
const Revenue = require('../../../models/performance/Revenue');
const SalesActivity = require('../../../models/performance/SalesActivity');

class DashboardService {
  async getKPISummary(dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);
      
      // Temporary dummy data - baad mein database connect karenge
      const kpiData = {
        totalRevenue: 1250000,
        dealsWon: 15,
        totalActivities: 42,
        pipelineValue: 850000,
        conversionRate: 25.5,
        avgDealSize: 83000,
        dateRange: { startDate, endDate }
      };

      console.log('📈 KPI Data Generated:', kpiData);
      return kpiData;

    } catch (error) {
      console.error('❌ Dashboard service error:', error);
      // Fallback dummy data
      return {
        totalRevenue: 1250000,
        dealsWon: 15,
        totalActivities: 42,
        pipelineValue: 850000,
        conversionRate: 25.5,
        avgDealSize: 83000,
        dateRange: { startDate: new Date(), endDate: new Date() }
      };
    }
  }

  getDateRange(dateRange) {
    const endDate = new Date();
    const startDate = new Date();
    
    // Default to current month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
}

module.exports = new DashboardService();