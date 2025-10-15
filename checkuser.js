/*  // checkUser.js
window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('biteboxUser'));
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (!user) {
    window.location.href = 'register.html';
  } else if (!isLoggedIn) {
    window.location.href = 'login.html';
  } else {
    window.location.href = 'index.html';
  }
});*/
