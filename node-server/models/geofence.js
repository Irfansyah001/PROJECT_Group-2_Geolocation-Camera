'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Geofence extends Model {
    static associate(models) {
      // Geofence was created by an admin user
      Geofence.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      // Geofence has many attendance records
      Geofence.hasMany(models.Presensi, {
        foreignKey: 'geofenceId',
        as: 'attendances'
      });
    }
  }

  Geofence.init({
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nama geofence tidak boleh kosong' },
        len: { args: [2, 100], msg: 'Nama geofence harus 2-100 karakter' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    centerLat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Latitude harus berupa angka' },
        min: { args: [-90], msg: 'Latitude minimal -90' },
        max: { args: [90], msg: 'Latitude maksimal 90' }
      }
    },
    centerLng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Longitude harus berupa angka' },
        min: { args: [-180], msg: 'Longitude minimal -180' },
        max: { args: [180], msg: 'Longitude maksimal 180' }
      }
    },
    radiusM: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        isInt: { msg: 'Radius harus berupa angka bulat' },
        min: { args: [10], msg: 'Radius minimal 10 meter' },
        max: { args: [10000], msg: 'Radius maksimal 10000 meter (10 km)' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Geofence',
    tableName: 'Geofences',
    hooks: {
      // Before creating a new active geofence, deactivate all others
      beforeCreate: async (geofence, options) => {
        if (geofence.isActive) {
          await Geofence.update(
            { isActive: false },
            { where: { isActive: true }, transaction: options.transaction }
          );
        }
      },
      // Before updating to active, deactivate all others
      beforeUpdate: async (geofence, options) => {
        if (geofence.changed('isActive') && geofence.isActive) {
          await Geofence.update(
            { isActive: false },
            { 
              where: { 
                isActive: true,
                id: { [sequelize.Sequelize.Op.ne]: geofence.id }
              }, 
              transaction: options.transaction 
            }
          );
        }
      }
    }
  });

  return Geofence;
};
