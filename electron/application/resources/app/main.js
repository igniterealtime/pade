const {app, BrowserWindow, Menu} = require('electron')
Menu.setApplicationMenu(false)

let win

function createWindow () {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      nodeIntegration: false
    }
  })

  win.loadURL('${pade.url}')

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault()
    callback(true)
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
