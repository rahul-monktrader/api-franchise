import { AdminUser } from './admin-user.model';
import { JwtService } from '@nestjs/jwt';
import { franchisee } from 'src/franchise/franchise.model';
import { ConfigService } from 'src/shared/config.service';
import { Coupon } from 'src/franchise/coupon.model';
export declare class AdminUsersService {
    private readonly adminUserModel;
    private readonly franchiseeModel;
    private readonly couponModel;
    private readonly jwtService;
    private readonly configService;
    constructor(adminUserModel: typeof AdminUser, franchiseeModel: typeof franchisee, couponModel: typeof Coupon, jwtService: JwtService, configService: ConfigService);
    private blacklistedTokens;
    login(username: string, password: string): Promise<{
        user: AdminUser;
        isNewUser: boolean;
    }>;
    validatePassword(user: AdminUser, password: string): Promise<any>;
    generateToken(user: AdminUser): string;
    approveOrRejectAdmin(username: string, action: string): Promise<string>;
    getUsersByStatus(status: string): Promise<any[]>;
    blacklistToken(token: string): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    getAllFranchises(status?: string): Promise<any[]>;
    getFranchiseStatusById(franchiseId: number): Promise<franchisee | null>;
}
