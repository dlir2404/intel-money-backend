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
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM Users;"
    );

    const userIds = users[0].map(user => user.id);

    for (const userId of userIds) {
      await queryInterface.sequelize.query(
        `INSERT INTO Categories (userId, type, name, icon, editable) VALUES (${userId}, 'INCOME', 'Other', 'default', 0);`
      );
      await queryInterface.sequelize.query(
        `INSERT INTO Categories (userId, type, name, icon, editable) VALUES (${userId}, 'EXPENSE', 'Other', 'default', 0);`
      );
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM Users;"
    );
    const userIds = users[0].map(user => user.id);

    for (const userId of userIds) {
      await queryInterface.sequelize.query(
        `DELETE FROM Categories WHERE userId = ${userId} AND type IN ('INCOME', 'EXPENSE') AND name = 'Other';`
      );
    }
  }
};
