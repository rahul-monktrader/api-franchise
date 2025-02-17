import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminUser } from './admin-user.model';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FranchiseModule } from 'src/franchise/franchise.module';
import { franchisee } from 'src/franchise/franchise.model';
import { ConfigService } from 'src/shared/config.service';
import { Coupon } from 'src/franchise/coupon.model';

@Module({
  providers: [AdminUsersService,ConfigService],
  controllers: [AdminUsersController],
  imports: [
    // Import SequelizeModule to access the AdminUser model
    SequelizeModule.forFeature([AdminUser,franchisee,Coupon]), 
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Import JwtModule for handling JWT authentication
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretkey', // Ensure you provide a valid secret key
      signOptions: { expiresIn: '1h' }, // Optional expiration
    }),
    FranchiseModule
  ],
})
export class AdminUsersModule {}
