const dashboardService = require('../../../services/admin/performance/dashboardService');

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      console.log('🎯 Dashboard Controller Called');
      
      const { startDate, endDate } = req.query;
      
      const kpiData = await dashboardService.getKPISummary({
        startDate, 
        endDate
      });

      console.log('📊 KPI Data Ready:', kpiData);

      res.render('admin/performance/dashboard', {
        title: 'Performance Dashboard',
        kpiData,
        user: req.user
      });
      
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      res.status(500).render('error', { error: 'Dashboard load failed' });
    }
  },

  getKPIData: async (req, res) => {
    try {
      const kpiData = await dashboardService.getKPISummary(req.query);
      res.json(kpiData);
    } catch (error) {
      res.status(500).json({ error: 'KPI data fetch failed' });
    }
  }
};

module.exports = dashboardController;