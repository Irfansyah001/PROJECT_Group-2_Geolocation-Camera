'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Presensi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Presensi belongs to one User
      Presensi.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Presensi belongs to one Geofence (optional)
      Presensi.belongsTo(models.Geofence, {
        foreignKey: 'geofenceId',
        as: 'geofence'
      });

      // Verified by admin (optional)
      Presensi.belongsTo(models.User, {
        foreignKey: 'verifiedBy',
        as: 'verifier'
      });
    }
  }
  Presensi.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    buktiFoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // ===== AUDIT FIELDS =====
    accuracyM: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'GPS accuracy in meters from browser Geolocation API'
    },
    distanceM: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Calculated distance in meters from geofence center'
    },
    insideGeofence: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Whether the location was inside the active geofence'
    },
    status: {
      type: DataTypes.ENUM('VALID', 'INVALID', 'PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Validation status of the attendance'
    },
    statusReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for the validation status'
    },
    geofenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the geofence used during validation'
    },
    serverTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Server timestamp when the attendance was processed'
    },
    clientTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Client device timestamp when attendance was submitted'
    },
    suspiciousFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag for suspicious activity (anomaly detection)'
    },
    suspiciousReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason why the attendance was flagged as suspicious'
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Admin who verified this attendance'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when the attendance was verified'
    },
    verificationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Note from admin during verification'
    }
  }, 
  {
    sequelize,
    modelName: 'Presensi',
    tableName: "presensis",
  }
);
  return Presensi;
};