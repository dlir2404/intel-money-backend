'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('users', 'isVip', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'User VIP status'
    });

    await queryInterface.addColumn('users', 'vipExpirationDate', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'VIP expiration date'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('users', 'isVip');
    await queryInterface.removeColumn('users', 'vipExpirationDate');

  }
};
