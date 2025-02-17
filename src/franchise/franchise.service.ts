import { BadRequestException, Injectable } from '@nestjs/common';
import { franchisee } from './franchise.model';
import { AddFranchise } from 'src/email-verification/dto/email-verification.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomBytes } from 'crypto';
import { Coupon } from './coupon.model';
import { ConfigService } from 'src/shared/config.service';
import { Op } from 'sequelize';

@Injectable()
export class FranchiseService {
  constructor(    @InjectModel(franchisee) private readonly franchiseModel: typeof franchisee,    private readonly sequelize: Sequelize,  // Inject Sequelize here
  @InjectModel(Coupon) private readonly couponModel: typeof Coupon,   private readonly configService: ConfigService ) {}


  async findFranchiseByEmail(email: string): Promise<franchisee | null> {
    return await this.franchiseModel.findOne({ where: { email } });
  }
  
  async addFranchise(franchiseData: any): Promise<franchisee> {

  
    const newFranchise = await this.franchiseModel.create(franchiseData);
    
 
    return newFranchise;
  }
  

  generateCouponCode(fname: string, lname: string, phone: string, city: string): string {
    const fnameInitial = fname.charAt(0).toUpperCase(); // First letter of first name
    const lnameInitial = lname.charAt(0).toUpperCase(); // First letter of last name
    const phoneInitial = phone.charAt(0).toUpperCase(); // First letter of phone number (or you can use more logic here if needed)
    const cityInitial = city.charAt(0).toUpperCase(); // First letter of city

    // Generate a 6-character random alphanumeric string
    const randomStr = randomBytes(3).toString('hex'); // Generates a 6-character random alphanumeric string (2 characters per byte)

    // Construct and return the coupon code
    return `${fnameInitial}${lnameInitial}${phoneInitial}${cityInitial}${randomStr}`;
  }
  

  async findById(franchiseeId: number): Promise<franchisee | null> {
    return this.franchiseModel.findOne({
      where: { franchisee_id: franchiseeId },
    });
  }

  async updateFranchisee(franchiseId: number, updatedFields: Record<string, string|null>) {
  
    return await this.franchiseModel.update(updatedFields, {
      where: { franchisee_id: franchiseId },
    });
  }
  async handleFranchiseAction(franchiseeId: number, action: 'accept' | 'reject',userId:number) {
    const t = await this.sequelize.transaction();
console.log(userId)
    try {
      const franchise = await this.franchiseModel.findOne({
        where: { franchisee_id: franchiseeId },
      });

      if (!franchise) {
        throw new BadRequestException('Franchise not found');
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
      } else if (action === 'accept') {
        franchise.status = 'success';
        franchise.accepted_by = userId;
        await franchise.save({ transaction: t });
        await this.createCoupon(franchiseeId,userId, t);  // Pass the transaction
      }

      await t.commit();
      return { status: 'success' };
    } catch (error) {
      await t.rollback();
      console.error('Error in handling franchise action for franchiseeId:', franchiseeId, error);
      throw error;
    }
  }

  async createCoupon(franchiseeId: number,user_id:number, transaction: any) {
    const franchisee = await this.franchiseModel.findOne({
      where: { franchisee_id: franchiseeId },
    });

    if (!franchisee) {
      throw new BadRequestException('Franchisee not found');
    }

    const { firstname, lastname, phone, city } = franchisee;
    const couponCode = this.generateCouponCode(firstname, lastname, phone, city);

    const newCoupon = await this.couponModel.create(
      {
        franchisee_id: franchiseeId,
        code: couponCode,
        discount_type: 'flat',
        discount_value: 500.0,
        valid_from: new Date(),
        valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        created_by: user_id,
        status: 'active',
        type:"YEARLY"
      },
      { transaction },
    );

    return newCoupon;
  }


  async getFranchiseDetailsById(franchiseeId: number) {
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

        // Convert Sequelize object to plain JSON
        const franchiseData: any = franchise.get({ plain: true });

        // Construct URLs if keys exist, otherwise set to null
        franchiseData.aadhar_front_url = franchiseData.aadhar_front_key ? `${BASE_URL}/uploads/${franchiseData.aadhar_front_key}` : null;
        franchiseData.aadhar_back_url = franchiseData.aadhar_back_key ? `${BASE_URL}/uploads/${franchiseData.aadhar_back_key}` : null;
        franchiseData.pan_card_url = franchiseData.pan_card_key ? `${BASE_URL}/uploads/${franchiseData.pan_card_key}` : null;

        // Remove file keys from response
        delete franchiseData.aadhar_front_key;
        delete franchiseData.aadhar_back_key;
        delete franchiseData.pan_card_key;

        // Fetch only one active coupon for the franchise
        const coupon = await this.couponModel.findOne({
            where: { franchisee_id: franchiseeId, status: 'active', valid_to: { [Op.gt]: new Date() } },
            attributes: ['coupon_id', 'code', 'discount_type', 'discount_value', 'valid_from', 'valid_to', 'type'],
            order: [['valid_to', 'ASC']], // Fetch the nearest expiring coupon
            raw: true,
        });

        // Format the coupon if found, otherwise set to null
        franchiseData.coupon = coupon ? { ...coupon, discount_value: Number(coupon.discount_value) } : null;

        return franchiseData;
    } catch (error) {
        console.error('Error fetching franchise details:', error);
        throw new Error('Error fetching franchise details: ' + error.message);
    }
}




async getFranchiseIdByCode(franchise_code: string): Promise<number | null> {
    // Logic to fetch the franchiseId from the database or repository
    const franchise = await this.franchiseModel.findOne({ where: { franchise_code: franchise_code } });
    
    if (franchise) {
      return franchise.franchisee_id; // Return the franchiseId
    }
    return null; // Return null if franchise is not found
  }
}
