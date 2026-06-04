export interface HowellResponseBase {
  FaultCode: number
  FaultReason: string
  InnerException: ExceptionData
  Id: string
}

export interface HowellResponse<T = any> extends HowellResponseBase {
  Data: T
}

interface ExceptionData {
  Message: string
  ExceptionType: string
  InnerException: ExceptionData
}

export interface HowellHttpResponse<T> {
  data: HowellResponse<T>
  status: number
  statusText: string
}
