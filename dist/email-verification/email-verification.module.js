"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const email_verification_service_1 = require("./email-verification.service");
const email_verification_controller_1 = require("./email-verification.controller");
const otp_model_1 = require("./otp.model");
const helper_service_1 = require("../shared/helper.service");
const franchise_module_1 = require("../franchise/franchise.module");
const jwt_1 = require("@nestjs/jwt");
const jwt_strategy_1 = require("./jwt.strategy");
const jwt_authguard_1 = require("./jwt.authguard");
let EmailVerificationModule = class EmailVerificationModule {
};
exports.EmailVerificationModule = EmailVerificationModule;
exports.EmailVerificationModule = EmailVerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([otp_model_1.Otp]),
            franchise_module_1.FranchiseModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET_KEY,
                signOptions: { expiresIn: '1h' },
            }),
        ],
        controllers: [email_verification_controller_1.EmailVerificationController],
        providers: [
            email_verification_service_1.EmailVerificationService,
            helper_service_1.HelperService,
            jwt_strategy_1.JwtStrategy,
            jwt_authguard_1.JwtAuthGuard
        ],
        exports: [email_verification_service_1.EmailVerificationService, jwt_authguard_1.JwtAuthGuard],
    })
], EmailVerificationModule);
//# sourceMappingURL=email-verification.module.js.map