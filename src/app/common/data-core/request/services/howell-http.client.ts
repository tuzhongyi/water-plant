import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { RoutePath } from '../../../../app.path';
import { LocalStorage } from '../../../storage/local.storage';
import { HttpClientParams } from './howell-http.model';

@Injectable({
  providedIn: 'root',
})
export class HowellHttpClient {
  constructor(
    private http: HttpClient,
    private local: LocalStorage,
    private router: Router,
  ) {}

  //获取已授权的头部
  get authorization() {
    let info = this.local.auth.get();
    if (info) {
      return {
        Authorization: `Bearer ${info.token}`,
      };
    }
    throw new Error('未授权');
  }

  async blob(path: string, mime: string) {
    let options = this.getAuth();
    let response = await firstValueFrom(this.http.get(path, { ...options, responseType: 'blob' }));
    return new Blob([response], { type: mime });
  }

  buffer(path: string) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      fetch(path, {
        headers: {
          ...this.authorization,
        },
      }).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  }

  get<R>(path: string, config?: HttpClientParams) {
    let options = this.getAuth(config);
    return this.result(this.http.get<R>(path, options));
  }

  post<R>(path: string): Promise<R>;
  post<T>(path: string, data?: T, config?: HttpClientParams): Promise<T>;
  post<R, T>(path: string, data?: T, config?: HttpClientParams): Promise<R>;

  post<R, T = any>(path: string, data?: T, config?: HttpClientParams) {
    let options = this.getAuth(config);
    return this.result(this.http.post<R>(path, data, options));
  }
  put<R>(path: string): Promise<R>;
  put<T>(path: string, data?: T): Promise<T>;
  put<T, R>(path: string, data?: T): Promise<R>;
  put<R, T = any>(path: string, data?: T, config?: HttpClientParams) {
    let options = this.getAuth(config);
    return this.result(this.http.put<R>(path, data, options));
  }
  delete<R>(path: string, config?: HttpClientParams) {
    let options = this.getAuth(config);
    return this.result(this.http.delete<R>(path, options));
  }
  clear() {
    this.local.auth.clear();
  }

  upload<T, R>(
    path: string,
    data: T,
    event?: { process?: (x: number) => void; completed?: () => void },
  ) {
    let options = this.getAuth();
    return new Promise<R>((resolve) => {
      this.http
        .post(path, data, {
          ...options,
          reportProgress: true,
          observe: 'events',
        })
        .subscribe((e) => {
          if (event && event.process) {
            if (e.type === HttpEventType.UploadProgress) {
              let percent = (e.loaded / (e.total ?? e.loaded)) * 100;

              event.process(percent);
              {
              }
            }
          }

          if (e.type === HttpEventType.Response) {
            if (event) {
              if (event.process) {
                event.process(100);
              }
              if (event.completed) {
                event.completed();
              }
            }

            if (e.body) {
              resolve(e.body as R);
            }
          }
        });
    });
  }

  private getAuth(params?: HttpClientParams) {
    if (params) {
      params.headers = {
        ...params.headers,
        ...this.authorization,
      };
      return params;
    }
    return {
      headers: {
        ...this.authorization,
      },
    };
  }

  private async result<R>(result: Observable<R>) {
    return new Promise<R>((resolve, reject) => {
      firstValueFrom(result)
        .then((x) => {
          resolve(x);
        })
        .catch((e) => {
          if (e.status == 401) {
            this.router.navigateByUrl(RoutePath.login);
            let error = new Error('未授权，请重新登录');
            reject(error);
          } else if (e.status == 200) {
            if (e.error && e.error.text) {
              resolve(e.error.text as R);
            }
          } else {
            reject(e);
          }
        });
    });
  }
}
