import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TestBackendService {
    // URL base de tu backend de Spring Boot
    private apiUrl = 'http://localhost:8080/';

    constructor(private http: HttpClient) { }

    /**
     * Método de prueba para hacer una petición GET a tu backend
     * @param endpoint - El endpoint específico (ej: '/usuarios', '/productos')
     * @returns Observable con la respuesta del backend
     */
    testGet(endpoint: string): Observable<any> {
        const url = `${this.apiUrl}${endpoint}`;
        return this.http.get(url);
    }

    /**
     * Método de prueba con headers personalizados
     * @param endpoint - El endpoint específico
     * @param headers - Headers adicionales (opcional)
     * @returns Observable con la respuesta del backend
     */
    testGetWithHeaders(endpoint: string, headers?: any): Observable<any> {
        const url = `${this.apiUrl}${endpoint}`;
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                ...headers
            })
        };
        return this.http.get(url, httpOptions);
    }

    /**
     * Método para obtener datos con parámetros de query
     * @param endpoint - El endpoint específico
     * @param params - Parámetros de query (ej: {id: 1, nombre: 'test'})
     * @returns Observable con la respuesta del backend
     */
    testGetWithParams(endpoint: string, params: any): Observable<any> {
        const url = `${this.apiUrl}${endpoint}`;
        return this.http.get(url, { params });
    }

    /**
     * Método para cambiar la URL base del API
     * @param newUrl - Nueva URL base
     */
    setApiUrl(newUrl: string): void {
        this.apiUrl = newUrl;
    }

    /**
     * Método para obtener la URL actual del API
     * @returns URL base actual
     */
    getApiUrl(): string {
        return this.apiUrl;
    }
}
