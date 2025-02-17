"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersModule = void 0;
const common_1 = require("@nestjs/common");
const admin_users_service_1 = require("./admin-users.service");
const admin_users_controller_1 = require("./admin-users.controller");
const sequelize_1 = require("@nestjs/sequelize");
const admin_user_model_1 = require("./admin-user.model");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const franchise_module_1 = require("../franchise/franchise.module");
const franchise_model_1 = require("../franchise/franchise.model");
const config_service_1 = require("../shared/config.service");
const coupon_model_1 = require("../franchise/coupon.model");
let AdminUsersModule = class AdminUsersModule {
};
exports.AdminUsersModule = AdminUsersModule;
exports.AdminUsersModule = AdminUsersModule = __decorate([
    (0, common_1.Module)({
        providers: [admin_users_service_1.AdminUsersService, config_service_1.ConfigService],
        controllers: [admin_users_controller_1.AdminUsersController],
        imports: [
            sequelize_1.SequelizeModule.forFeature([admin_user_model_1.AdminUser, franchise_model_1.franchisee, coupon_model_1.Coupon]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'secretkey',
                signOptions: { expiresIn: '1h' },
            }),
            franchise_module_1.FranchiseModule
        ],
    })
], AdminUsersModule);
//# sourceMappingURL=admin-users.module.js.map