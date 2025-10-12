import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashUtil {
    constructor(private configService: ConfigService) { }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
        const salt = await bcrypt.genSalt(saltRounds);
        return bcrypt.hash(password, salt);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
