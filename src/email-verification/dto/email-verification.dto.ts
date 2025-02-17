import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class GenerateOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}



export class AddFranchise {
    @IsEmail()
    @IsNotEmpty()
    email: string;
  
    @IsString()
    @IsNotEmpty()
    phone: string;
  
    @IsString()
    @IsNotEmpty()
    otpCode: string;

    @IsString()
    city: string;
  
    
    @IsString()
    firstname: string;
    @IsString()
    lastname: string;

   
  @IsString()  // Makes UPI ID a required field
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, {
    message: 'Invalid UPI ID format. It should be in the format "username@bank"',
  })
  
  upi_id: string; // Required UPI ID
    
  }
  
  



