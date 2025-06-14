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
    await queryInterface.changeColumn("GeneralTransactions", "type", {
      type: Sequelize.ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'LEND', 'BORROW', 'MODIFY_BALANCE', 'COLLECTING_DEBT', 'REPAYMENT'),
      allowNull: false,
      defaultValue: 'EXPENSE',
      comment: 'Transaction type for collecting debt or repayment'
    });
    await queryInterface.changeColumn("Categories", "type", {
      type: Sequelize.ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'LEND', 'BORROW', 'COLLECTING_DEBT', 'REPAYMENT'),
      allowNull: false,
      defaultValue: 'EXPENSE',
      comment: 'Category type for collecting debt or repayment'
    });

    await queryInterface.createTable('CollectingDebtTransactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      generalTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'GeneralTransactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      borrowerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RelatedUsers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    await queryInterface.createTable('RepaymentTransactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      generalTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'GeneralTransactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lenderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RelatedUsers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn("GeneralTransactions", "type", {
      type: Sequelize.ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'LEND', 'BORROW', 'MODIFY_BALANCE'),
      allowNull: false,
      defaultValue: 'EXPENSE',
      comment: 'Transaction type without collecting debt or repayment'
    });
    await queryInterface.changeColumn("Categories", "type", {
      type: Sequelize.ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'LEND', 'BORROW'),
      allowNull: false,
      defaultValue: 'EXPENSE',
      comment: 'Category type without collecting debt or repayment'
    });
    await queryInterface.dropTable('CollectingDebtTransactions');
    await queryInterface.dropTable('RepaymentTransactions');
  }
};
