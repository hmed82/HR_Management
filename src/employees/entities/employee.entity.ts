import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '@/departments/entities/department.entity';
import { TimeEntry } from '@/time-entries/entities/time-entry.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'date', nullable: true })
  terminationDate: Date;

  // Relationship: Employee belongs to Department
  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  // For easier access
  @Column({ nullable: true })
  departmentId: number;

  // Relationship: Employee can have multiple time entries
  @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.employee)
  timeEntries: TimeEntry[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // ********************* for prod when i switch back to mysql or postgres *********************

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
