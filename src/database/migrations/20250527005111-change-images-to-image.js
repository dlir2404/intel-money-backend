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
    await queryInterface.addColumn('GeneralTransactions', 'image', {
      type: Sequelize.STRING(1024),
      allowNull: true,
      defaultValue: null,
      comment: 'Single image URL for the transaction'
    });
    // Copy data from 'images' to 'image', extracting the first URL from arrays
    await queryInterface.sequelize.query(`
      UPDATE GeneralTransactions 
      SET image = CASE 
        WHEN images LIKE '[%]' THEN TRIM(BOTH '"' FROM SUBSTRING_INDEX(REPLACE(REPLACE(images, '[', ''), ']', ''), ',', 1))
        ELSE images
      END
    `);

    // Drop the old 'images' column
    await queryInterface.removeColumn('GeneralTransactions', 'images');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // Add back the original column
    await queryInterface.addColumn('GeneralTransactions', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Array of image URLs for the transaction'
    });

    // Copy data from 'image' to 'images', converting to array format
    await queryInterface.sequelize.query(`
      UPDATE GeneralTransactions 
      SET images = CASE 
        WHEN image IS NOT NULL THEN CONCAT('["', image, '"]')
        ELSE NULL
      END
    `);

    // Drop the temporary column
    await queryInterface.removeColumn('GeneralTransactions', 'image');
  }
};
