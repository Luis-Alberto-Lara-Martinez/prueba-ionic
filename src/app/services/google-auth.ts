import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleAuth {
  private googleReady: Promise<void>;

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

  async initialize(callback: (idToken: string) => void): Promise<void> {
    await this.googleReady;
    google.accounts.id.initialize({
      client_id: '66886319688-repfu7bd9mt2jeo3me04t66nhoro77lv.apps.googleusercontent.com',
      callback: (response: any) => callback(response.credential)
    });
  }

  async renderButton(elementId: string, config?: any): Promise<void> {
    await this.googleReady;
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with id '${elementId}' not found`);

    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      ...config
    });
  }

  async prompt(): Promise<void> {
    await this.googleReady;
    google.accounts.id.prompt();
  }
}