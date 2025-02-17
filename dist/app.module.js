"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const franchise_module_1 = require("./franchise/franchise.module");
const franchise_controller_1 = require("./franchise/franchise.controller");
const email_verification_module_1 = require("./email-verification/email-verification.module");
const email_verification_controller_1 = require("./email-verification/email-verification.controller");
const database_module_1 = require("./database/database.module");
const helper_service_1 = require("./shared/helper.service");
const config_1 = require("@nestjs/config");
const file_upload_module_1 = require("./file-upload/file-upload.module");
const jwt_1 = require("@nestjs/jwt");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const admin_users_module_1 = require("./admin-users/admin-users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            franchise_module_1.FranchiseModule,
            email_verification_module_1.EmailVerificationModule,
            database_module_1.DatabaseModule,
            config_1.ConfigModule.forRoot(),
            file_upload_module_1.FileUploadModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '1h' },
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'src', 'uploads'),
                serveRoot: '/uploads',
            }),
            admin_users_module_1.AdminUsersModule,
        ],
        controllers: [app_controller_1.AppController, franchise_controller_1.FranchiseeController, email_verification_controller_1.EmailVerificationController],
        providers: [app_service_1.AppService, helper_service_1.HelperService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map