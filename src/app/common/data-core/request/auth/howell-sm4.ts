import { sm4 } from 'sm-crypto';

export class HowellSM4 {
  private key = 'howell6592440522';
  private iv = 'howell1234567890';

  encrypt(password: string): string {
    let keys: number[] = [];
    for (let i = 0; i < this.key.length; i++) {
      keys.push(this.key.charCodeAt(i));
    }
    let ivs: number[] = [];
    for (let i = 0; i < this.iv.length; i++) {
      ivs.push(this.iv.charCodeAt(i));
    }
    let data = sm4.encrypt(password, keys, { mode: 'cbc', iv: ivs });
    return data;
  }

  decrypt(password: string): string {
    let keys: number[] = [];
    for (let i = 0; i < this.key.length; i++) {
      keys.push(this.key.charCodeAt(i));
    }
    let ivs: number[] = [];
    for (let i = 0; i < this.iv.length; i++) {
      ivs.push(this.iv.charCodeAt(i));
    }
    let data = sm4.decrypt(password, keys, { mode: 'cbc', iv: ivs });
    return data;
  }

  static encrypt(password: string): string {
    let sm4 = new HowellSM4();
    return sm4.encrypt(password);
  }

  static decrypt(password: string): string {
    let sm4 = new HowellSM4();
    return sm4.decrypt(password);
  }
}
