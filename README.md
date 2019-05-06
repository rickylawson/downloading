<p align="center">
    <img src="https://raw.githubusercontent.com/rickylawson/downloading/master/downloading.gif">
</p>

## What is `downloading`?

Progress bar file download.

Original package: https://www.npmjs.com/package/progress

Differences: Added `title`

## Installation

```bash
npm i downloading
```

## Usage

Import the library in your code:

```js
const Downloading = require('downloading');

let bar = new Downloading(':bar [:title] :percent', {
    title: 'Downloading file puppy.png',
    width: 50,
    total: 100
});
```

### Example

```js
const Downloading = require('downloading');

let bar = new Downloading(':bar [:title] :percent', {
    title: 'Download archive with beautiful puppies.',
    width: 50,
    total: 100
});

let tick = setInterval(() => {
    bar.tick(Math.random());
    if (bar.curr >= bar.total - 1) {
        clearInterval(tick);
        bar.tick(1, {
            title: 'Archive downloaded'
        });
    }
}, 300);
```