import { Response } from 'express';
import { FranchiseService } from './franchise.service';
export declare class FranchiseeController {
    private readonly franchiseeService;
    constructor(franchiseeService: FranchiseService);
    getFranchiseDetails(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
