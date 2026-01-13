/**
 * GeoProof - Geofence Controller
 * 
 * Handles CRUD operations for geofence management (admin only)
 */

const { Geofence, User } = require('../models');
const { validateCoordinates } = require('../utils/geolocation');

/**
 * Get all geofences
 * GET /api/geofences
 */
exports.getAllGeofences = async (req, res) => {
  try {
    const geofences = await Geofence.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nama', 'email']
      }],
      order: [['isActive', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      message: 'Daftar geofence berhasil diambil',
      count: geofences.length,
      data: geofences
    });
  } catch (error) {
    console.error('getAllGeofences error:', error);
    res.status(500).json({
      message: 'Gagal mengambil daftar geofence',
      error: error.message
    });
  }
};

/**
 * Get active geofence (for students/public)
 * GET /api/geofences/active
 */
exports.getActiveGeofence = async (req, res) => {
  try {
    const activeGeofence = await Geofence.findOne({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'centerLat', 'centerLng', 'radiusM']
    });

    if (!activeGeofence) {
      return res.status(404).json({
        message: 'Tidak ada geofence aktif saat ini',
        data: null
      });
    }

    res.json({
      message: 'Geofence aktif ditemukan',
      data: activeGeofence
    });
  } catch (error) {
    console.error('getActiveGeofence error:', error);
    res.status(500).json({
      message: 'Gagal mengambil geofence aktif',
      error: error.message
    });
  }
};

/**
 * Get geofence by ID
 * GET /api/geofences/:id
 */
exports.getGeofenceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const geofence = await Geofence.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nama', 'email']
      }]
    });

    if (!geofence) {
      return res.status(404).json({
        message: 'Geofence tidak ditemukan'
      });
    }

    res.json({
      message: 'Geofence ditemukan',
      data: geofence
    });
  } catch (error) {
    console.error('getGeofenceById error:', error);
    res.status(500).json({
      message: 'Gagal mengambil geofence',
      error: error.message
    });
  }
};

/**
 * Create a new geofence
 * POST /api/geofences
 */
exports.createGeofence = async (req, res) => {
  try {
    const { name, description, centerLat, centerLng, radiusM, isActive } = req.body;
    const adminId = req.user?.id;

    // Validate required fields
    if (!name || !centerLat || !centerLng) {
      return res.status(400).json({
        message: 'Nama, centerLat, dan centerLng wajib diisi'
      });
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(centerLat, centerLng);
    if (!coordValidation.isValid) {
      return res.status(400).json({
        message: coordValidation.error
      });
    }

    // Validate radius
    const radius = parseInt(radiusM) || 100;
    if (radius < 10 || radius > 10000) {
      return res.status(400).json({
        message: 'Radius harus antara 10 dan 10000 meter'
      });
    }

    const geofence = await Geofence.create({
      name: name.trim(),
      description: description?.trim() || null,
      centerLat: coordValidation.latitude,
      centerLng: coordValidation.longitude,
      radiusM: radius,
      isActive: !!isActive,
      createdBy: adminId
    });

    // Reload to get associations
    const createdGeofence = await Geofence.findByPk(geofence.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nama', 'email']
      }]
    });

    res.status(201).json({
      message: 'Geofence berhasil dibuat',
      data: createdGeofence
    });
  } catch (error) {
    console.error('createGeofence error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validasi gagal',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      message: 'Gagal membuat geofence',
      error: error.message
    });
  }
};

/**
 * Update a geofence
 * PATCH /api/geofences/:id
 */
exports.updateGeofence = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, centerLat, centerLng, radiusM, isActive } = req.body;

    const geofence = await Geofence.findByPk(id);
    if (!geofence) {
      return res.status(404).json({
        message: 'Geofence tidak ditemukan'
      });
    }

    // Validate coordinates if provided
    if (centerLat !== undefined || centerLng !== undefined) {
      const lat = centerLat !== undefined ? centerLat : geofence.centerLat;
      const lng = centerLng !== undefined ? centerLng : geofence.centerLng;
      
      const coordValidation = validateCoordinates(lat, lng);
      if (!coordValidation.isValid) {
        return res.status(400).json({
          message: coordValidation.error
        });
      }
    }

    // Validate radius if provided
    if (radiusM !== undefined) {
      const radius = parseInt(radiusM);
      if (radius < 10 || radius > 10000) {
        return res.status(400).json({
          message: 'Radius harus antara 10 dan 10000 meter'
        });
      }
    }

    // Update fields
    if (name !== undefined) geofence.name = name.trim();
    if (description !== undefined) geofence.description = description?.trim() || null;
    if (centerLat !== undefined) geofence.centerLat = parseFloat(centerLat);
    if (centerLng !== undefined) geofence.centerLng = parseFloat(centerLng);
    if (radiusM !== undefined) geofence.radiusM = parseInt(radiusM);
    if (isActive !== undefined) geofence.isActive = !!isActive;

    await geofence.save();

    // Reload to get associations
    const updatedGeofence = await Geofence.findByPk(geofence.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'nama', 'email']
      }]
    });

    res.json({
      message: 'Geofence berhasil diupdate',
      data: updatedGeofence
    });
  } catch (error) {
    console.error('updateGeofence error:', error);
    res.status(500).json({
      message: 'Gagal mengupdate geofence',
      error: error.message
    });
  }
};

/**
 * Activate a geofence (and deactivate others)
 * PATCH /api/geofences/:id/activate
 */
exports.activateGeofence = async (req, res) => {
  try {
    const { id } = req.params;

    const geofence = await Geofence.findByPk(id);
    if (!geofence) {
      return res.status(404).json({
        message: 'Geofence tidak ditemukan'
      });
    }

    // Deactivate all other geofences first
    await Geofence.update(
      { isActive: false },
      { where: { isActive: true } }
    );

    // Activate this one
    geofence.isActive = true;
    await geofence.save();

    res.json({
      message: `Geofence "${geofence.name}" berhasil diaktifkan`,
      data: geofence
    });
  } catch (error) {
    console.error('activateGeofence error:', error);
    res.status(500).json({
      message: 'Gagal mengaktifkan geofence',
      error: error.message
    });
  }
};

/**
 * Delete a geofence
 * DELETE /api/geofences/:id
 */
exports.deleteGeofence = async (req, res) => {
  try {
    const { id } = req.params;

    const geofence = await Geofence.findByPk(id);
    if (!geofence) {
      return res.status(404).json({
        message: 'Geofence tidak ditemukan'
      });
    }

    // Prevent deletion of active geofence
    if (geofence.isActive) {
      return res.status(400).json({
        message: 'Tidak dapat menghapus geofence yang sedang aktif. Nonaktifkan terlebih dahulu.'
      });
    }

    const geofenceName = geofence.name;
    await geofence.destroy();

    res.json({
      message: `Geofence "${geofenceName}" berhasil dihapus`
    });
  } catch (error) {
    console.error('deleteGeofence error:', error);
    res.status(500).json({
      message: 'Gagal menghapus geofence',
      error: error.message
    });
  }
};
