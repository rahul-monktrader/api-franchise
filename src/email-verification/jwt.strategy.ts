import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY || 'secretkey', // Ensure the secret key is correct
    });
  }

  async validate(payload: any) {
   

    if (!payload || !payload.franchiseId) {
      throw new UnauthorizedException('Invalid token. Franchise ID missing.');
    }

    // Attach `franchiseId` to request
    return {
      franchiseId: payload.franchiseId,
      email: payload.email,
      franchise_code: payload.franchise_code,
    };
  }
}
