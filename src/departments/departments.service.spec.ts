import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getRepositoryToken(Department), useValue: repo },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('returns the department when found', async () => {
      const department = { id: 1, name: 'HR' } as Department;
      repo.findOne.mockResolvedValue(department);

      expect(await service.findById(1)).toBe(department);
    });

    it('throws NotFound when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(42)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('throws Conflict when the name is taken', async () => {
      repo.findOne.mockResolvedValue({ id: 1, name: 'HR' });

      await expect(service.create({ name: 'HR' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates and saves a new department', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ name: 'IT' });
      repo.save.mockResolvedValue({ id: 2, name: 'IT' });

      expect(await service.create({ name: 'IT' })).toEqual({
        id: 2,
        name: 'IT',
      });
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('blocks deletion while employees are assigned to the department', async () => {
      repo.findOne.mockResolvedValue({ id: 1, name: 'HR' });
      jest
        .spyOn(service as any, 'findOneWithEmployees')
        .mockResolvedValue({ id: 1, employees: [{ id: 1 }] });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });
});
