import { Test, TestingModule } from '@nestjs/testing';
import { FranchiseeController } from './franchise.controller';

describe('FranchiseController', () => {
  let controller: FranchiseeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FranchiseeController],
    }).compile();

    controller = module.get<FranchiseeController>(FranchiseeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
