const {ipcRenderer} = require('electron');

class BookmarkView {
    constructor() {
        this._btnHome = document.querySelector('#btn_home');
        this._btnGithub = document.querySelector('#btn_github');
        this._dataDom = document.querySelector('#data');

        // DOM 이벤트에 함수를 바인딩
        this._bindDomEvent();

        // ipc 이벤트에 함수를 바인딩
        this._bindIpcEvent();
    }

    _bindDomEvent() {
        this._btnHome.addEventListener('click', () => {

        });
        this._btnGithub.addEventListener('click', () => {

        });
    }

    _bindIpcEvent() {
        ipcRenderer.on('data', (event, arg) => {
            this._dataDom.innerHTML = this._getHtml(arg);
        });
    }

    _getHtml(data) {
        return data.map(item => {
            return `
                <li class="list-group-item">
                    <div class="media-body">
                        <strong><a href="#" class="clickLink">${item.url}</a></strong>
                        <p>
                            ${item.title}
                            <span class="icon icon-trash pull-right"></span>
                        </p>
                    </div>
                </li>
            `;
        }).join('');
    }
}

module.exports = {
    BookmarkView
};