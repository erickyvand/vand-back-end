import { Injectable } from '@nestjs/common';
import Argon from '../argon/argon';

@Injectable()
class AdminService {
  private readonly argon = new Argon();

  async createUser(body: any): Promise<any> {
    const userBody = {
      ...body,
      password: await this.argon.hashPassword('password'),
      userType: 'Internal'
    }
    return userBody;
  }
}

export default AdminService;
