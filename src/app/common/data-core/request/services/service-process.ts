import { ClassConstructor, plainToInstance } from 'class-transformer';
import { HowellResponse } from '../../models/howell-response.model';
import { PagedList } from '../../models/interface/page-list.model';

export class HowellResponseProcess {
  static array<T>(response: HowellResponse<T[]>, cls: ClassConstructor<T>) {
    if (response.FaultCode === 0) {
      return plainToInstance(cls, response.Data ?? []);
    }
    throw new Error(`${response.FaultCode}:${response.FaultReason}`);
  }
  static item<T>(response: HowellResponse<T>, cls: ClassConstructor<T>) {
    if (response.FaultCode === 0) {
      return plainToInstance(cls, response.Data) as T;
    }
    throw new Error(`${response.FaultCode}:${response.FaultReason}`);
  }
  static data<T>(response: HowellResponse<T>) {
    if (response.FaultCode === 0) {
      return response.Data;
    }
    throw new Error(`${response.FaultCode}:${response.FaultReason}`);
  }

  static basic<T>(response: HowellResponse<T>) {
    if (response.FaultCode === 0) {
      return response.Data;
    }
    throw new Error(`${response.FaultCode}:${response.FaultReason}`);
  }

  static paged<T>(response: HowellResponse<PagedList<T>>, cls: ClassConstructor<T>) {
    if (response.FaultCode === 0) {
      let paged = new PagedList<T>();
      paged.Page = response.Data.Page;
      paged.Data = plainToInstance(cls, response.Data.Data ?? []);
      return paged;
    }
    throw new Error(`${response.FaultCode}:${response.FaultReason}`);
  }
}
