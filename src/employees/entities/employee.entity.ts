import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Department } from '@/departments/entities/department.entity';

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
    @ManyToOne(() => Department, (department) => department.employees, { nullable: true })
    @JoinColumn({ name: 'departmentId' })
    department: Department;

    // For easier acces
    @Column({ nullable: true })
    departmentId: number;


    // *************** i will add this functionality later ***************
    // // Self-referential: Employee can have a manager
    // @ManyToOne(() => Employee, (employee) => employee.subordinates, { nullable: true })
    // @JoinColumn({ name: 'managerId' })
    // manager: Employee;

    // // For easier acces
    // @Column({ nullable: true })
    // managerId: number;

    // // One-to-many: Employee can manage other employees
    // @ManyToOne(() => Employee, (employee) => employee.manager)
    // subordinates: Employee[];

    // *******************************************************************

    @Column({ type: 'boolean', default: true })
    isActive: boolean;


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