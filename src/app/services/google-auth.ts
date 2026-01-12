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

    // Inicializar el cliente OAuth2 con ux_mode popup
    this.client = google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response: any) => {
        if (response.access_token) {
          // Obtener información del usuario con el access token
          const userInfo = await this.getUserInfo(response.access_token);
          callback({
            accessToken: response.access_token,
            user: userInfo
          });
        }
      },
    });
  }

  async signInWithPopup(): Promise<void> {
    await this.googleReady;
    if (this.client) {
      this.client.requestAccessToken();
    } else {
      throw new Error('Google client not initialized. Call initialize() first.');
    }
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
}