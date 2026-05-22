import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../../database/entities/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async login(name: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { name } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: admin.id, name: admin.name };
    return { access_token: this.jwtService.sign(payload) };
  }
}
