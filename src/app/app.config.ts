import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideToastr } from 'ngx-toastr';
import { GlobalStorage } from './common/storage/global.storage';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const global = inject(GlobalStorage);
      return global.skin.then((skin) => {
        document.documentElement.setAttribute('data-skin', skin);
      });
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideToastr({
      positionClass: 'toast-bottom-right',
      timeOut: 1500,
      extendedTimeOut: 1500,
      closeButton: false,
      progressBar: true,
      progressAnimation: 'increasing',
      tapToDismiss: true,
    }),
  ],
};
