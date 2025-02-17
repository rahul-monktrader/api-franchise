import { Model } from 'sequelize-typescript';
export declare class franchisee extends Model<franchisee> {
    franchisee_id: number;
    franchise_code: string;
    firstname: string;
    lastname: string;
    created_at: Date;
    updated_at: Date;
    city: string;
    email: string;
    phone: string;
    aadhar_front_key: string;
    aadhar_back_key: string;
    pan_card_key: string;
    status: string;
    upi_id: string;
    accepted_by: number;
}
