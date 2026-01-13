'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Presensis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      checkIn: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      checkOut: {
        type: Sequelize.DATE,
        allowNull: true, // checkOut can be null initially
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Presensis');
  }
};