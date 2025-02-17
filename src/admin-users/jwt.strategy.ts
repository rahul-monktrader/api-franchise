import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { AdminUser } from './admin-user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(AdminUser) private readonly adminUserModel: typeof AdminUser) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your_secret_key',
    });
  }

  async validate(payload: any) {
    const user = await this.adminUserModel.findOne({ where: { id: payload.id } });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
