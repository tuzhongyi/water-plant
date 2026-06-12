import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigResponse, ApiSaveResponse, ModelFile, ModelConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getModels(): Observable<ModelFile[]> {
    return this.http.get<ModelFile[]>('/api/models');
  }

  scanModels(): Observable<ModelFile[]> {
    return this.http.post<ModelFile[]>('/api/models/scan', {});
  }

  getConfig(): Observable<ApiConfigResponse> {
    return this.http.get<ApiConfigResponse>('/api/config');
  }

  saveConfig(data: ModelConfig): Observable<ApiSaveResponse> {
    return this.http.post<ApiSaveResponse>('/api/config', data);
  }
}
