import { Model } from 'sequelize-typescript';
export declare class Coupon extends Model {
    coupon_id: number;
    code: string;
    discount_type: string;
    discount_value: number;
    valid_from: Date;
    valid_to: Date;
    franchisee_id: number | null;
    created_by: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    type: string;
}
