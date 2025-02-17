import { Column, Model, Table, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, AllowNull } from 'sequelize-typescript';

@Table
@Table({ tableName: 'franchisee', timestamps: true })
export class franchisee extends Model<franchisee> { 

  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  franchisee_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  franchise_code: string;

  @Column({ type: DataType.STRING, allowNull: false })
  firstname: string;

  @Column({ type: DataType.STRING, allowNull: false })
  lastname: string;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updated_at: Date;

  @Column({ type: DataType.STRING, allowNull: false })
  city: string;

  @Column({ 
    type: DataType.STRING, 
    unique: true, // Set the email field to be unique
    allowNull:false
  })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  phone: string;

  @Column({ type: DataType.STRING, allowNull: true })
  aadhar_front_key: string;

  @Column({ type: DataType.STRING, allowNull: true })
  aadhar_back_key: string;

  @Column({ type: DataType.STRING, allowNull: true })
  pan_card_key: string;

  @Column({ type: DataType.STRING, allowNull: true })
  status: string;
  @Column({ type: DataType.STRING, allowNull: false })
  upi_id: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  accepted_by: number;
}
