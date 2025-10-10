import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '@/user/dto/login.dto';
import { CryptoService } from '@/user/services/crypto.service';
import { UserService } from '@/user/services/user.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly cryptoService: CryptoService,
    ) { }


    // async login(loginDto: LoginDto): Promise<{ accessToken: string }> {    //********prod//********/
    async login(loginDto: LoginDto): Promise<{ accessToken: string } | string> { //********dev before making jwt logic********/
        const user = await this.userService.findByEmail(loginDto.email)
        if (!user || !(await this.cryptoService.comparePassword(loginDto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        // const accessToken = this.generateAccessToken(user);
        // return { accessToken };
        return "token";
    }

    async logout() {
        // With stateless JWT, logout is handled client-side
        // (you can implement token blacklist if needed)
        // what i will probably do is to have a refresh token and store it in the user table and delete it on logout and blacklist the access token for its remaining time to live
        return { message: 'Logged out successfully' };
    }
}

