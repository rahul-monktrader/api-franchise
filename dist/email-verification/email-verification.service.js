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
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const otp_model_1 = require("./otp.model");
const sequelize_1 = require("@nestjs/sequelize");
const axios_1 = require("axios");
const franchise_service_1 = require("../franchise/franchise.service");
const jwt_1 = require("@nestjs/jwt");
let EmailVerificationService = class EmailVerificationService {
    constructor(otpModel, franchiseService, jwtService) {
        this.otpModel = otpModel;
        this.franchiseService = franchiseService;
        this.jwtService = jwtService;
    }
    generateFranchiseCode(fname, lname) {
        return `${fname}_${lname}`;
    }
    async validateOtp(email, otpCode, firstname, lastname, phone, city, upi_id) {
        const otp = await this.otpModel.findOne({ where: { email } });
        if (!otp) {
            return { isValid: false, message: 'Invalid OTP / OTP not found' };
        }
        if (otp.otp_code !== otpCode) {
            await otp.increment('attempt_count');
            return { isValid: false, message: 'Invalid OTP' };
        }
        await otp.destroy();
        let franchise = await this.franchiseService.findFranchiseByEmail(email);
        let franchiseData = null;
        let isNewFranchise = false;
        if (!franchise) {
            const franchise_code = this.generateFranchiseCode(firstname, lastname);
            franchiseData = {
                email,
                phone,
                city,
                firstname,
                lastname,
                franchise_code,
                upi_id,
            };
            franchise = await this.franchiseService.addFranchise(franchiseData);
            isNewFranchise = true;
        }
        else {
            franchiseData = {
                email,
                phone: null,
                city: null,
                firstname: null,
                lastname: null,
                franchise_code: franchise.franchise_code,
                upi_id: null,
            };
        }
        const token = this.jwtService.sign({
            franchiseId: franchise.franchisee_id,
            email: franchise.email,
            franchise_code: franchise.franchise_code,
        }, {
            secret: process.env.JWT_SECRET_KEY || 'secretkey',
            expiresIn: '1h',
        });
        return {
            isValid: true,
            message: 'OTP validated successfully',
            franchiseId: franchise.id,
            token,
            isNewFranchise,
            ...franchiseData,
        };
    }
    async generateOtp(email) {
        try {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
            let existingOtp = await this.otpModel.findOne({ where: { email } });
            if (existingOtp) {
                existingOtp.otp_code = otpCode;
                existingOtp.expires_at = expirationTime;
                existingOtp.is_valid = true;
                existingOtp.attempt_count = 0;
                await existingOtp.save();
                await this.sendOtpEmail(email, otpCode);
                return existingOtp;
            }
            const otp = await this.otpModel.create({
                email,
                otp_code: otpCode,
                expires_at: expirationTime,
                is_valid: true,
                attempt_count: 0,
            });
            await this.sendOtpEmail(email, otpCode);
            return otp;
        }
        catch (error) {
            console.error(`Error generating OTP for ${email}: ${error.message}`, error);
            throw new common_1.InternalServerErrorException('Could not save OTP. Please try again.');
        }
    }
    async sendOtpEmail(email, otpCode) {
        const apiUrl = 'https://api.sparkpost.com/api/v1/transmissions';
        const apiKey = process.env.SPARKPOST_API_KEY;
        const payload = {
            content: {
                from: {
                    email: 'txn@notifications.monktrader.in',
                    name: 'MonkTrader Franchise',
                },
                subject: 'Welcome to MonkTrader Franchise - Your OTP Code',
                name: 'MonkTrader Franchise',
                text: `
          Dear Franchisee,
          Welcome to the MonkTrader Franchise!
          Your OTP is: ${otpCode} - MonkTrader Franchise
          Please use this code to complete your franchise verification. It is valid for the next 5 minutes.
          If you did not request this code, please ignore this email or contact our support team at support@monktrader.ai.
          Thank you for choosing MonkTrader Franchise. We’re thrilled to have you onboard!
          Best regards,
          The MonkTrader Team
        `,
                html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; 
                      max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; 
                      border: 1px solid #e0e0e0; border-radius: 10px; 
                      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin: 0 0 25px; text-align: center; color: #333; line-height: 1.5;">
              Your OTP is: 
              <strong style="font-size: 18px; font-weight: bold; color: #0056D2; padding: 0 10px; 
                             background-color: #f1f1f1; border-radius: 4px; letter-spacing: 2px;">
                ${otpCode}
              </strong>
              <span style="font-size: 14px; color: #777; vertical-align: middle; margin-left: 10px;">
                - MonkTrader Franchise
              </span>
            </p>
            <h2 style="color: #0056D2; text-align: center; margin: 0 0 30px; font-size: 24px; font-weight: bold;">
              Welcome to MonkTrader Franchise
            </h2>
            <p style="font-size: 16px; margin: 0 0 20px; color: #333;">Dear Franchisee,</p>
            <p style="font-size: 16px; margin: 0 0 20px; color: #333;">
              Welcome to the <strong>MonkTrader Franchise</strong>! We are excited to partner with you in this venture.
            </p>
            <p style="font-size: 16px; margin: 0 0 20px; color: #333;">
              Please use the OTP code above to complete your franchise verification process. 
              It will remain valid for the next <strong>5 minutes</strong>.
            </p>
            <p style="font-size: 16px; margin: 0 0 30px; color: #333;">
              If you did not request this code, please ignore this email or contact our support team at 
              <a href="mailto:support@monktrader.ai" style="color: #0056D2; text-decoration: none; font-weight: bold;">
                support@monktrader.ai
              </a> for assistance.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="font-size: 14px; color: #777; text-align: center; margin: 0;">
              Thank you for joining the MonkTrader Franchise,<br><strong>The MonkTrader Team</strong>
            </p>
          </div>
        `,
            },
            recipients: [{ address: email }],
        };
        try {
            await axios_1.default.post(apiUrl, payload, {
                headers: {
                    Authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            });
        }
        catch (error) {
            console.error(`Error sending OTP email to ${email}: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to send OTP email.');
        }
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(otp_model_1.Otp)),
    __metadata("design:paramtypes", [Object, franchise_service_1.FranchiseService,
        jwt_1.JwtService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map