export interface HowellRequest {
  algorithm: string;
  nonce: string;
  opaque: string;
  qop: string;
  realm: string;
  stale: string;
  [key: string]: any;
}
