import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuth {
  private readonly clientId = '66886319688-repfu7bd9mt2jeo3me04t66nhoro77lv.apps.googleusercontent.com';
  private userSubject = new BehaviorSubject<GoogleUser | null>(null);
  public user$ = this.userSubject.asObservable();

  private accessToken: string | null = null;
  private idToken: string | null = null;

  constructor(private router: Router) {
    // Restaurar sesión si existe
    this.loadStoredUser();
    // Verificar si venimos de un redirect
    this.handleRedirectCallback();
  }

  private get redirectUri(): string {
    // Funciona tanto en web como en móvil (WebView)
    return window.location.origin + '/tabs/tab1';
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const state = this.generateRandomString(32);
      const nonce = this.generateRandomString(32);

      // Guardar state para validación
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_nonce', nonce);

      const scope = 'openid email profile';
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.clientId}` +
        `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
        `&response_type=token id_token` +  // Implicit flow
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}` +
        `&nonce=${nonce}` +
        `&prompt=select_account`;

      console.log('🔐 Redirigiendo a Google OAuth...');

      // Redirect funciona en web y móvil (WebView)
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Error en signIn:', error);
      throw error;
    }
  }

  private handleRedirectCallback(): void {
    // Verificar si hay tokens en la URL (fragment)
    const hash = window.location.hash;

    if (hash.includes('access_token')) {
      console.log('🔄 Procesando callback de Google...');

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        console.error('❌ Error de OAuth:', error);
        this.clearUrl();
        return;
      }

      // Validar state
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        console.error('❌ State inválido');
        this.clearUrl();
        return;
      }

      if (accessToken && idToken) {
        this.accessToken = accessToken;
        this.idToken = idToken;

        // Mostrar el ID token completo sin decodificar
        console.log('🔐 ID Token completo (sin decodificar):', idToken);

        // Decodificar el ID token para obtener la info del usuario
        const user = this.parseIdToken(idToken);

        if (user) {
          console.log('✅ Usuario autenticado:', user);
          this.userSubject.next(user);
          this.saveUserToStorage(user);
        }

        // Limpiar la URL
        this.clearUrl();
      }

      // Limpiar sesión
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_nonce');
    }
  }

  private parseIdToken(idToken: string): GoogleUser | null {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      console.log('🔑 ID Token decodificado:', {
        email: payload.email,
        nombre: payload.name,
        sub: payload.sub
      });

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub
      };
    } catch (error) {
      console.error('Error parseando ID token:', error);
      return null;
    }
  }

  private clearUrl(): void {
    // Limpiar hash de la URL sin recargar
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
  }

  async signOut(): Promise<void> {
    this.accessToken = null;
    this.idToken = null;
    this.userSubject.next(null);
    localStorage.removeItem('google_user');
    console.log('👋 Sesión cerrada');
  }

  getCurrentUser(): GoogleUser | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  async getIdToken(): Promise<string | null> {
    return this.idToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private saveUserToStorage(user: GoogleUser): void {
    localStorage.setItem('google_user', JSON.stringify(user));
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem('google_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.userSubject.next(user);
        console.log('📦 Usuario restaurado desde storage');
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    }
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }
}