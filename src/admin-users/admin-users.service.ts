import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { AdminUser } from './admin-user.model';// Sequelize Model
import { JwtService } from '@nestjs/jwt';
import { Op } from 'sequelize';
import { franchisee } from 'src/franchise/franchise.model';
import { ConfigService } from 'src/shared/config.service';
import * as path from 'path'; // Import path module
import { Coupon } from 'src/franchise/coupon.model';
@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(AdminUser) private readonly adminUserModel: typeof AdminUser,
    @InjectModel(franchisee) private readonly franchiseeModel: typeof franchisee,
    @InjectModel(Coupon) private readonly couponModel: typeof Coupon,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}
  private blacklistedTokens: Set<string> = new Set(); // Token blacklist
  // Handle Admin Login
  async login(username: string, password: string) {
    let user = await this.adminUserModel.findOne({ where: { username } });

    // If user does not exist, create a new one with 'PENDING' status
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await this.adminUserModel.create({
        username,
        password: hashedPassword,
        role: 'ADMIN', // New users are ADMIN by default
        status: 'PENDING', // Needs SUPER_ADMIN approval
      });

      return { user, isNewUser: true };
    }

    // If user exists but status is 'PENDING' or 'REJECTED', return user and its status
    return { user, isNewUser: false };
  }

  // Validate password
  async validatePassword(user: AdminUser, password: string) {
    return await bcrypt.compare(password, user.password);
  }

  // Generate JWT token
  generateToken(user: AdminUser) {
    return this.jwtService.sign({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  }

  async approveOrRejectAdmin(username: string, action: string): Promise<string> {
    const admin = await this.adminUserModel.findOne({ where: { username } });
  
    if (!admin) {
      return 'NOT_FOUND'; // User not found
    }
  
    if (action === 'approve') {
      if (admin.status === 'APPROVED') return 'ALREADY_APPROVED';
  
      admin.status = 'APPROVED';
    } else if (action === 'reject') {
      if (admin.status === 'REJECTED') return 'ALREADY_REJECTED';
  
      admin.status = 'REJECTED';
    }
  
    await admin.save();
    return action.toUpperCase(); // Returns 'APPROVED' or 'REJECTED'
  }
  
  

  async getUsersByStatus(status: string): Promise<any[]> {
    return this.adminUserModel.findAll({
      where: {
        status,
        role: { [Op.ne]: 'SUPER_ADMIN' }, // Exclude SUPER_ADMIN users
      },
      attributes: ['id', 'username', 'status', 'created_at', 'updated_at'], // Include necessary fields
    });
  }
  
  
  async blacklistToken(token: string): Promise<void> {
    // Add the token to the blacklist
    this.blacklistedTokens.add(token);
  }

  // Check if a token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistedTokens.has(token);
  }





  async getAllFranchises(status?: string) {
    try {
      const BASE_URL = this.configService.getBaseUrl().replace(/\/$/, '');
  
      // Build the condition for status if it's provided
      const whereCondition = status ? { status } : {};
  
      // Fetch all franchise records, with optional filtering by status
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
        order: [['status', 'DESC']], // Ensure 'success' appears before 'pending',
      });
  
      // Remove duplicates using franchise_code as the key
      const uniqueFranchises = new Map();
  
      for (const franchise of franchises) {
        const key = franchise.franchise_code || franchise.franchisee_id; // Ensure uniqueness
  
        // Get file keys or set them as null if not present
        const aadharFrontKey = franchise.aadhar_front_key || null;
        const aadharBackKey = franchise.aadhar_back_key || null;
        const panCardKey = franchise.pan_card_key || null;
  
        // Initialize the URL object
        const franchiseData: any = franchise.get({ plain: true });
  
        // Construct URLs if the corresponding keys exist or set them as null
        franchiseData.aadhar_front_url = aadharFrontKey ? `${BASE_URL}/uploads/${aadharFrontKey}` : null;
        franchiseData.aadhar_back_url = aadharBackKey ? `${BASE_URL}/uploads/${aadharBackKey}` : null;
        franchiseData.pan_card_url = panCardKey ? `${BASE_URL}/uploads/${panCardKey}` : null;
  
        // Remove keys from the response
        delete franchiseData.aadhar_front_key;
        delete franchiseData.aadhar_back_key;
        delete franchiseData.pan_card_key;
  
        // Fetch the first active coupon for the franchise
        const coupon = await this.couponModel.findOne({
          where: {
            franchisee_id: franchise.franchisee_id,
            status: 'active',
            valid_to: { [Op.gt]: new Date() }, 
          },
          attributes: ['coupon_id', 'code', 'discount_type', 'discount_value', 'valid_from', 'valid_to'],
          raw: true, 
          order: [['valid_to', 'ASC']] // Fetch the nearest expiring coupon
        });
  
        // Format the coupon if found, otherwise set to null
        franchiseData.coupon = coupon ? {
          ...coupon,
          discount_value: Number(coupon.discount_value) // Ensure it's a number
        } : null;
  
        // Add to map with proper URL or null value
        uniqueFranchises.set(key, franchiseData);
      }
  
      // Return the franchise list with a single coupon per franchise
      return Array.from(uniqueFranchises.values());
    } catch (error) {
      console.error('Error fetching franchises:', error);
      throw new Error('Error fetching franchises: ' + error.message);
    }
  }
  
  
  
  
  
  
  
  
  
  

  async getFranchiseStatusById(franchiseId: number) {
    try {
      const franchise = await this.franchiseeModel.findOne({
        where: { id: franchiseId },
        attributes: ['status'], // Assuming 'status' is the column where franchise status is stored
      });
  
      return franchise; // You can return the full franchise data or just the status
    } catch (error) {
      throw new Error('Error fetching franchise status');
    }
  }
  
}
