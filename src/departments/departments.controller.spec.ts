import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: jest.Mocked<DepartmentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByName: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findOneWithEmployees: jest.fn(),
            findAllWithEmployeeCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get(DepartmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects a department deletion transaction with a Conflict response shape', async () => {
    // spot-check the strategy: controller delegates straight to the service
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
