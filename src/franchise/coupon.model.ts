import { Column, Model, DataType, CreatedAt, UpdatedAt, Table } from 'sequelize-typescript';

@Table({
  tableName: 'coupon',
  timestamps: true,
  createdAt: 'created_at', // Custom column for createdAt
  updatedAt: 'updated_at', // Custom column for updatedAt
})
export class Coupon extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.INTEGER,
    allowNull: false,
  })
  coupon_id: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  code: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['flat', 'percentage']], // Ensures only 'flat' or 'percentage' are allowed
    },
  })
  discount_type: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  discount_value: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  valid_from: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  valid_to: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  franchisee_id: number | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  created_by: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active', // Default status as 'active'
    validate: {
      isIn: [['active', 'expired', 'revoked']], // Ensures only allowed status values
    },
  })
  status: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW, // Automatically sets the current timestamp when a record is created
  })
  created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW, // Automatically sets the current timestamp on creation

  })
  updated_at: Date;



  
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['MONTHLY', 'YEARLY','ALL']], // Ensures only 'flat' or 'percentage' are allowed
    },
  })
  type: string;
}
