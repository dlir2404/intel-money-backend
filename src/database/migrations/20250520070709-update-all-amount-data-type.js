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
    await queryInterface.changeColumn("Users", "totalBalance", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("Users", "totalLoan", {
      type: Sequelize.DECIMAL(17, 2),
        defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("Users", "totalDebt", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("Wallets", "balance", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("GeneralTransactions", "amount", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("RelatedUsers", "totalLoan", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("RelatedUsers", "totalDebt", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("RelatedUsers", "totalPaid", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.changeColumn("RelatedUsers", "totalCollected", {
      type: Sequelize.DECIMAL(17, 2),
      defaultValue: 0,
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
