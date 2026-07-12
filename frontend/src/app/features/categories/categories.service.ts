import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Category, CategoryRequest } from './categories.models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API_BASE_URL}/api/categories`);
  }

  create(request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${API_BASE_URL}/api/categories`, request);
  }

  deactivate(categoryId: string): Observable<Category> {
    return this.http.patch<Category>(`${API_BASE_URL}/api/categories/${categoryId}/deactivate`, {});
  }

  activate(categoryId: string): Observable<Category> {
    return this.http.patch<Category>(`${API_BASE_URL}/api/categories/${categoryId}/activate`, {});
  }
}
