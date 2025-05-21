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
        'SELECT id, preferences from Users',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
    )

    for (const user of users){
      let preferences = user.preferences || {};

      if (typeof preferences === 'string') {
        try {
          preferences = JSON.parse(preferences);
        } catch (e) {
          preferences = {};
        }
      }

      // Keep existing timezone and add currency if it doesn't exist
      preferences = {
        timezone: preferences.timezone || "Asia/Ho_Chi_Minh",
        currency: "VND"
      };

      // Update the user
      await queryInterface.bulkUpdate(
          "Users",
          { preferences: preferences },
          { id: user.id }
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
        // Get all users
    const users = await queryInterface.sequelize.query(
            'SELECT id, preferences FROM Users',
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

    // Remove currency from preferences for each user
    for (const user of users) {
      let preferences = user.preferences || {};

      if (typeof preferences === 'string') {
        try {
          preferences = JSON.parse(preferences);
        } catch (e) {
          preferences = {};
        }
      }

      // Keep only timezone
      preferences = {
        timezone: preferences.timezone || "Asia/Ho_Chi_Minh"
      };

      // Update the user
      await queryInterface.bulkUpdate(
          "Users",
          { preferences: preferences },
          { id: user.id }
      );
    }
  }
};
