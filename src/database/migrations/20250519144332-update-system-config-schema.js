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
    await queryInterface.dropTable('SystemConfigs');
    await queryInterface.createTable('SystemConfigs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      adsConfig: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: { 
          adProbability: 1,
          minTimeBetweenAds: 180,
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
    // Use bulkInsert instead of insert
    await queryInterface.bulkInsert('SystemConfigs', [{
      id: 1,
      adsConfig: JSON.stringify({
        adProbability: 1,
        minTimeBetweenAds: 180,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('SystemConfigs');
    await queryInterface.createTable('SystemConfigs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Configuration key'
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Configuration value'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }
};
