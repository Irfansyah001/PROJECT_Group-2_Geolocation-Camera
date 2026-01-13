/**
 * GeoProof - Geofence Routes
 * 
 * Routes for geofence management
 */

const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofenceController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public route - get active geofence (for students)
router.get('/active', authenticateToken, geofenceController.getActiveGeofence);

// Admin-only routes
router.use(authenticateToken);
router.use(requireAdmin);

// CRUD operations
router.get('/', geofenceController.getAllGeofences);
router.get('/:id', geofenceController.getGeofenceById);
router.post('/', geofenceController.createGeofence);
router.patch('/:id', geofenceController.updateGeofence);
router.patch('/:id/activate', geofenceController.activateGeofence);
router.delete('/:id', geofenceController.deleteGeofence);

module.exports = router;
