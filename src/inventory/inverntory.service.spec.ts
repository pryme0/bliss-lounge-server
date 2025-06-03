import { Test, TestingModule } from '@nestjs/testing';
import { InverntoryService } from './inventory.service';

describe('InverntoryService', () => {
  let service: InverntoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InverntoryService],
    }).compile();

    service = module.get<InverntoryService>(InverntoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
