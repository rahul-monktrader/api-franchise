import { Strategy } from 'passport-jwt';
import { AdminUser } from './admin-user.model';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly adminUserModel;
    constructor(adminUserModel: typeof AdminUser);
    validate(payload: any): Promise<AdminUser>;
}
export {};
