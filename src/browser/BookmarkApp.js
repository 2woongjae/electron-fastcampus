const {app, Tray, Menu, BrowserWindow, ipcMain, dialog, clipboard} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const request = require('superagent');
const getTitle = require('get-title');

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
        // this._win.webContents.openDevTools();

        // ipc 설정
        ipcMain.on('type', this._ipcType.bind(this));
        ipcMain.on('paste', this._ipcPaste.bind(this));
        ipcMain.on('remove', this._ipcRemove.bind(this));
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
                            const ignored = this._saveUrl('home', clipboard.readText());
                        }
                    },
                    {
                        label: 'Github',
                        click: () => {
                            const ignored = this._saveUrl('github', clipboard.readText());
                        }
                    },
                    {
                        label: 'Video',
                        click: () => {
                            const ignored = this._saveUrl('video', clipboard.readText());
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

    _ipcPaste(event, arg) {
        const ignored = this._saveUrl(this._type, arg);
    }

    _ipcRemove(event, arg) {
        let index = null;

        // 현재 타입으로 골라내고
        this._data.filter((item, i) => {
            item.index = i;
            return item.type === this._type;
        }).forEach((item, i) => {
           if (i === arg) {
               index = item.index;
           }
        });

        // this._data 그 인덱스를 제거
        this._data.splice(index, 1);

        // 파일로 저장
        fs.writeFileSync(DATA_PATH, JSON.stringify(this._data));

        // 업데이트
        this._update();
    }

    async _saveUrl(type, copiedUrl) {
        if (copiedUrl.indexOf('https') > -1 || copiedUrl.indexOf('http') > -1) {
            let response = null;
            try {
                response = await request.get(copiedUrl);
            } catch(error) {
                dialog.showErrorBox('경고', 'url 은 맞는데, requuest 가 잘못된 것 같아요.');
            }
            if (response) {
                const title = await getTitle(response.res.text);
                this._data.push({
                    url: copiedUrl,
                    title,
                    type
                });
                fs.writeFileSync(DATA_PATH, JSON.stringify(this._data));
                if (type === this._type) {
                    this._update();
                }
            }
        } else {
            dialog.showErrorBox('경고', 'url 이 잘못된 것 같아요.');
        }
    }
}

module.exports = {
    BookmarkApp
};