'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambah kolom buktiFoto ke tabel Presensis
    await queryInterface.addColumn('Presensis', 'buktiFoto', {
      type: Sequelize.STRING,      // simpan path/nama file
      allowNull: true,             // boleh null (kalau user belum/ga selfie)
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: hapus lagi kolom buktiFoto
    await queryInterface.removeColumn('Presensis', 'buktiFoto');
  },
};
