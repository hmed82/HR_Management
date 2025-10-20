import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '@/employees/entities/employee.entity';
import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn()
  id: number;

  // Relationship: TimeEntry belongs to Employee
  @ManyToOne(() => Employee, (employee) => employee.timeEntries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  // For easier access / queries
  @Column()
  employeeId: number;

  @Column()
  date: string; // YYYY-MM-DD

  // Spec uses clockIn / clockOut
  @Column({ type: 'time' })
  clockIn: string; // HH:mm:ss

  @Column({ type: 'time', nullable: true })
  clockOut: string | null; // HH:mm:ss

  // V1: status about completeness of data
  @Column({
    type: 'varchar',
    length: 20,
    default: TimeEntryStatus.INCOMPLETE,
  })
  status: TimeEntryStatus;

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
