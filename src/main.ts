import './app/styles/app.css';

import { bootstrapApp } from './app/bootstrap';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Root element #app didn`t found.');
}

void bootstrapApp(app);
