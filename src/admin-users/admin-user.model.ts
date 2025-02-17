import { Table, Column, Model, DataType, Default } from 'sequelize-typescript';

@Table({ tableName: 'admin_users', timestamps: true })
export class AdminUser extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ unique: true, allowNull: false })
  username: string;

  @Column({ allowNull: false })
  password: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'ADMIN',
  })
  role: 'SUPER_ADMIN' | 'ADMIN';

  @Column({
    type: DataType.STRING,
    defaultValue: 'PENDING',
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';


  @Column({ field: 'created_at' })
  createdAt: Date;

  @Column({ field: 'updated_at' })
  updatedAt: Date;

  // Other fields here

}
