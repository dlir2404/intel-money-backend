import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
// import { CreateUserRequest } from './user.dto';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuth, CurrentUserId, UserAuth } from 'src/shared/decorators/auth';
import { ChangeAvatarRequest } from './user.dto';
import { BaseResponse } from 'src/shared/types/base';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post('')
  // @AdminAuth()
  // async createUser(@Body() body: CreateUserRequest) {
  //   return this.userService.createUser(body);
  // } 


  @Post('change-avatar')
  @UserAuth()
  async changeAvatar(@Body() body: ChangeAvatarRequest, @CurrentUserId() userId: number) {
    await this.userService.changeAvatar(body.url, userId);
    return new BaseResponse({
      result: true,
    })
  }
}
