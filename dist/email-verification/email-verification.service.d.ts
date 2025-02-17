import { Otp } from './otp.model';
import { FranchiseService } from 'src/franchise/franchise.service';
import { JwtService } from '@nestjs/jwt';
export declare class EmailVerificationService {
    private readonly otpModel;
    private readonly franchiseService;
    private readonly jwtService;
    constructor(otpModel: typeof Otp, franchiseService: FranchiseService, jwtService: JwtService);
    generateFranchiseCode(fname: string, lname: string): string;
    validateOtp(email: string, otpCode: string, firstname: string, lastname: string, phone: string, city: string, upi_id: string): Promise<any>;
    generateOtp(email: string): Promise<Otp>;
    private sendOtpEmail;
}
