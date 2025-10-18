import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Employee } from '@/employees/entities/employee.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees: Employee[];

  // ********************* for prod when i swich back to mysql or postgres *********************

  // @CreateDateColumn({ type: 'timestamp' })
  // createdAt: Date;

  // @UpdateDateColumn({ type: 'timestamp' })
  // updatedAt: Date;

  // ********************* for dev with sqlite *********************

  @CreateDateColumn({
    type: 'datetime', // Changed from timestamp to datetime for SQLite
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime', // Changed from timestamp to datetime for SQLite
  })
  updatedAt: Date;
}
