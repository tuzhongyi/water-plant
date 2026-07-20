import { ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer';
import { ObjectConverterTool } from './converter/object-converter.tool';
import { ObjectModelTool } from './object-model.tool';

export class ObjectTool {
  static model = new ObjectModelTool();
  static convert = new ObjectConverterTool();
  static keys(obj: Object, opts: 'porperty' | 'value' | 'all' = 'all') {
    let keys: string[];
    if (opts === 'porperty') {
      keys = [];
    } else if (opts === 'value') {
      keys = Object.keys(obj);
      return keys;
    } else {
      keys = Object.keys(obj);
    }

    let property = Object.getPrototypeOf(obj);
    for (const name of Object.getOwnPropertyNames(property)) {
      if (name === 'constructor') {
        continue;
      }
      keys.push(name);
    }
    return keys;
  }

  static copy<T>(data: T, type: ClassConstructor<T>, retains: string[] = []) {
    let retained = new Map<string, any>();
    if (retains.length > 0) {
      let _data = data as any;
      retains.forEach((key) => {
        if (_data[key] != undefined) {
          retained.set(key, _data[key]);
        }
      });
    }
    let plain = instanceToPlain(data);
    let copied = plainToInstance(type, plain);
    if (retained.size > 0) {
      for (const key in retained) {
        if (retained.has(key)) {
          (copied as any)[key] = retained.get(key);
        }
      }
    }
    return copied;
  }

  /**
   * 核心方法：将源对象同名同类型的属性赋值给目标类实例
   * @param from 源对象（任意普通对象）
   * @param to 目标类的构造函数
   * @returns 目标类的实例（仅包含同名同类型的赋值属性）
   */
  static assign<TFrom extends Record<string, any>, TTo extends object>(
    from: TFrom,
    to: ClassConstructor<TTo>,
  ): TTo {
    // 1. 创建目标类的实例
    const targetInstance = new to();

    // 2. 获取源对象和目标对象的所有自身可枚举属性
    const sourceKeys = Object.keys(from);
    const targetKeys = Object.keys(targetInstance);

    // 3. 遍历属性，仅赋值【同名 + 同类型】的属性
    for (const key of sourceKeys) {
      // 跳过目标对象不存在的属性
      if (!targetKeys.includes(key)) continue;

      const sourceValue = from[key];
      const targetValue = (targetInstance as any)[key];

      // 获取源值和目标值的原始类型（排除 null/undefined 干扰）
      const sourceType = sourceValue === null ? 'null' : typeof sourceValue;
      const targetType = targetValue === null ? 'null' : typeof targetValue;

      // 仅当类型完全一致时赋值

      (targetInstance as any)[key] = sourceValue;
    }

    return targetInstance;
  }

  static clone<T>(target: T, weakMap = new WeakMap()): T {
    // 处理 null 和 基础类型
    if (target === null || typeof target !== 'object') {
      return target;
    }

    // 避免循环引用
    if (weakMap.has(target as object)) {
      return weakMap.get(target as object);
    }

    let clone: any;

    // 处理 Date
    if (target instanceof Date) {
      clone = new Date(target);
      return clone as T;
    }

    // 处理 RegExp
    if (target instanceof RegExp) {
      clone = new RegExp(target.source, target.flags);
      return clone as T;
    }

    // 处理 Map
    if (target instanceof Map) {
      clone = new Map();
      weakMap.set(target, clone);
      target.forEach((value, key) => {
        clone.set(key, this.clone(value, weakMap));
      });
      return clone as T;
    }

    // 处理 Set
    if (target instanceof Set) {
      clone = new Set();
      weakMap.set(target, clone);
      target.forEach((value) => {
        clone.add(this.clone(value, weakMap));
      });
      return clone as T;
    }

    // 处理数组和普通对象
    clone = Array.isArray(target) ? [] : {};
    weakMap.set(target, clone);

    Object.keys(target as object).forEach((key) => {
      (clone as any)[key] = this.clone((target as any)[key], weakMap);
    });

    return clone as T;
  }

  static serialize<T>(source: Record<string, any>, clazz: new () => T): T {
    // 1. 创建 Class 实例（保留原始类型）
    const instance = new clazz();

    // 2. 安全获取 Class 自身的所有属性名
    const classKeys = Object.keys(instance as object);

    // 3. 只赋值 Class 中存在的字段
    for (const key of classKeys) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        (instance as Record<string, any>)[key] = source[key];
      }
    }

    // ✅ 返回的是 真正的 Class 实例，不是普通 object
    return instance;
  }
}
