import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { DepartmentsService } from '@/departments/departments.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let departmentsService: { findById: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    departmentsService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getRepositoryToken(Employee), useValue: repo },
        { provide: DepartmentsService, useValue: departmentsService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('throws NotFound when the employee does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const baseDto = {
      firstName: 'John',
      lastName: 'Doe',
      departmentId: 1,
    };

    it('rejects employees when the department does not exist', async () => {
      departmentsService.findById.mockRejectedValue(
        new NotFoundException('Department not found'),
      );

      await expect(service.create(baseDto)).rejects.toThrow(NotFoundException);
      expect(departmentsService.findById).toHaveBeenCalledWith(1);
    });

    it('rejects when another employee already uses the same email', async () => {
      departmentsService.findById.mockResolvedValue({ id: 1 });
      repo.findOne.mockResolvedValue({ id: 2, email: 'x@example.com' });

      await expect(
        service.create({ ...baseDto, email: 'x@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an unknown manager', async () => {
      departmentsService.findById.mockResolvedValue({ id: 1 });
      repo.findOne.mockResolvedValue(null); // manager not found

      // findById throws NotFound (manager = an employee that must exist)
      await expect(
        service.create({ ...baseDto, managerId: 77 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('prevents an employee from being their own manager', async () => {
      const employee = { id: 5, email: 'five@example.com', managerId: null };
      repo.findOne.mockResolvedValue(employee); // findById returns employee
      repo.save.mockResolvedValue(employee);

      await expect(service.update(5, { managerId: 5 } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
