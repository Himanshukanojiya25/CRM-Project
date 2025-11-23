const dashboardService = require('../../../services/admin/performance/dashboardService');

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      console.log('🎯 Performance Dashboard Controller Called');
      
      const { startDate, endDate } = req.query;
      
      const kpiData = await dashboardService.getKPISummary({
        startDate, 
        endDate
      });

      // ✅ FORCE ADMIN LAYOUT FOR PERFORMANCE TAB
      res.render('admin/performance/dashboard', {
        title: 'Performance Dashboard',
        pageTitle: 'Performance Analytics - CRM Admin', 
        kpiData,
        user: req.user,
        currentUrl: '/admin/performance',
        layout: 'layouts/admin-base'  // ✅ YEH LINE CRITICAL HAI
      });
      
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      res.status(500).render('error', { 
        error: 'Dashboard load failed',
        layout: 'layouts/admin-base'
      });
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