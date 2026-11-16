import { Location } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { AlertController, IonApp, IonRouterOutlet, ModalController, NavController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private router: Router,
    private navController: NavController,
    private ngZone: NgZone,
    private location: Location,
    private modalController: ModalController,
    private alertController: AlertController,
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    
    const { value: token } = await Preferences.get({ key: 'auth_token' });
    if (token && token.trim().length > 0) {
      localStorage.setItem('auth_token', token);
      const { value: userInfo } = await Preferences.get({ key: 'user_info' });
      if (userInfo) localStorage.setItem('user_info', userInfo);
      this.navController.navigateRoot('/tabs/tab1', { animated: false });
    }

    App.addListener('backButton', async () => {
      const topAlert = await this.alertController.getTop();
      if (topAlert) {
        await topAlert.dismiss();
        return;
      }

      const topModal = await this.modalController.getTop();
      if (topModal) {
        await topModal.dismiss();
        return;
      }

      this.ngZone.run(() => {
        const cleanUrl = this.router.url.split('?')[0].split('#')[0];

        if (cleanUrl === '/reset-password') {
          this.navController.navigateBack('/login');
        } else if (cleanUrl === '/login' || cleanUrl === '/register') {
          this.navController.navigateBack('/welcome');
        } else if (cleanUrl === '/welcome' || cleanUrl === '/' || cleanUrl === '') {
          App.minimizeApp();
        } else if (cleanUrl === '/tabs/tab1' || cleanUrl === '/tabs') {
          App.minimizeApp();
        } else if (cleanUrl.startsWith('/tabs/') || cleanUrl === '/tab4') {
          this.navController.navigateRoot('/tabs/tab1');
        } else {
          this.location.back();
        }
      });
    });
  }
}
