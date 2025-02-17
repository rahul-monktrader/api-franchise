import { franchisee } from './franchise.model';
import { Sequelize } from 'sequelize-typescript';
import { Coupon } from './coupon.model';
import { ConfigService } from 'src/shared/config.service';
export declare class FranchiseService {
    private readonly franchiseModel;
    private readonly sequelize;
    private readonly couponModel;
    private readonly configService;
    constructor(franchiseModel: typeof franchisee, sequelize: Sequelize, couponModel: typeof Coupon, configService: ConfigService);
    findFranchiseByEmail(email: string): Promise<franchisee | null>;
    addFranchise(franchiseData: any): Promise<franchisee>;
    generateCouponCode(fname: string, lname: string, phone: string, city: string): string;
    findById(franchiseeId: number): Promise<franchisee | null>;
    updateFranchisee(franchiseId: number, updatedFields: Record<string, string | null>): Promise<[affectedCount: number]>;
    handleFranchiseAction(franchiseeId: number, action: 'accept' | 'reject', userId: number): Promise<{
        status: string;
    }>;
    createCoupon(franchiseeId: number, user_id: number, transaction: any): Promise<Coupon>;
    getFranchiseDetailsById(franchiseeId: number): Promise<any>;
    getFranchiseIdByCode(franchise_code: string): Promise<number | null>;
}
