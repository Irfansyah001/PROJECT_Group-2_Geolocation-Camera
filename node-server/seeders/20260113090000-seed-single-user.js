'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Ubah nilai ini sesuai kebutuhan Anda
    const email = 'admin@example.com';
    const plainPassword = 'admin123';

    // Hindari error unique constraint jika sudah pernah ada
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM `Users` WHERE email = :email LIMIT 1',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) return;

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await queryInterface.bulkInsert(
      'Users',
      [
        {
          nama: 'Admin',
          email,
          password: hashedPassword,
          role: 'admin',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'admin@example.com' }, {});
  },
};
