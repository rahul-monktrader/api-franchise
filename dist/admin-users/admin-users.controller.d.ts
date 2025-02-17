import { AdminUser } from './admin-user.model';
import { JwtService } from '@nestjs/jwt';
import { AdminUsersService } from './admin-users.service';
import { FranchiseService } from 'src/franchise/franchise.service';
import { Request } from 'express';
export declare class AdminUsersController {
    private readonly adminUserModel;
    private readonly jwtService;
    private readonly adminUsersService;
    private readonly franchiseService;
    constructor(adminUserModel: typeof AdminUser, jwtService: JwtService, adminUsersService: AdminUsersService, franchiseService: FranchiseService);
    login(body: {
        username: string;
        password: string;
    }, res: any): Promise<any>;
    approveOrRejectAdmin(action: string, username: string, req: Request, res: any): Promise<any>;
    getUsersByStatus(status: string, req: Request, res: any): Promise<any>;
    logout(req: Request, res: any): Promise<any>;
    acceptOrRejectFranchise(action: {
        status: 'accept' | 'reject';
        franchise_id: string;
    }, res: any, req: Request): Promise<any>;
    getAllFranchises(res: any, req: Request): Promise<any>;
}
