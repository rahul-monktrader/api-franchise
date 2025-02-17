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
exports.FranchiseService = void 0;
const common_1 = require("@nestjs/common");
const franchise_model_1 = require("./franchise.model");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const crypto_1 = require("crypto");
const coupon_model_1 = require("./coupon.model");
const config_service_1 = require("../shared/config.service");
const sequelize_2 = require("sequelize");
let FranchiseService = class FranchiseService {
    constructor(franchiseModel, sequelize, couponModel, configService) {
        this.franchiseModel = franchiseModel;
        this.sequelize = sequelize;
        this.couponModel = couponModel;
        this.configService = configService;
    }
    async findFranchiseByEmail(email) {
        return await this.franchiseModel.findOne({ where: { email } });
    }
    async addFranchise(franchiseData) {
        const newFranchise = await this.franchiseModel.create(franchiseData);
        return newFranchise;
    }
    generateCouponCode(fname, lname, phone, city) {
        const fnameInitial = fname.charAt(0).toUpperCase();
        const lnameInitial = lname.charAt(0).toUpperCase();
        const phoneInitial = phone.charAt(0).toUpperCase();
        const cityInitial = city.charAt(0).toUpperCase();
        const randomStr = (0, crypto_1.randomBytes)(3).toString('hex');
        return `${fnameInitial}${lnameInitial}${phoneInitial}${cityInitial}${randomStr}`;
    }
    async findById(franchiseeId) {
        return this.franchiseModel.findOne({
            where: { franchisee_id: franchiseeId },
        });
    }
    async updateFranchisee(franchiseId, updatedFields) {
        return await this.franchiseModel.update(updatedFields, {
            where: { franchisee_id: franchiseId },
        });
    }
    async handleFranchiseAction(franchiseeId, action, userId) {
        const t = await this.sequelize.transaction();
        console.log(userId);
        try {
            const franchise = await this.franchiseModel.findOne({
                where: { franchisee_id: franchiseeId },
            });
            if (!franchise) {
                throw new common_1.BadRequestException('Franchise not found');
            }
            if (action === 'reject') {
                franchise.status = 'rejected';
                await franchise.save({ transaction: t });
                const coupon = await this.couponModel.findOne({
                    where: { franchisee_id: franchiseeId },
                    transaction: t,
                });
                if (coupon) {
                    await coupon.destroy({ transaction: t });
                }
                await franchise.destroy({ transaction: t });
            }
            else if (action === 'accept') {
                franchise.status = 'success';
                franchise.accepted_by = userId;
                await franchise.save({ transaction: t });
                await this.createCoupon(franchiseeId, userId, t);
            }
            await t.commit();
            return { status: 'success' };
        }
        catch (error) {
            await t.rollback();
            console.error('Error in handling franchise action for franchiseeId:', franchiseeId, error);
            throw error;
        }
    }
    async createCoupon(franchiseeId, user_id, transaction) {
        const franchisee = await this.franchiseModel.findOne({
            where: { franchisee_id: franchiseeId },
        });
        if (!franchisee) {
            throw new common_1.BadRequestException('Franchisee not found');
        }
        const { firstname, lastname, phone, city } = franchisee;
        const couponCode = this.generateCouponCode(firstname, lastname, phone, city);
        const newCoupon = await this.couponModel.create({
            franchisee_id: franchiseeId,
            code: couponCode,
            discount_type: 'flat',
            discount_value: 500.0,
            valid_from: new Date(),
            valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            created_by: user_id,
            status: 'active',
            type: "YEARLY"
        }, { transaction });
        return newCoupon;
    }
    async getFranchiseDetailsById(franchiseeId) {
        try {
            const BASE_URL = this.configService.getBaseUrl().replace(/\/$/, '');
            const franchise = await this.franchiseModel.findOne({
                where: { franchisee_id: franchiseeId },
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
            });
            if (!franchise) {
                return null;
            }
            const franchiseData = franchise.get({ plain: true });
            franchiseData.aadhar_front_url = franchiseData.aadhar_front_key ? `${BASE_URL}/uploads/${franchiseData.aadhar_front_key}` : null;
            franchiseData.aadhar_back_url = franchiseData.aadhar_back_key ? `${BASE_URL}/uploads/${franchiseData.aadhar_back_key}` : null;
            franchiseData.pan_card_url = franchiseData.pan_card_key ? `${BASE_URL}/uploads/${franchiseData.pan_card_key}` : null;
            delete franchiseData.aadhar_front_key;
            delete franchiseData.aadhar_back_key;
            delete franchiseData.pan_card_key;
            const coupon = await this.couponModel.findOne({
                where: { franchisee_id: franchiseeId, status: 'active', valid_to: { [sequelize_2.Op.gt]: new Date() } },
                attributes: ['coupon_id', 'code', 'discount_type', 'discount_value', 'valid_from', 'valid_to', 'type'],
                order: [['valid_to', 'ASC']],
                raw: true,
            });
            franchiseData.coupon = coupon ? { ...coupon, discount_value: Number(coupon.discount_value) } : null;
            return franchiseData;
        }
        catch (error) {
            console.error('Error fetching franchise details:', error);
            throw new Error('Error fetching franchise details: ' + error.message);
        }
    }
    async getFranchiseIdByCode(franchise_code) {
        const franchise = await this.franchiseModel.findOne({ where: { franchise_code: franchise_code } });
        if (franchise) {
            return franchise.franchisee_id;
        }
        return null;
    }
};
exports.FranchiseService = FranchiseService;
exports.FranchiseService = FranchiseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(franchise_model_1.franchisee)),
    __param(2, (0, sequelize_1.InjectModel)(coupon_model_1.Coupon)),
    __metadata("design:paramtypes", [Object, sequelize_typescript_1.Sequelize, Object, config_service_1.ConfigService])
], FranchiseService);
//# sourceMappingURL=franchise.service.js.map