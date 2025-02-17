import { Model } from 'sequelize-typescript';
export declare class AdminUser extends Model {
    id: number;
    username: string;
    password: string;
    role: 'SUPER_ADMIN' | 'ADMIN';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    updatedAt: Date;
}
