import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TimeEntry } from './time-entry.entity';
import { PayrollRecord } from './payroll-record.entity';

@Entity()
export class Employee {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    employeeId: string;

    @Column()
    department: string;

    @Column('decimal', { precision: 10, scale: 2 })
    hourlyRate: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.employee)
    timeEntries: TimeEntry[];

    @OneToMany(() => PayrollRecord, (payrollRecord) => payrollRecord.employee)
    payrollRecords: PayrollRecord[];
}
