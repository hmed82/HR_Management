import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string; // store hashed password

    @Column({ default: 'user' })
    role: string;

    @CreateDateColumn()
    createdAt: Date;
}
