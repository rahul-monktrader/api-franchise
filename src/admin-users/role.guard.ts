import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from './roles.decorator'; // We'll create this decorator soon

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) {
      return true; // No role required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is added to the request after successful login

    if (!user) {
      throw new UnauthorizedException('No user found');
    }

    const hasRole = requiredRoles.some(role => user.role === role);
    if (!hasRole) {
      throw new UnauthorizedException('You do not have permission to access this resource');
    }

    return true;
  }
}
