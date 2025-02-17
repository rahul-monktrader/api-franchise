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
exports.EmailVerificationController = void 0;
const common_1 = require("@nestjs/common");
const helper_service_1 = require("../shared/helper.service");
const email_verification_dto_1 = require("./dto/email-verification.dto");
const email_verification_service_1 = require("./email-verification.service");
const slack_util_1 = require("../shared/slack.util");
const franchise_service_1 = require("../franchise/franchise.service");
let EmailVerificationController = class EmailVerificationController {
    constructor(helperService, emailVerificationService, franchiseService) {
        this.helperService = helperService;
        this.emailVerificationService = emailVerificationService;
        this.franchiseService = franchiseService;
    }
    async generateOtp(body, res) {
        const functionName = this.helperService.getFunctionNameFromStack();
        try {
            const { email } = body;
            const otp = await this.emailVerificationService.generateOtp(email);
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: common_1.HttpStatus.OK,
                status: true,
                message: 'OTP generated and sent successfully',
            });
        }
        catch (error) {
            await (0, slack_util_1.sendSlackMessage)({
                message: `An error occurred while generating OTP for the email: ${body.email} error message ${error}`,
                module: 'OTP',
                filename: `${functionName}`,
                status: false,
            });
            return res.status(error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                status: false,
                message: error.message || 'Failed to generate OTP. Please try again later.',
                data: [],
            });
        }
    }
    async validateOtp(validateOtpDto, res) {
        const { email, otpCode, firstname, lastname, phone, city, upi_id } = validateOtpDto;
        const functionName = this.helperService.getFunctionNameFromStack();
        try {
            const { isValid, message, franchise_code, franchiseId, token, isNewFranchise } = await this.emailVerificationService.validateOtp(email, otpCode, firstname, lastname, phone, city, upi_id);
            if (!isValid) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                    message,
                });
            }
            if (isNewFranchise) {
                await (0, slack_util_1.sendSlackMessage)({
                    message: `A new franchise has been arrived !!!! Franchise: ${firstname} ${lastname}`,
                    module: 'Franchise Validation',
                    filename: 'validateOtp',
                    status: true,
                });
            }
            res.setHeader('Authorization', `Bearer ${token}`);
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: common_1.HttpStatus.OK,
                status: true,
                message,
                franchise_code,
                franchiseId,
            });
        }
        catch (error) {
            console.log(error);
            await (0, slack_util_1.sendSlackMessage)({
                message: `An error occurred during OTP validation error message ${error}`,
                module: 'OTP',
                filename: `${functionName}`,
                status: false,
            });
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                status: false,
                message: 'An error occurred during OTP validation',
            });
        }
    }
};
exports.EmailVerificationController = EmailVerificationController;
__decorate([
    (0, common_1.Post)('franchise/email/generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.GenerateOtpDto, Object]),
    __metadata("design:returntype", Promise)
], EmailVerificationController.prototype, "generateOtp", null);
__decorate([
    (0, common_1.Post)('franchise/email/validate'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.AddFranchise, Object]),
    __metadata("design:returntype", Promise)
], EmailVerificationController.prototype, "validateOtp", null);
exports.EmailVerificationController = EmailVerificationController = __decorate([
    (0, common_1.Controller)(''),
    __metadata("design:paramtypes", [helper_service_1.HelperService,
        email_verification_service_1.EmailVerificationService,
        franchise_service_1.FranchiseService])
], EmailVerificationController);
//# sourceMappingURL=email-verification.controller.js.map