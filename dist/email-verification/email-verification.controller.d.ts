import { Response } from 'express';
import { HelperService } from 'src/shared/helper.service';
import { AddFranchise, GenerateOtpDto } from './dto/email-verification.dto';
import { EmailVerificationService } from './email-verification.service';
import { FranchiseService } from 'src/franchise/franchise.service';
export declare class EmailVerificationController {
    private readonly helperService;
    private readonly emailVerificationService;
    private readonly franchiseService;
    constructor(helperService: HelperService, emailVerificationService: EmailVerificationService, franchiseService: FranchiseService);
    generateOtp(body: GenerateOtpDto, res: any): Promise<any>;
    validateOtp(validateOtpDto: AddFranchise, res: Response): Promise<Response<any, Record<string, any>>>;
}
