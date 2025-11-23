const express = require('express');
const router = express.Router();

// Temporary simple controller
const departmentController = {
  // ✅ NEW: EJS PAGE RENDER
  renderDepartmentPage: async (req, res) => {
    try {
      res.render('admin/department/list', { 
        pageTitle: 'Department Management'
      });
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).render('error', { message: 'Page load failed' });
    }
  },

  getAllDepartments: async (req, res) => {
    try {
      const Department = require('../../models/Department');
      const departments = await Department.find().populate('manager').populate('parentDepartment');
      res.json({ success: true, data: departments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDepartmentById: async (req, res) => {
    try {
      const Department = require('../../models/Department');
      const department = await Department.findById(req.params.id).populate('manager').populate('parentDepartment');
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createDepartment: async (req, res) => {
    try {
      const Department = require('../../models/Department');
      const department = new Department(req.body);
      await department.save();
      res.status(201).json({ success: true, message: 'Department created', data: department });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  updateDepartment: async (req, res) => {
    try {
      const Department = require('../../models/Department');
      const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, message: 'Department updated', data: department });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteDepartment: async (req, res) => {
    try {
      const Department = require('../../models/Department');
      const department = await Department.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, message: 'Department archived' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDepartmentAnalytics: async (req, res) => {
    try {
      const Department = require('../../models/Department');
      const department = await Department.findById(req.params.id);
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      
      const analytics = {
        totalEmployees: department.metrics.employeeCount,
        budgetUtilization: department.budget.utilizationPercentage,
        performanceScore: department.metrics.performanceScore
      };
      
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ✅ IMPORTANT: EJS RENDER ROUTE MUST COME FIRST
router.get('/', departmentController.renderDepartmentPage);

// API Routes
router.get('/api', departmentController.getAllDepartments);
router.get('/api/:id', departmentController.getDepartmentById);
router.get('/api/:id/analytics', departmentController.getDepartmentAnalytics);
router.post('/api', departmentController.createDepartment);
router.put('/api/:id', departmentController.updateDepartment);
router.delete('/api/:id', departmentController.deleteDepartment);

module.exports = router;