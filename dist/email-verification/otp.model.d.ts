import { Model } from 'sequelize-typescript';
export declare class Otp extends Model<Otp> {
    id: string;
    email: string;
    otp_code: string;
    created_at: Date;
    expires_at: Date;
    is_valid: boolean;
    attempt_count: number;
}
