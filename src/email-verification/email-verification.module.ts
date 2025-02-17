import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';
import { Otp } from './otp.model';
import { HelperService } from 'src/shared/helper.service';
import { FranchiseModule } from 'src/franchise/franchise.module';
import { JwtModule } from '@nestjs/jwt';  // Ensure JwtModule is imported
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.authguard';



@Module({
  imports: [
    SequelizeModule.forFeature([Otp]), // For OTP model
    FranchiseModule,  // For Franchise related services
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,  // Your secret key (ensure this is stored securely, possibly in env variables)
      signOptions: { expiresIn: '1h' },  // Token expiration time (optional)
    }),
  ],
  controllers: [EmailVerificationController],
  providers: [
    EmailVerificationService,
    HelperService,
    JwtStrategy,     // Add JwtStrategy here to ensure it's used within the module
    JwtAuthGuard
  ],
  exports: [EmailVerificationService, JwtAuthGuard],  // Ensure JwtStrategy is exported if needed elsewhere
})
export class EmailVerificationModule {}
