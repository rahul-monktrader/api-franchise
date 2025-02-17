import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminUsersService } from './admin-users.service';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly authService;
    private reflector;
    constructor(authService: AdminUsersService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
