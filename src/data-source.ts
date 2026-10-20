import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { User } from './users/entities/user.entity';
import { Employee } from './employees/entities/employee.entity';
import { Department } from './departments/entities/department.entity';
import { TimeEntry } from './time-entries/entities/time-entry.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: join(__dirname, '..', 'db.sqlite'), // project root db.sqlite
  entities: [User, Employee, Department, TimeEntry], // import your entities directly
  migrations: [join(__dirname, 'db', 'migrations', '*{.ts,.js}')],
  synchronize: false,
});
