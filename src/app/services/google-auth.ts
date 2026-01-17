import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface MicrosoftUser {
  email: string;
  name: string;
  picture?: string;
  sub: string;
  provider: 'microsoft';
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuth {
  private readonly clientId = '66886319688-repfu7bd9mt2jeo3me04t66nhoro77lv.apps.googleusercontent.com';
  private readonly microsoftClientId = 'd5b545d5-3f5a-4524-8123-2ff13bd4ca9d';
  private userSubject = new BehaviorSubject<GoogleUser | null>(null);
  public user$ = this.userSubject.asObservable();

  private accessToken: string | null = null;
  private idToken: string | null = null;
  private currentProvider: 'google' | 'microsoft' | null = null;

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

  private async handleRedirectCallback(): Promise<void> {
    // Verificar si hay tokens en la URL (fragment)
    const hash = window.location.hash;

    if (hash.includes('access_token')) {
      // Detectar si es Google o Microsoft
      const isMicrosoft = sessionStorage.getItem('auth_provider') === 'microsoft';
      console.log(`🔄 Procesando callback de ${isMicrosoft ? 'Microsoft' : 'Google'}...`);

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
        this.currentProvider = isMicrosoft ? 'microsoft' : 'google';

        // Mostrar el ID token completo sin decodificar
        console.log('🔐 ID Token completo (sin decodificar):', idToken);

        // Decodificar el ID token para obtener la info del usuario
        let user: GoogleUser | null = null;

        if (isMicrosoft) {
          user = await this.parseMicrosoftIdToken(idToken);
        } else {
          user = this.parseIdToken(idToken);
        }

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
      sessionStorage.removeItem('auth_provider');
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

  // ==================== MICROSOFT AUTH ====================

  async loginWithMicrosoft(): Promise<void> {
    try {
      const state = this.generateRandomString(32);
      const nonce = this.generateRandomString(32);

      // Guardar state y nonce para validación
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_nonce', nonce);
      sessionStorage.setItem('auth_provider', 'microsoft');

      const redirectUri = this.redirectUri;
      const scope = 'openid profile email User.Read';

      // Usar id_token token para obtener tanto el id_token como el access_token
      const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${this.microsoftClientId}` +
        `&response_type=id_token token` +  // Implicit flow
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}` +
        `&nonce=${nonce}` +
        `&response_mode=fragment` +
        `&prompt=select_account`;

      console.log('🔐 Redirigiendo a Microsoft OAuth...');
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Error en login con Microsoft:', error);
      throw error;
    }
  }

  private async parseMicrosoftIdToken(idToken: string): Promise<GoogleUser | null> {
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

      console.log('📦 Payload completo de Microsoft ID Token:', payload);
      console.log('🔑 ID Token decodificado:', {
        email: payload.email || payload.preferred_username,
        nombre: payload.name,
        sub: payload.sub || payload.oid,
        iss: payload.iss,
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat
      });

      // Obtener la foto de perfil desde Microsoft Graph API
      let pictureUrl = '';
      if (this.accessToken) {
        pictureUrl = await this.getMicrosoftProfilePhoto(this.accessToken);
      }

      return {
        email: payload.email || payload.preferred_username || '',
        name: payload.name || 'Usuario de Microsoft',
        picture: pictureUrl,
        sub: payload.sub || payload.oid
      };
    } catch (error) {
      console.error('Error parseando Microsoft ID token:', error);
      return null;
    }
  }

  private async getMicrosoftProfilePhoto(accessToken: string): Promise<string> {
    try {
      // Primero intentar obtener la URL de la foto desde /me
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        console.log('👤 Datos del usuario de Microsoft Graph:', user);

        // Si la respuesta incluye displayName o givenName
        if (user.displayName && !user.surname) {
          console.log('📸 Obteniendo foto de perfil...');
        }

        // Ahora intentar obtener la foto
        const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (photoResponse.ok) {
          const blob = await photoResponse.blob();
          const photoUrl = URL.createObjectURL(blob);
          console.log('✅ Foto de perfil obtenida correctamente');
          return photoUrl;
        } else {
          console.log('ℹ️ No hay foto de perfil disponible');
          return '';
        }
      } else {
        console.error('Error al obtener datos de Microsoft Graph:', response.status);
        return '';
      }
    } catch (error) {
      console.error('Error obteniendo foto de Microsoft Graph:', error);
      return '';
    }
  }
}