import { ACCESS_TOKEN } from './common';
import './style.css';
const APP_URL = window.location.origin;


document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem(ACCESS_TOKEN)) {
    window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  } else {
    window.location.href = `${APP_URL}/login/login.html`;
  }
})