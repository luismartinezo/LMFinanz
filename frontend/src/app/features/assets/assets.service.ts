import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Asset, AssetRequest } from './assets.models';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${API_BASE_URL}/api/assets`);
  }

  create(request: AssetRequest): Observable<Asset> {
    return this.http.post<Asset>(`${API_BASE_URL}/api/assets`, request);
  }

  retire(assetId: string): Observable<Asset> {
    return this.http.patch<Asset>(`${API_BASE_URL}/api/assets/${assetId}/retire`, {});
  }

  activate(assetId: string): Observable<Asset> {
    return this.http.patch<Asset>(`${API_BASE_URL}/api/assets/${assetId}/activate`, {});
  }
}
