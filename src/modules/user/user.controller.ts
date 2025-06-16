import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
// import { CreateUserRequest } from './user.dto';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuth, CurrentUserId, UserAuth } from 'src/shared/decorators/auth';
import {ChangeAvatarRequest, ChangeCurrencyRequest, ChangeTimezoneRequest} from './user.dto';
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

  @Post('change-timezone')
  @UserAuth()
  async changeTimeZone(@Body() body: ChangeTimezoneRequest, @CurrentUserId() userId: number) {
    await this.userService.changeTimeZone(body.timezone, userId);
    return new BaseResponse({
      result: true,
    })
  }

  @Post('change-currency')
  @UserAuth()
  async changeCurrency(@Body() body: ChangeCurrencyRequest, @CurrentUserId() userId: number) {
    await this.userService.changeCurrency(body.currency, userId);
    return new BaseResponse({
      result: true,
    })
  }

  @Post('reset-data')
  @UserAuth()
  async resetData(@CurrentUserId() userId: number) {
    await this.userService.resetData(userId);
    return new BaseResponse({
      result: true,
    });
  }
}
