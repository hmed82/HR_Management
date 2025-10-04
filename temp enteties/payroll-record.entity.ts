import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity()
export class PayrollRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, (employee) => employee.payrollRecords, { onDelete: 'CASCADE' })
    employee: Employee;

    @Column()
    periodStart: Date;

    @Column()
    periodEnd: Date;

    @Column('decimal', { precision: 6, scale: 2 })
    totalHours: number;

    @Column('decimal', { precision: 10, scale: 2 })
    grossPay: number;

    @CreateDateColumn()
    calculatedAt: Date;
}
