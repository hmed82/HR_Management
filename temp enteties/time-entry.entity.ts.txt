import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity()
export class TimeEntry {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, (employee) => employee.timeEntries, { onDelete: 'CASCADE' })
    employee: Employee;

    @Column()
    date: Date;

    @Column({ type: 'time' })
    clockIn: string;

    @Column({ type: 'time' })
    clockOut: string;

    @Column('decimal', { precision: 5, scale: 2 })
    totalHours: number;

    @CreateDateColumn()
    createdAt: Date;
}
