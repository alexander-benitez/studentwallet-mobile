import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

const REQUEST_TIMEOUT = 15000;

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

export interface Suggestion {
  id: number;
  user_id: number;
  title: string | null;
  message: string;
  status: 'pendiente' | 'leida' | 'resuelta';
  created_at: string;
  updated_at: string;
}

export interface SuggestionPayload {
  title?: string;
  message: string;
}

export interface BudgetCategory {
  id: number;
  name: string;
  type?: string;
  icon?: string | null;
  color?: string | null;
}

export interface Category extends BudgetCategory {
  type: 'ingreso' | 'gasto';
  icon?: string | null;
  color?: string | null;
  is_default?: boolean;
  user_id?: number | null;
}

export interface CategoryPayload {
  name: string;
  type: 'ingreso' | 'gasto';
  icon?: string;
  color?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number | string;
  month: number;
  year: number;
  spent: number | string;
  percentage: number | string;
  alert: 'normal' | 'advertencia' | 'limite_excedido';
  category?: BudgetCategory;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getSuggestions(): Observable<ApiResponse<Suggestion[]>> {
    return this.http.get<ApiResponse<Suggestion[]>>(
      `${this.apiUrl}/suggestions`,
      { headers: this.getHeaders() }
    );
  }

  createSuggestion(data: SuggestionPayload): Observable<ApiResponse<Suggestion>> {
    return this.http.post<ApiResponse<Suggestion>>(
      `${this.apiUrl}/suggestions`,
      data,
      { headers: this.getHeaders() }
    );
  }

  getBudgets(): Observable<ApiResponse<Budget[]>> {
    return this.http.get<ApiResponse<Budget[]>>(
      `${this.apiUrl}/budgets`,
      { headers: this.getHeaders() }
    ).pipe(timeout(REQUEST_TIMEOUT));
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(
      `${this.apiUrl}/categories`,
      { headers: this.getHeaders() }
    ).pipe(timeout(REQUEST_TIMEOUT));
  }

  createCategory(data: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(
      `${this.apiUrl}/categories`,
      data,
      { headers: this.getHeaders() }
    ).pipe(timeout(REQUEST_TIMEOUT));
  }

  updateCategory(id: number, data: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(
      `${this.apiUrl}/categories/${id}`,
      data,
      { headers: this.getHeaders() }
    ).pipe(timeout(REQUEST_TIMEOUT));
  }

  deleteCategory(id: number): Observable<ApiResponse<Category>> {
    return this.http.delete<ApiResponse<Category>>(
      `${this.apiUrl}/categories/${id}`,
      { headers: this.getHeaders() }
    ).pipe(timeout(REQUEST_TIMEOUT));
  }

  createBudget(data: { category_id: number; amount: number; month: number; year: number }): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(
      `${this.apiUrl}/budgets`,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteBudget(id: number): Observable<ApiResponse<Budget>> {
    return this.http.delete<ApiResponse<Budget>>(
      `${this.apiUrl}/budgets/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
