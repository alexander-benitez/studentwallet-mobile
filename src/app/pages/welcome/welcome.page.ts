import { AfterViewInit, ChangeDetectorRef, Component, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, trendingUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule],
})
export class WelcomePage implements AfterViewInit, ViewWillEnter {
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private router = inject(Router);

  constructor() {
    addIcons({ cardOutline, trendingUpOutline });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.ngZone.run(() => this.cdr.detectChanges());
    }, 300);
  }

  ionViewWillEnter() {
    setTimeout(() => {
      this.ngZone.run(() => this.cdr.detectChanges());
    }, 100);
  }

  goToLogin() {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  goToRegister() {
    this.router.navigateByUrl('/register', { replaceUrl: true });
  }
}
