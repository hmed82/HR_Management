import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
    constructor(
        private readonly configService: ConfigService,
    ) { }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10);
        if (isNaN(saltRounds) || saltRounds < 4 || saltRounds > 31) {
            throw new Error('BCRYPT_SALT_ROUNDS must be between 4 and 31');
        }
        try {
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            throw new Error('Hashing failed, error details: ' + error.message);
        }
    }
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

