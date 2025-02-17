"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const sequelize_1 = require("@nestjs/sequelize");
const admin_user_model_1 = require("./admin-user.model");
const jwt_1 = require("@nestjs/jwt");
const sequelize_2 = require("sequelize");
const franchise_model_1 = require("../franchise/franchise.model");
const config_service_1 = require("../shared/config.service");
const coupon_model_1 = require("../franchise/coupon.model");
let AdminUsersService = class AdminUsersService {
    constructor(adminUserModel, franchiseeModel, couponModel, jwtService, configService) {
        this.adminUserModel = adminUserModel;
        this.franchiseeModel = franchiseeModel;
        this.couponModel = couponModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.blacklistedTokens = new Set();
    }
    async login(username, password) {
        let user = await this.adminUserModel.findOne({ where: { username } });
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await this.adminUserModel.create({
                username,
                password: hashedPassword,
                role: 'ADMIN',
                status: 'PENDING',
            });
            return { user, isNewUser: true };
        }
        return { user, isNewUser: false };
    }
    async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }
    generateToken(user) {
        return this.jwtService.sign({
            id: user.id,
            username: user.username,
            role: user.role,
        });
    }
    async approveOrRejectAdmin(username, action) {
        const admin = await this.adminUserModel.findOne({ where: { username } });
        if (!admin) {
            return 'NOT_FOUND';
        }
        if (action === 'approve') {
            if (admin.status === 'APPROVED')
                return 'ALREADY_APPROVED';
            admin.status = 'APPROVED';
        }
        else if (action === 'reject') {
            if (admin.status === 'REJECTED')
                return 'ALREADY_REJECTED';
            admin.status = 'REJECTED';
        }
        await admin.save();
        return action.toUpperCase();
    }
    async getUsersByStatus(status) {
        return this.adminUserModel.findAll({
            where: {
                status,
                role: { [sequelize_2.Op.ne]: 'SUPER_ADMIN' },
            },
            attributes: ['id', 'username', 'status', 'created_at', 'updated_at'],
        });
    }
    async blacklistToken(token) {
        this.blacklistedTokens.add(token);
    }
    async isTokenBlacklisted(token) {
        return this.blacklistedTokens.has(token);
    }
    async getAllFranchises(status) {
        try {
            const BASE_URL = this.configService.getBaseUrl().replace(/\/$/, '');
            const whereCondition = status ? { status } : {};
            const franchises = await this.franchiseeModel.findAll({
                where: whereCondition,
                attributes: [
                    'franchisee_id',
                    'franchise_code',
                    'firstname',
                    'lastname',
                    'status',
                    'email',
                    'phone',
                    'aadhar_front_key',
                    'aadhar_back_key',
                    'pan_card_key',
                ],
                order: [['status', 'DESC']],
            });
            const uniqueFranchises = new Map();
            for (const franchise of franchises) {
                const key = franchise.franchise_code || franchise.franchisee_id;
                const aadharFrontKey = franchise.aadhar_front_key || null;
                const aadharBackKey = franchise.aadhar_back_key || null;
                const panCardKey = franchise.pan_card_key || null;
                const franchiseData = franchise.get({ plain: true });
                franchiseData.aadhar_front_url = aadharFrontKey ? `${BASE_URL}/uploads/${aadharFrontKey}` : null;
                franchiseData.aadhar_back_url = aadharBackKey ? `${BASE_URL}/uploads/${aadharBackKey}` : null;
                franchiseData.pan_card_url = panCardKey ? `${BASE_URL}/uploads/${panCardKey}` : null;
                delete franchiseData.aadhar_front_key;
                delete franchiseData.aadhar_back_key;
                delete franchiseData.pan_card_key;
                const coupon = await this.couponModel.findOne({
                    where: {
                        franchisee_id: franchise.franchisee_id,
                        status: 'active',
                        valid_to: { [sequelize_2.Op.gt]: new Date() },
                    },
                    attributes: ['coupon_id', 'code', 'discount_type', 'discount_value', 'valid_from', 'valid_to'],
                    raw: true,
                    order: [['valid_to', 'ASC']]
                });
                franchiseData.coupon = coupon ? {
                    ...coupon,
                    discount_value: Number(coupon.discount_value)
                } : null;
                uniqueFranchises.set(key, franchiseData);
            }
            return Array.from(uniqueFranchises.values());
        }
        catch (error) {
            console.error('Error fetching franchises:', error);
            throw new Error('Error fetching franchises: ' + error.message);
        }
    }
    async getFranchiseStatusById(franchiseId) {
        try {
            const franchise = await this.franchiseeModel.findOne({
                where: { id: franchiseId },
                attributes: ['status'],
            });
            return franchise;
        }
        catch (error) {
            throw new Error('Error fetching franchise status');
        }
    }
};
exports.AdminUsersService = AdminUsersService;
exports.AdminUsersService = AdminUsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(admin_user_model_1.AdminUser)),
    __param(1, (0, sequelize_1.InjectModel)(franchise_model_1.franchisee)),
    __param(2, (0, sequelize_1.InjectModel)(coupon_model_1.Coupon)),
    __metadata("design:paramtypes", [Object, Object, Object, jwt_1.JwtService,
        config_service_1.ConfigService])
], AdminUsersService);
//# sourceMappingURL=admin-users.service.js.map