import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
    );
  }
}
