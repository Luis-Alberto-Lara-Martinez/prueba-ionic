import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleAuth {
  private googleReady: Promise<void>;
  private client: any;
  private readonly clientId = '66886319688-repfu7bd9mt2jeo3me04t66nhoro77lv.apps.googleusercontent.com';

  constructor() {
    this.googleReady = this.waitForGoogle();
  }

  private waitForGoogle(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof google !== 'undefined' && google.accounts) {
        return resolve();
      }
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  async initialize(callback: (response: any) => void): Promise<void> {
    await this.googleReady;

    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: any) => {
        if (response.credential) {
          const payload = this.parseJwt(response.credential);
          callback({
            idToken: response.credential,
            user: {
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              sub: payload.sub,
              ...payload
            }
          });
        }
      }
    });
  }

  async renderButton(element: HTMLElement): Promise<void> {
    await this.googleReady;
    google.accounts.id.renderButton(
      element,
      { theme: 'outline', size: 'large' }  // customization attributes
    );
  }

  // Helper to parse JWT token without external libraries
  private parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT', e);
      return {};
    }
  }

  // Deprecated: OAuth2 popup flow
  async signInWithPopup(): Promise<void> {
    console.warn('signInWithPopup is deprecated for ID Token flow. Use the rendered Google Button.');
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    // No longer needed for ID token flow as info is in the token
    return null;
  }
}