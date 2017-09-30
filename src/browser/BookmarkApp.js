const {app, Tray, Menu, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

const HTML = url.format({
    protocol: 'file',
    pathname: path.join(__dirname, '../../static/index.html')
});

const DATA_PATH = path.join(app.getPath('userData'), 'data.json');

class BookmarkApp {
    constructor() {
        this._tray = null;
        this._win = null;
        this._data = null;
        this._type = 'home';
        app.on('ready', this._ready.bind(this));
    }

    _ready() {
        console.log('_ready');
        this._initData();

        // 트레이 설정
        this._tray = new Tray(path.join(__dirname, '../../static/icon.png'));
        this._tray.setContextMenu(this._getTrayMenu());
        const eventName = (process.platform === 'win32') ? 'click' : 'right-click';
        this._tray.on(eventName, this._toggle.bind(this));

        const bounds = this._tray.getBounds();

        // 브라우저 윈도우 설정
        this._win = new BrowserWindow({
            x: bounds.x + Math.round(bounds.width / 2) - 200,
            y: (process.platform === 'win32') ? bounds.y - 400 - 10 : bounds.height + 10,
            width: 400,
            height: 400,
            resizable: false,
            movable: false,
            show: false,
            frame: false
        });
        this._win.once('ready-to-show', this._update.bind(this));
        this._win.on('blur', () => {
            this._win.hide();
        });
        this._win.loadURL(HTML);
        this._win.webContents.openDevTools();

        // ipc 설정
        ipcMain.on('type', this._ipcType.bind(this));
    }

    _getTrayMenu() {
        return Menu.buildFromTemplate([
            {
                label: 'Open',
                click: () => {
                    this._win.show();
                }
            },
            {
                label: 'Save',
                submenu: [
                    {
                        label: 'Home',
                        click: () => {

                        }
                    },
                    {
                        label: 'Github',
                        click: () => {

                        }
                    }
                ]
            },
            {type: 'separator'},
            {
                label: 'Quit',
                click: () => {
                    app.quit();
                }
            }
        ]);
    }

    _toggle() {
        if (this._win.isVisible()) {
            this._win.hide();
        } else {
            this._win.show();
        }
    }

    _initData() {
        // 프로그램 최초 실행 시
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, JSON.stringify([]));
        }
        const data = fs.readFileSync(DATA_PATH);
        this._data = JSON.parse(data.toString());
    }

    _update() {
        const data = this._data.filter(item => item.type === this._type);
        this._win.webContents.send('data', data);
    }

    _ipcType(event, arg) {
        this._type = arg;
        this._update();
    }
}

module.exports = {
    BookmarkApp
};