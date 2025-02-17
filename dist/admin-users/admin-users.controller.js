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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const sequelize_1 = require("@nestjs/sequelize");
const admin_user_model_1 = require("./admin-user.model");
const jwt_1 = require("@nestjs/jwt");
const roles_decorator_1 = require("./roles.decorator");
const admin_users_service_1 = require("./admin-users.service");
const franchise_service_1 = require("../franchise/franchise.service");
const slack_util_1 = require("../shared/slack.util");
let AdminUsersController = class AdminUsersController {
    constructor(adminUserModel, jwtService, adminUsersService, franchiseService) {
        this.adminUserModel = adminUserModel;
        this.jwtService = jwtService;
        this.adminUsersService = adminUsersService;
        this.franchiseService = franchiseService;
    }
    async login(body, res) {
        try {
            const { username, password } = body;
            if (username === password) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                    message: 'Username & password should not be the same.',
                });
            }
            const { user, isNewUser } = await this.adminUsersService.login(username, password);
            if (isNewUser) {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(password)) {
                    return res.status(common_1.HttpStatus.OK).json({
                        statusCode: common_1.HttpStatus.OK,
                        status: false,
                        message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
                    });
                }
                await (0, slack_util_1.sendSlackMessage)({
                    message: `Username ${username} needs admin access`,
                    module: 'Admin',
                    filename: 'admin-users',
                    status: true,
                });
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Account created, awaiting SUPER_ADMIN approval',
                });
            }
            if (!user) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                    message: 'Invalid credentials',
                });
            }
            if (user.status === 'PENDING') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Your account is pending approval',
                });
            }
            if (user.status === 'REJECTED') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Your account has been rejected',
                });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                    message: 'Invalid password',
                });
            }
            const token = this.adminUsersService.generateToken(user);
            res.setHeader('Authorization', `Bearer ${token}`);
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                status: true,
                message: `Login successful as ${user.role}`,
                role: user.role,
            });
        }
        catch (error) {
            console.error('Error during login:', error);
            await (0, slack_util_1.sendSlackMessage)({
                message: `Login failed for username ${body.username}. Error: ${error.message}`,
                module: 'Admin',
                filename: 'admin-users',
                status: false,
            });
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: 500,
                status: false,
                message: 'An error occurred during login. Please try again later.',
            });
        }
    }
    async approveOrRejectAdmin(action, username, req, res) {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                statusCode: 401,
                status: false,
                message: 'Token not provided',
            });
        }
        try {
            const decoded = await this.jwtService.verifyAsync(token);
            if (decoded.role !== 'SUPER_ADMIN') {
                return res.status(common_1.HttpStatus.FORBIDDEN).json({
                    statusCode: 403,
                    status: false,
                    message: 'Forbidden: Only SUPER_ADMIN can manage approvals',
                });
            }
            if (action !== 'approve' && action !== 'reject') {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    statusCode: 400,
                    status: false,
                    message: 'Invalid action. Use "approve" or "reject".',
                });
            }
            const result = await this.adminUsersService.approveOrRejectAdmin(username, action);
            if (result === 'NOT_FOUND') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: `User ${username} not found`,
                });
            }
            if (result === 'ALREADY_APPROVED' || result === 'ALREADY_REJECTED') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: `User ${username} is already ${result === 'ALREADY_APPROVED' ? 'approved' : 'rejected'}`,
                });
            }
            await (0, slack_util_1.sendSlackMessage)({
                message: `Admin user ${username} has been ${action.toUpperCase()}D by SUPER_ADMIN`,
                module: 'Admin',
                filename: 'admin-users',
                status: true,
            });
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                status: true,
                message: `Admin user ${username} ${action}d successfully`,
            });
        }
        catch (error) {
            console.error('Error processing admin approval/rejection:', error);
            if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                    statusCode: 401,
                    status: false,
                    message: 'Invalid or expired token',
                });
            }
            await (0, slack_util_1.sendSlackMessage)({
                message: `Admin ${action} failed for username ${username}. Error: ${error.message}`,
                module: 'Admin',
                filename: 'admin-users',
                status: false,
            });
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: 500,
                status: false,
                message: 'Internal server error',
            });
        }
    }
    async getUsersByStatus(status, req, res) {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                status: false,
                message: 'Token not provided',
            });
        }
        try {
            const decoded = await this.jwtService.verifyAsync(token);
            if (decoded.role !== 'SUPER_ADMIN') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Forbidden: Only SUPER_ADMIN can access this',
                });
            }
            if (!['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Invalid status. Allowed values: pending, approved',
                });
            }
            const users = await this.adminUsersService.getUsersByStatus(status.toUpperCase());
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                status: true,
                message: `Fetched ${users.length} ${status} users successfully`,
                data: users,
            });
        }
        catch (error) {
            console.log(error);
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                status: false,
                message: 'Invalid or expired token',
            });
        }
    }
    async logout(req, res) {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                statusCode: 401,
                message: 'No token provided',
            });
        }
        try {
            await this.adminUsersService.blacklistToken(token);
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                message: 'Successfully logged out',
            });
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: 500,
                message: 'Error logging out',
            });
        }
    }
    async acceptOrRejectFranchise(action, res, req) {
        try {
            const { franchise_id } = action;
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Token not provided',
                });
            }
            const decoded = await this.jwtService.verifyAsync(token);
            const userId = decoded?.id;
            const userFranchiseId = await this.franchiseService.getFranchiseDetailsById(Number(franchise_id));
            if (!userFranchiseId) {
                return res.status(common_1.HttpStatus.OK).json({
                    message: 'Franchise ID is missing for the user.',
                    statusCode: common_1.HttpStatus.OK,
                    status: false,
                });
            }
            const franchiseStatus = await this.franchiseService.getFranchiseDetailsById(Number(franchise_id));
            if (franchiseStatus && franchiseStatus.status === 'success') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Franchise already accepted. Action cannot be performed.',
                });
            }
            if (franchiseStatus && franchiseStatus.status === 'rejected') {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Franchise already rejected. Action cannot be performed.',
                });
            }
            const result = await this.franchiseService.handleFranchiseAction(Number(franchiseStatus?.franchisee_id), action.status, userId);
            if (result.status === 'success') {
                return res.status(common_1.HttpStatus.OK).json({
                    message: action.status === 'accept' ? 'Franchise accepted and coupon created.' : 'Franchise rejected.',
                    status: true,
                    statusCode: common_1.HttpStatus.OK,
                });
            }
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                message: 'Unable to process the action, please try again.',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                status: false,
            });
        }
        catch (error) {
            console.error('Error processing franchise action:', error);
            await (0, slack_util_1.sendSlackMessage)({
                message: `'An error occurred while processing the franchise action. ${error.message}`,
                module: 'Admin',
                filename: 'get-franchises',
                status: false,
            });
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred while processing the franchise action.',
                status: false,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            });
        }
    }
    async getAllFranchises(res, req) {
        try {
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                return res.status(common_1.HttpStatus.OK).json({
                    statusCode: 200,
                    status: false,
                    message: 'Token not provided',
                });
            }
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const franchises = await this.adminUsersService.getAllFranchises(status);
            return res.status(200).json({
                status: 200,
                message: 'Franchises retrieved successfully',
                data: franchises,
                statusCode: 200
            });
        }
        catch (error) {
            await (0, slack_util_1.sendSlackMessage)({
                message: `Error fetching franchisese Error: ${error.message}`,
                module: 'Admin',
                filename: 'get-franchises',
                status: false,
            });
            return res.status(500).json({
                status: 'error',
                message: 'Error fetching franchises',
                error: error.message,
                data: []
            });
        }
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "login", null);
__decorate([
    (0, common_1.Post)(':action/:username'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('action')),
    __param(1, (0, common_1.Param)('username')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "approveOrRejectAdmin", null);
__decorate([
    (0, common_1.Get)('status/:status'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('status')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getUsersByStatus", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('accept-or-reject'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "acceptOrRejectFranchise", null);
__decorate([
    (0, common_1.Get)('get-franchises'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getAllFranchises", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, common_1.Controller)('admin-users'),
    __param(0, (0, sequelize_1.InjectModel)(admin_user_model_1.AdminUser)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService,
        admin_users_service_1.AdminUsersService,
        franchise_service_1.FranchiseService])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map