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
exports.FranchiseeController = void 0;
const common_1 = require("@nestjs/common");
const franchise_service_1 = require("./franchise.service");
const jwt_authguard_1 = require("../email-verification/jwt.authguard");
let FranchiseeController = class FranchiseeController {
    constructor(franchiseeService) {
        this.franchiseeService = franchiseeService;
    }
    async getFranchiseDetails(req, res) {
        try {
            const franchiseeId = req.user.franchiseId;
            const franchiseDetails = await this.franchiseeService.getFranchiseDetailsById(franchiseeId);
            if (!franchiseDetails) {
                return res.status(common_1.HttpStatus.OK).json({
                    message: 'Details not found for franchiseId.',
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                    data: [],
                });
            }
            return res.status(common_1.HttpStatus.OK).json({
                message: 'Details for franchiseID',
                statusCode: common_1.HttpStatus.OK,
                status: true,
                data: franchiseDetails,
            });
        }
        catch (error) {
            console.error('Error fetching franchise details:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred while fetching franchise details.',
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                status: false,
                error: error.message || error,
            });
        }
    }
};
exports.FranchiseeController = FranchiseeController;
__decorate([
    (0, common_1.Get)('details'),
    (0, common_1.UseGuards)(jwt_authguard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FranchiseeController.prototype, "getFranchiseDetails", null);
exports.FranchiseeController = FranchiseeController = __decorate([
    (0, common_1.Controller)('franchisee'),
    __metadata("design:paramtypes", [franchise_service_1.FranchiseService])
], FranchiseeController);
//# sourceMappingURL=franchise.controller.js.map