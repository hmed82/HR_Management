import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '@/user/dto/create-user.dto';

export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['email'] as const),
) { }