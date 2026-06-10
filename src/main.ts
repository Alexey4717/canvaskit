import './app/styles/app.css';

const app = document.querySelector<HTMLDivElement>('.app');

if (app) {
  const status = document.createElement('p');
  status.className = 'status';
  status.textContent = 'Скрипт src/main.ts подключен и выполняется.';
  app.appendChild(status);
}
