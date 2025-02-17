import { Body, Controller, HttpStatus, Post, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { Response } from 'express';
import { HelperService } from 'src/shared/helper.service';
import { AddFranchise, GenerateOtpDto } from './dto/email-verification.dto';
import { EmailVerificationService } from './email-verification.service';
import { sendSlackMessage } from 'src/shared/slack.util';
import { FranchiseService } from 'src/franchise/franchise.service';
@Controller('')
export class EmailVerificationController {

    constructor(
     
        private readonly helperService: HelperService,
        private readonly emailVerificationService: EmailVerificationService,
        private readonly franchiseService: FranchiseService  
      ) {}
    @Post('franchise/email/generate')
    async generateOtp(
      @Body() body: GenerateOtpDto,
      @Res() res
    ) {
      const functionName = this.helperService.getFunctionNameFromStack(); 
      try {
        const {  email } = body;
        const otp = await this.emailVerificationService.generateOtp(email);
    
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          status: true,
          message: 'OTP generated and sent successfully',
        });
      } catch (error) {
        await sendSlackMessage({
          message: `An error occurred while generating OTP for the email: ${body.email} error message ${error}`,  // Use body.email
          module: 'OTP',
          filename: `${functionName}`, 
          status: false,
        });
    
        return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          status: false,
          message: error.message || 'Failed to generate OTP. Please try again later.',
          data: [],
        });
      }
    }
    
    @Post('franchise/email/validate')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async validateOtp(
      @Body() validateOtpDto: AddFranchise,
      @Res() res: Response
    ) {
      const { email, otpCode, firstname, lastname, phone, city ,upi_id} = validateOtpDto;
      const functionName = this.helperService.getFunctionNameFromStack(); 
    
      try {
        // Validate OTP and store franchise data
        const { isValid, message, franchise_code, franchiseId, token,isNewFranchise } = await this.emailVerificationService.validateOtp(
          email,
          otpCode,
          firstname,
          lastname,
          phone,
          city,
          upi_id
        );
    
        if (!isValid) {
          return res.status(HttpStatus.OK).json({
            statusCode: HttpStatus.OK,
            status:false,
            message,
          });
        }
    
        // Set Authorization header before sending response

        if (isNewFranchise) {
            await sendSlackMessage({
              message: `A new franchise has been arrived !!!! Franchise: ${firstname} ${lastname}`,
              module: 'Franchise Validation',
              filename: 'validateOtp',
              status: true,
            });
          }
        res.setHeader('Authorization', `Bearer ${token}`);
    
        // Send the response after setting the header
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          status:true,
          message,
          franchise_code,
          franchiseId,
        });
    
      } catch (error) {
        console.log(error);
        await sendSlackMessage({
          message: `An error occurred during OTP validation error message ${error}`,  // Use body.email
          module: 'OTP',
          filename: `${functionName}`, 
          status: false,
        });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          status:false,
          message: 'An error occurred during OTP validation',
        });
      }
    }
    
    
}
