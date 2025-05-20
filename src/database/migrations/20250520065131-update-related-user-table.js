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
    await queryInterface.addColumn("RelatedUsers", "totalPaid", {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
      allowNull: false,
      comment: "total amount that user has paid to this person"
    });
    await queryInterface.addColumn("RelatedUsers", "totalCollected", {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
      allowNull: false,
      comment: "total amount that user has collected from this person"
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
