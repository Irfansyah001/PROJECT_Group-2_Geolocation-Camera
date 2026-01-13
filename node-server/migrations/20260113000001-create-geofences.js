'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Geofences', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the geofence location (e.g., "Kampus A", "Gedung Utama")'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description of the geofence'
      },
      centerLat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        comment: 'Center latitude of the geofence circle'
      },
      centerLng: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        comment: 'Center longitude of the geofence circle'
      },
      radiusM: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Radius of the geofence in meters'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Only one geofence can be active at a time'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Admin who created this geofence'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create index for faster lookup of active geofence
    await queryInterface.addIndex('Geofences', ['isActive'], {
      name: 'idx_geofences_is_active'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Geofences');
  }
};
