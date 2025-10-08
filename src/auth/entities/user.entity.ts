import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity('users') // good practice: plural table name
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column()
    password: string;

    @Column({ nullable: true })
    name?: string;

    // ********************* for prod when i swich back to mysql or postgres *********************

    // @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
    // role: 'admin' | 'user';

    // @CreateDateColumn({ type: 'timestamp' })
    // createdAt: Date;

    // @UpdateDateColumn({ type: 'timestamp' })
    // updatedAt: Date;



    // ********************* for dev with sqlite *********************

    @Column({
        type: 'varchar',  // Changed from enum to varchar
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @UpdateDateColumn({
        type: 'datetime',  // Changed from timestamp to datetime for SQLite
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'datetime',  // Changed from timestamp to datetime for SQLite
    })
    updatedAt: Date;
}
