const electron = require('electron');
console.log('Electron loaded:', electron);
console.log('app:', electron.app);
console.log('BrowserWindow:', electron.BrowserWindow);

if (electron.app) {
  electron.app.whenReady().then(() => {
    console.log('Electron is ready!');
    electron.app.quit();
  });
} else {
  console.error('ERROR: electron.app is undefined!');
}
