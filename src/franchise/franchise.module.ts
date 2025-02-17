import { Module } from '@nestjs/common';
import { FranchiseService } from './franchise.service';
import { FranchiseeController } from './franchise.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { franchisee } from './franchise.model';
import { Coupon } from './coupon.model';
import { ConfigService } from 'src/shared/config.service';

@Module({
    imports: [
      SequelizeModule.forFeature([franchisee,Coupon]) ,// Ensure this is included
    ],
  providers: [FranchiseService,ConfigService],
  controllers: [FranchiseeController],
  exports:[FranchiseService]
})
export class FranchiseModule {}
