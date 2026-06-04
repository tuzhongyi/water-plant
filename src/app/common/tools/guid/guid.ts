//表示全局唯一标识符 (GUID)。

export type GuidFormater = 'N' | 'D' | 'B' | 'P';

export class Guid {
  private arr = new Array(); //存放32位数值的数组
  constructor(g?: string) {
    if (typeof g == 'string') {
      //如果构造函数的参数为字符串

      this.InitByString(this.arr, g);
    } else {
      this.InitByOther(this.arr);
    }
  }

  //返回一个值，该值指示 Guid 的两个实例是否表示同一个值。

  Equals(o: Guid) {
    if (o && o.IsGuid) {
      return this.ToString() == o.ToString();
    } else {
      return false;
    }
  }

  //Guid对象的标记

  IsGuid = true;

  //返回 Guid 类的此实例值的 String 表示形式。

  ToString(format?: GuidFormater): string {
    if (typeof format == 'string') {
      if (format == 'N' || format == 'D' || format == 'B' || format == 'P') {
        return this.ToStringWithFormat(this.arr, format) as string;
      } else {
        return this.ToStringWithFormat(this.arr, 'D') as string;
      }
    } else {
      return this.ToStringWithFormat(this.arr, 'D') as string;
    }
  }

  //由字符串加载

  InitByString(arr: Array<string>, g: string) {
    g = g.replace(/\{|\(|\)|\}|-/g, '');

    g = g.toLowerCase();

    if (g.length != 32 || g.search(/[^0-9,a-f]/i) != -1) {
      this.InitByOther(arr);
    } else {
      for (let i = 0; i < g.length; i++) {
        arr.push(g[i]);
      }
    }
  }

  //由其他类型加载

  InitByOther(arr: Array<string>) {
    let i = 32;

    while (i--) {
      arr.push('0');
    }
  }

  /*

  根据所提供的格式说明符，返回此 Guid 实例值的 String 表示形式。

  N  32 位： xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

  D  由连字符分隔的 32 位数字 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

  B  括在大括号中、由连字符分隔的 32 位数字：{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}

  P  括在圆括号中、由连字符分隔的 32 位数字：(xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

  */

  ToStringWithFormat(arr: Array<string>, format: string): string | Guid {
    let result: string | Guid;
    switch (format) {
      case 'N':
        return arr.toString().replace(/,/g, '');
      case 'D':
        result =
          arr.slice(0, 8) +
          '-' +
          arr.slice(8, 12) +
          '-' +
          arr.slice(12, 16) +
          '-' +
          arr.slice(16, 20) +
          '-' +
          arr.slice(20, 32);

        result = result.replace(/,/g, '');

        return result;

      case 'B':
        result = this.ToStringWithFormat(arr, 'D');

        result = '{' + result + '}';

        return result;

      case 'P':
        result = this.ToStringWithFormat(arr, 'D');

        result = '(' + result + ')';

        return result;

      default:
        return new Guid();
    }
  }

  //初始化 Guid 类的一个新实例。

  static NewGuid() {
    let g = '';

    let i = 32;

    while (i--) {
      g += Math.floor(Math.random() * 16.0).toString(16);
    }

    return new Guid(g);
  }

  //Guid 类的默认实例，其值保证均为零。
  static Empty = new Guid();
}
