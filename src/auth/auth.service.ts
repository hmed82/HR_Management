import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor() { }

    private async hashPassword() {
        // Password hashing logic here
    }

    async register() {
        // Registration logic here
    }

    async login() {
        // Login logic here
    }

    async logout() {
        // Logout logic here
    }

    async findByEmail() {
        // Find user by email logic here
    }

    async findById() {
        // Find user by ID logic here
    }

    async updateUser() {
        // Update user logic here
    }
}


// 2.2 Build Auth Components

// [x] Create User entity(for HR users - id, email, password hash, role, createdAt)
// [ ] Build AuthService with methods for registration, login, and token validation
// [ ] Implement password hashing using bcrypt
// [ ] Create JWT strategy for token validation
// [ ] Build JWT guard for route protection