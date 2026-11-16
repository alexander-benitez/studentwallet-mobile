import { Location } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { IonApp, IonRouterOutlet, NavController, Platform } from '@ionic/angular';

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

    App.addListener('backButton', () => {
      this.ngZone.run(() => {
        const url = this.router.url;
        if (url === '/welcome' || url === '/login' || url === '/register') {
          App.minimizeApp();
        } else if (url.startsWith('/tabs')) {
          this.navController.navigateRoot('/tabs/tab1');
        } else {
          this.location.back();
        }
      });
    });
  }
}
