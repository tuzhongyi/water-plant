interface ArrayItem {
  index: number;
  value: number;
}
interface BetweenResult {
  left: ArrayItem;
  right: ArrayItem;
  percent: number;
}
export class ArrayTool {
  /** 寻找最近值 */
  static closest = {
    item: (arr: number[], target: number): ArrayItem | undefined => {
      if (arr.length === 0) return undefined;
      let index = 0;
      let closest = arr[0];
      for (let i = 1; i < arr.length; i++) {
        if (Math.abs(arr[i] - target) < Math.abs(closest - target)) {
          closest = arr[i];
          index = i;
        }
      }
      return {
        index: index,
        value: closest,
      };
    },
    between: (
      array: number[],
      target: number
    ): { left: ArrayItem; right: ArrayItem; percent: number } | undefined => {
      if (array.length < 2) return undefined;

      let leftIndex = 0;
      let rightIndex = array.length - 1;

      // 边界保护
      if (target <= array[0]) {
        return {
          left: { index: 0, value: array[0] },
          right: { index: 1, value: array[1] },
          percent: 0,
        };
      }

      if (target >= array[rightIndex]) {
        return {
          left: { index: rightIndex - 1, value: array[rightIndex - 1] },
          right: { index: rightIndex, value: array[rightIndex] },
          percent: 1,
        };
      }

      // 二分查找区间
      while (leftIndex <= rightIndex) {
        const mid = Math.floor((leftIndex + rightIndex) / 2);

        if (array[mid] === target) {
          return {
            left: { index: mid, value: array[mid] },
            right: { index: mid, value: array[mid] },
            percent: 0,
          };
        }

        if (array[mid] < target) {
          leftIndex = mid + 1;
        } else {
          rightIndex = mid - 1;
        }
      }

      // 此时 rightIndex < leftIndex
      const left = rightIndex;
      const right = leftIndex;

      const leftValue = array[left];
      const rightValue = array[right];

      const percent = (target - leftValue) / (rightValue - leftValue);

      return {
        left: { index: left, value: leftValue },
        right: { index: right, value: rightValue },
        percent,
      };
    },
  };

  /** 分组 */
  static groupBy<TData, TKey extends keyof any = string>(
    array: TData[],
    fn: (item: TData) => TKey
  ): Record<TKey, TData[]> {
    let result = array.reduce((data: any, item) => {
      const key = fn(item);
      if (!data[key]) {
        data[key] = [];
      }
      data[key].push(item);
      return data;
    }, {});
    return result;
    // return Object.values(result);
  }
  /** 去重 */
  static distinct<T>(datas: T[], nullable = true) {
    let items: T[] = [...datas];
    if (!nullable) {
      items = datas.filter((x) => x !== null && x !== undefined);
    }

    return Array.from(new Set<T>(items));
  }

  /**
   * 数组去重（支持对象数组）
   * @param {Array} arr 原始数组
   * @param {String|Function} key 去重依据
   *   - 字符串：如 'id'，则按 item.id 去重
   *   - 函数：(a, b) => boolean，返回 true 表示重复
   * @returns {Array} 去重后的新数组
   */
  static unique<T>(arr: Array<T>, compare?: (a: T, b: T) => boolean) {
    let result: T[] = [];
    const seen = new Set();

    if (compare) {
      arr.forEach((item) => {
        const isDuplicate = result.some((exist) => compare(item, exist));
        if (!isDuplicate) {
          result.push(item);
        }
      });
    } else {
      result = this.distinct(arr);
    }

    return result;
  }

  static compare<T>(a: T[], b: T[], comparator: (a: T, b: T) => boolean) {
    const duplicates: T[] = [];
    const uniqueInA: T[] = [];
    const uniqueInB: T[] = [];

    a.forEach((itemA) => {
      const foundInB = b.some((itemB) => comparator(itemA, itemB));
      if (foundInB) {
        duplicates.push(itemA);
      } else {
        uniqueInA.push(itemA);
      }
    });

    b.forEach((itemB) => {
      const foundInA = a.some((itemA) => comparator(itemA, itemB));
      if (!foundInA) {
        uniqueInB.push(itemB);
      }
    });

    return { duplicates, uniqueInA, uniqueInB };
  }

  static buffer = {
    from: {
      string: (str: string): ArrayBuffer => {
        let encoder = new TextEncoder();
        return encoder.encode(str).buffer;
        // var bytes = new Array();
        // var len, c;
        // len = str.length;
        // for (var i = 0; i < len; i++) {
        //   c = str.charCodeAt(i);
        //   if (c >= 0x010000 && c <= 0x10ffff) {
        //     bytes.push(((c >> 18) & 0x07) | 0xf0);
        //     bytes.push(((c >> 12) & 0x3f) | 0x80);
        //     bytes.push(((c >> 6) & 0x3f) | 0x80);
        //     bytes.push((c & 0x3f) | 0x80);
        //   } else if (c >= 0x000800 && c <= 0x00ffff) {
        //     bytes.push(((c >> 12) & 0x0f) | 0xe0);
        //     bytes.push(((c >> 6) & 0x3f) | 0x80);
        //     bytes.push((c & 0x3f) | 0x80);
        //   } else if (c >= 0x000080 && c <= 0x0007ff) {
        //     bytes.push(((c >> 6) & 0x1f) | 0xc0);
        //     bytes.push((c & 0x3f) | 0x80);
        //   } else {
        //     bytes.push(c & 0xff);
        //   }
        // }
        // var array = new Int8Array(bytes.length);
        // for (var i = 0; i <= bytes.length; i++) {
        //   array[i] = bytes[i];
        // }
        // return array.buffer;
      },
    },
  };
}
