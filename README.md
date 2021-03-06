## ghcjs-brunch
Adds [GHCJS](https://github.com/ghcjs/ghcjs) support to
[brunch](http://brunch.io).

## Installation
Install the plugin via npm with `npm install --save ghcjs-brunch`.

Or, do manual install:

* Add `"ghcjs-brunch": "x.y.z"` to `package.json` of your brunch app.
  Pick a plugin version that corresponds to your minor (y) brunch version.
* If you want to use git version of plugin, add
`"ghcjs-brunch": "git+ssh://git@github.com:kfigiela/ghcjs-brunch.git"`.

## Configuration
You can set the `--bare` option in your brunch config (such as `brunch-config.coffee`):

```coffee
exports.config =
  files:
    javascripts:
      joinTo:
        ...
        'javascripts/ghcjs.js': /^app\/.*\.ghcjs$/
  ...
  plugins:
    ghcjs:
      placeholder: "app/placeholder.ghcjs"
      cabalName: "gui"
```

## License

The MIT License (MIT)

Copyright (c) 2012-2013 Paul Miller (http://paulmillr.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
