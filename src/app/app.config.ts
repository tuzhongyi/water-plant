import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideToastr } from 'ngx-toastr';
import { ConfigRequestService } from './common/data-core/request/config/config-request.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const config = inject(ConfigRequestService);
      return config.get().then((cfg) => {
        document.documentElement.setAttribute('data-skin', cfg.skin ?? 'green');
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
