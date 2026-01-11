import { AfterViewInit, Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { GoogleAuth } from '../services/google-auth';
import { TestBackendService } from '../services/test-backend.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonButton, IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab1Page implements AfterViewInit {

  constructor(private googleAuth: GoogleAuth, private testBackend: TestBackendService) { }

  prueba() {
    this.testBackend.testGet('public/saludo').subscribe({
      next: (data) => console.log('Respuesta: ', data),
      error: (error) => console.error('Error: ', error)
    });
  }

  async ngAfterViewInit() {
    console.log(window.location.origin);
    try {
      await this.googleAuth.initialize(this.handleGoogleLogin);
      await this.googleAuth.renderButton('google-btn');
    } catch (error) {
      console.error('Error loading Google Sign-In:', error);
    }
  }

  private handleGoogleLogin(idToken: string): void {
    console.log('ID Token:', idToken);
    // Aquí puedes enviar el token a tu backend
  }
}
