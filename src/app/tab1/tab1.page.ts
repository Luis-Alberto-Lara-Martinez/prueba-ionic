import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { GoogleAuth } from '../services/google-auth';
import { TestBackendService } from '../services/test-backend.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab1Page implements OnInit {
  user$ = this.googleAuth.user$;

  constructor(
    private googleAuth: GoogleAuth,
    private testBackend: TestBackendService
  ) { }

  ngOnInit() {
    // Monitorear cambios de autenticación
    this.user$.subscribe(user => {
      if (user) {
        console.log('👤 Usuario en componente:', {
          email: user.email,
          nombre: user.name
        });
      }
    });
  }

  async signInWithGoogle() {
    try {
      await this.googleAuth.signInWithGoogle();
    } catch (error) {
      console.error('Error en login:', error);
    }
  }

  async signOut() {
    await this.googleAuth.signOut();
  }

  prueba() {
    this.testBackend.testGet('public/saludo').subscribe({
      next: (data) => console.log('Respuesta backend:', data),
      error: (error) => console.error('Error backend:', error)
    });
  }
}
