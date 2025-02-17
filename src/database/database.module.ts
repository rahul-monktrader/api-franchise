import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { Otp } from 'src/email-verification/otp.model';
import { AdminUser } from 'src/admin-users/admin-user.model';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Loads environment variables globally
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.PG_HOST || '3.16.101.71',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      username: process.env.PG_USER || 'monktraderuser',
      password: process.env.PG_PASSWORD || 'Ea5iP455w02D',
      database: process.env.PG_DATABASE || 'monktraderdb',
      autoLoadModels: true,
      synchronize: false,
    }),
    SequelizeModule.forFeature([Otp,AdminUser]), // Ensure this is added here!
  ],
  exports: [SequelizeModule], // Ensure this is exported
})
export class DatabaseModule {}
