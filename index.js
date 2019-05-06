exports = module.exports = DownloadingBar;

function DownloadingBar(fmt, options) {
    this.stream = options.stream || process.stderr;

    if (typeof (options) == 'number') {
        let total = options;
        options = {};
        options.total = total;
    } else {
        options = options || {};
        if ('string' != typeof fmt) throw new Error('format required');
        if ('number' != typeof options.total) throw new Error('total required');
    }

    this.fmt = fmt;
    this.curr = options.curr || 0;
    this.total = options.total;
    this.title = options.title || 'DOWNLOADING';
    this.width = options.width || this.total;
    this.clear = options.clear;
    this.chars = {
        complete: options.complete || '\u001b[42m \u001b[0m',
        incomplete: options.incomplete || '\u001b[41m \u001b[0m',
        head: options.head || (options.complete || '\u001b[42m \u001b[0m')
    };
    this.renderThrottle = options.renderThrottle !== 0 ? (options.renderThrottle || 16) : 0;
    this.lastRender = -Infinity;
    this.callback = options.callback || function () {
    };
    this.tokens = {};
    this.lastDraw = '';
    this.offset = 0;
}

DownloadingBar.prototype.tick = function (len, tokens) {
    if (len !== 0)
        len = len || 1;

    if ('object' == typeof len) {tokens = len; len = 1;}
    if (tokens) this.tokens = tokens;

    if (0 === this.curr) this.start = new Date;

    this.curr += len;
    this.offset += 1;

    this.render();

    if (this.curr >= this.total) {
        this.render(undefined, true);
        this.complete = true;
        this.terminate();
        this.callback(this);
    }
};

DownloadingBar.prototype.render = function (tokens, force) {
    force = force !== undefined ? force : false;
    if (tokens) this.tokens = tokens;

    if (!this.stream.isTTY) return;

    let now = Date.now();
    let delta = now - this.lastRender;
    if (!force && (delta < this.renderThrottle)) {
        return;
    } else {
        this.lastRender = now;
    }

    let ratio = this.curr / this.total;
    ratio = Math.min(Math.max(ratio, 0), 1);

    let percent = Math.floor(ratio * 100);
    let incomplete, complete, completeLength;
    let elapsed = new Date - this.start;
    let eta = (percent === 100) ? 0 : elapsed * (this.total / this.curr - 1);
    let rate = this.curr / (elapsed / 1000);

    let str = this.fmt
        .replace(':current', this.curr)
        .replace(':total', this.total)
        .replace(':elapsed', isNaN(elapsed) ? '0.0' : (elapsed / 1000).toFixed(1))
        .replace(':eta', (isNaN(eta) || !isFinite(eta)) ? '0.0' : (eta / 1000)
            .toFixed(1))
        .replace(':percent', percent.toFixed(0) + '%')
        .replace(':rate', '' + Math.round(rate));

    let availableSpace = Math.max(0, this.stream.columns - str.replace(':bar', '').length);
    if (availableSpace && process.platform === 'win32') {
        availableSpace = availableSpace - 1;
    }

    let width = Math.min(this.width, availableSpace);

    completeLength = Math.round(width * ratio);
    complete = Array(Math.max(0, completeLength + 1)).join(this.chars.complete);
    incomplete = Array(Math.max(0, width - completeLength + 1)).join(this.chars.incomplete);

    if (completeLength === 0) {
        complete = complete + this.chars.incomplete;
    } else if (completeLength > 0) {
        complete = complete + this.chars.head;
    }

    let title_width = 20;

    let title = this.tokens.title
        ? this.tokens.title.toString()
        : this.title.toString();

    if (title.length < (this.offset + title_width)) {
        this.offset = 0;
    }

    title = title.length > title_width
        ? title
            .slice(this.offset, this.offset + title_width)
        : title;
    let l = (title && title.length < title_width
        ? (title_width - title.length) % 2
            ? Math.ceil((title_width - title.length) / 2)
            : (title_width - title.length) / 2
        : 0) + 1;
    let r = (title && title.length < title_width
        ? (title_width - title.length) % 2
            ? Math.floor((title_width - title.length) / 2)
            : (title_width - title.length) / 2
        : 0) + 1;

    str = str
        .replace(':title', new Array(l).join(' ') + '\033[0;32m' + title + '\033[0m' + new Array(r).join(' '))
        .replace(':bar', complete + incomplete);

    if (this.tokens) {
        for (let key in this.tokens) {
            if (this.tokens.hasOwnProperty(key)) {
                str = str.replace(':' + key, this.tokens[key]);
            }
        }
    }

    if (this.lastDraw !== str) {
        this.stream.cursorTo(0);
        this.stream.write(str);
        this.stream.clearLine(1);
        this.lastDraw = str;
    }
};

DownloadingBar.prototype.update = function (ratio, tokens) {
    let goal = Math.floor(ratio * this.total);
    let delta = goal - this.curr;

    this.tick(delta, tokens);
};

DownloadingBar.prototype.interrupt = function (message) {
    this.stream.clearLine();
    this.stream.cursorTo(0);
    this.stream.write(message);
    this.stream.write('\n');
    this.stream.write(this.lastDraw);
};

DownloadingBar.prototype.terminate = function () {
    if (this.clear) {
        if (this.stream.clearLine) {
            this.stream.clearLine();
            this.stream.cursorTo(0);
        }
    } else {
        this.stream.write('\n');
    }
};