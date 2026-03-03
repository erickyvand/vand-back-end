import * as argon2 from 'argon2';

class Argon {
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}

export default Argon;
