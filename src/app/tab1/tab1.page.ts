import { AfterViewInit, Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { GoogleAuth } from '../services/google-auth';
import { TestBackendService } from '../services/test-backend.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab1Page implements AfterViewInit {

  constructor(private googleAuth: GoogleAuth, private testBackend: TestBackendService) {
    addIcons({ logoGoogle });
  }

  prueba() {
    this.testBackend.testGet('public/saludo').subscribe({
      next: (data) => console.log(data),
      error: (error) => console.error('Error: ', error)
    });
  }

  async ngAfterViewInit() {
    console.log(window.location.origin);
    try {
      await this.googleAuth.initialize(this.handleGoogleLogin.bind(this));
    } catch (error) {
      console.error('Error loading Google Sign-In:', error);
    }
  }

  async signInWithGoogle() {
    try {
      await this.googleAuth.signInWithPopup();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }

  private handleGoogleLogin(response: any): void {
    console.log('Access Token:', response.accessToken);
    console.log('Usuario:', response.user);
    console.log('Email:', response.user.email);
    console.log('Nombre:', response.user.name);
    console.log('Foto:', response.user.picture);
    console.log('ID único de Google:', response.user.sub);

    // Aquí puedes enviar el accessToken a tu backend para validarlo
  }
}
