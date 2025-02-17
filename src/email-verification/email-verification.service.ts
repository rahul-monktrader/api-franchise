import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Otp } from './otp.model';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { FranchiseService } from 'src/franchise/franchise.service';
import { first } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class EmailVerificationService {

  constructor(
    @InjectModel(Otp) private readonly otpModel: typeof Otp,
    private readonly franchiseService: FranchiseService,
     private readonly jwtService: JwtService,  // ✅ Inject JwtService

  ) {}
  generateFranchiseCode(fname: string, lname: string): string {
    // Combine the first and last name with an underscore
    return `${fname}_${lname}`;
  }
  

  // OTP validation method with franchise data addition
 async validateOtp(
  email: string,
  otpCode: string,
  firstname: string,
  lastname: string,
  phone: string,
  city: string,
  upi_id: string
): Promise<any> {
  // Validate OTP
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

  let franchiseData: any = null; // Default to null if franchise exists
  let isNewFranchise = false; 
  if (!franchise) {
    // ✅ Franchise doesn't exist, create a new one
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
  } else {
    // ✅ If franchise exists, set all personal details to null
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

  // ✅ Generate JWT token
  const token = this.jwtService.sign(
    {
      franchiseId: franchise.franchisee_id,
      email: franchise.email,
      franchise_code: franchise.franchise_code,
    },
    {
      secret: process.env.JWT_SECRET_KEY || 'secretkey', // Ensure it matches JwtStrategy
      expiresIn: '1h', // Set expiry time
    }
  );
  

  return {
    isValid: true,
    message: 'OTP validated successfully',
    franchiseId: franchise.id,
    token, // ✅ Return token,
    isNewFranchise,
    ...franchiseData, // ✅ Return the appropriate franchise data
  };
}

  
  
  
  async generateOtp(email: string): Promise<Otp> {
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // OTP expiration time (5 minutes)

      // Check if OTP already exists for the email
      let existingOtp = await this.otpModel.findOne({ where: { email } });

      if (existingOtp) {
        // Update the existing OTP with a new code and expiration time
        existingOtp.otp_code = otpCode;
        existingOtp.expires_at = expirationTime;
        existingOtp.is_valid = true;
        existingOtp.attempt_count = 0;
        await existingOtp.save();
        
        // Send OTP email
        await this.sendOtpEmail(email, otpCode);
        return existingOtp;
      }

      // If no existing OTP, create a new one
      const otp = await this.otpModel.create({
        email,
        otp_code: otpCode,
        expires_at: expirationTime,
        is_valid: true,
        attempt_count: 0,
      } as Otp); // Explicitly cast to Otp

      // Send OTP email
      await this.sendOtpEmail(email, otpCode);

      return otp;
    } catch (error) {
      console.error(`Error generating OTP for ${email}: ${error.message}`, error);
      throw new InternalServerErrorException('Could not save OTP. Please try again.');
    }
  }

  private async sendOtpEmail(email: string, otpCode: string) {
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
      await axios.post(apiUrl, payload, {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error(`Error sending OTP email to ${email}: ${error.message}`);
      throw new InternalServerErrorException('Failed to send OTP email.');
    }
  }
  
}
