import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEsCo from '@angular/common/locales/es-CO';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeDe);
registerLocaleData(localeEsCo);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
