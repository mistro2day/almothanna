import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers() {
    return this.usersService.findAll();
  }

  @Post()
  async createUser(
    @Body()
    dto: {
      name: string;
      phone: string;
      email?: string;
      password?: string;
      role: Role;
    },
  ) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      phone?: string;
      email?: string;
      role?: Role;
      password?: string;
    },
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
