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
    await queryInterface.addColumn("Wallets", "baseBalance", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false,
      comment: "base balance of the wallet, used for calculating the balance in different currencies"
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Wallets", "baseBalance");
  }
};
