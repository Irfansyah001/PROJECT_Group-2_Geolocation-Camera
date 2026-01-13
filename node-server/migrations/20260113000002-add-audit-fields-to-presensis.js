'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add accuracy_m - GPS accuracy in meters
    await queryInterface.addColumn('Presensis', 'accuracyM', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'GPS accuracy in meters from browser Geolocation API'
    });

    // Add distance_m - calculated distance from geofence center
    await queryInterface.addColumn('Presensis', 'distanceM', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Calculated distance in meters from geofence center (Haversine)'
    });

    // Add inside_geofence - whether location was inside the geofence
    await queryInterface.addColumn('Presensis', 'insideGeofence', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      comment: 'Whether the location was inside the active geofence'
    });

    // Add status - validation result
    await queryInterface.addColumn('Presensis', 'status', {
      type: Sequelize.ENUM('VALID', 'INVALID', 'PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Validation status of the attendance'
    });

    // Add statusReason - explanation for the status
    await queryInterface.addColumn('Presensis', 'statusReason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Reason for the validation status'
    });

    // Add geofenceId - reference to the geofence used for validation
    await queryInterface.addColumn('Presensis', 'geofenceId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Geofences',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Reference to the geofence used during validation'
    });

    // Add serverTimestamp - when the server processed the request
    await queryInterface.addColumn('Presensis', 'serverTimestamp', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Server timestamp when the attendance was processed'
    });

    // Add clientTimestamp - timestamp from client device
    await queryInterface.addColumn('Presensis', 'clientTimestamp', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Client device timestamp when attendance was submitted'
    });

    // Add suspiciousFlag - for anomaly detection
    await queryInterface.addColumn('Presensis', 'suspiciousFlag', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag for suspicious activity (anomaly detection)'
    });

    // Add suspiciousReason - explanation for suspicious flag
    await queryInterface.addColumn('Presensis', 'suspiciousReason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Reason why the attendance was flagged as suspicious'
    });

    // Add verifiedBy - admin who verified (for verification workflow)
    await queryInterface.addColumn('Presensis', 'verifiedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Admin who verified this attendance'
    });

    // Add verifiedAt - when it was verified
    await queryInterface.addColumn('Presensis', 'verifiedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when the attendance was verified'
    });

    // Add verificationNote - note from admin
    await queryInterface.addColumn('Presensis', 'verificationNote', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Note from admin during verification'
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('Presensis', ['status'], {
      name: 'idx_presensis_status'
    });
    
    await queryInterface.addIndex('Presensis', ['geofenceId'], {
      name: 'idx_presensis_geofence_id'
    });

    await queryInterface.addIndex('Presensis', ['suspiciousFlag'], {
      name: 'idx_presensis_suspicious_flag'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('Presensis', 'idx_presensis_status');
    await queryInterface.removeIndex('Presensis', 'idx_presensis_geofence_id');
    await queryInterface.removeIndex('Presensis', 'idx_presensis_suspicious_flag');

    // Remove columns
    await queryInterface.removeColumn('Presensis', 'verificationNote');
    await queryInterface.removeColumn('Presensis', 'verifiedAt');
    await queryInterface.removeColumn('Presensis', 'verifiedBy');
    await queryInterface.removeColumn('Presensis', 'suspiciousReason');
    await queryInterface.removeColumn('Presensis', 'suspiciousFlag');
    await queryInterface.removeColumn('Presensis', 'clientTimestamp');
    await queryInterface.removeColumn('Presensis', 'serverTimestamp');
    await queryInterface.removeColumn('Presensis', 'geofenceId');
    await queryInterface.removeColumn('Presensis', 'statusReason');
    await queryInterface.removeColumn('Presensis', 'status');
    await queryInterface.removeColumn('Presensis', 'insideGeofence');
    await queryInterface.removeColumn('Presensis', 'distanceM');
    await queryInterface.removeColumn('Presensis', 'accuracyM');
  }
};
