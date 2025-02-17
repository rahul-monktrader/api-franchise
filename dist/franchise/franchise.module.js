"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FranchiseModule = void 0;
const common_1 = require("@nestjs/common");
const franchise_service_1 = require("./franchise.service");
const franchise_controller_1 = require("./franchise.controller");
const sequelize_1 = require("@nestjs/sequelize");
const franchise_model_1 = require("./franchise.model");
const coupon_model_1 = require("./coupon.model");
const config_service_1 = require("../shared/config.service");
let FranchiseModule = class FranchiseModule {
};
exports.FranchiseModule = FranchiseModule;
exports.FranchiseModule = FranchiseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([franchise_model_1.franchisee, coupon_model_1.Coupon]),
        ],
        providers: [franchise_service_1.FranchiseService, config_service_1.ConfigService],
        controllers: [franchise_controller_1.FranchiseeController],
        exports: [franchise_service_1.FranchiseService]
    })
], FranchiseModule);
//# sourceMappingURL=franchise.module.js.map