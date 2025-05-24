'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM Users;"
    );

    const userIds = users[0].map(user => user.id);

    for (const userId of userIds) {
      const lendCategory = await queryInterface.sequelize.query(
        `SELECT id FROM Categories WHERE userId = ${userId} AND type = 'LEND' LIMIT 1;`
      );
      const borrowCategory = await queryInterface.sequelize.query(
        `SELECT id FROM Categories WHERE userId = ${userId} AND type = 'BORROW' LIMIT 1;`
      );
      const lendCategoryId = lendCategory[0][0]?.id;
      const borrowCategoryId = borrowCategory[0][0]?.id;

      const lendTransactions = await queryInterface.sequelize.query(
        `SELECT id FROM GeneralTransactions WHERE userId = ${userId} AND type = 'LEND' AND categoryId IS NULL;`
      );

      const borrowTransactions = await queryInterface.sequelize.query(
        `SELECT id FROM GeneralTransactions WHERE userId = ${userId} AND type = 'BORROW' AND categoryId IS NULL;`
      );

      const lendTransactionIds = lendTransactions[0].map(tx => tx.id);
      const borrowTransactionIds = borrowTransactions[0].map(tx => tx.id);

      if (lendCategoryId && lendTransactionIds.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE GeneralTransactions SET categoryId = ${lendCategoryId} WHERE id IN (${lendTransactionIds.join(',')});`
        );
      }

      if (borrowCategoryId && borrowTransactionIds.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE GeneralTransactions SET categoryId = ${borrowCategoryId} WHERE id IN (${borrowTransactionIds.join(',')});`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
