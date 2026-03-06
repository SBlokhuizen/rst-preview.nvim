# rst-preview.nvim

A live ReStructuredText preview plugin for Neovim and Vim, inspired by
[markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim).

## Features

- 🚀 **Live preview** — browser updates as you type (no save needed)
- 📍 **Scroll sync** — browser scrolls to match your cursor position
- 🌙 **Dark / light mode** — follows system preference, toggleable in browser
- 🐍 **Rendered by docutils** — accurate RST-to-HTML via Python
- 🖼️ **Local image support** — serves images relative to the RST file
- ⚡ **WebSocket-based** — instant updates via socket.io
- 🔌 **Neovim + Vim 8** compatible

## Requirements

- Neovim or Vim 8+ (with `+job` and `+channel`)
- [Node.js](https://nodejs.org) (v12+)
- Python 3 with `docutils`:
  ```
  pip3 install docutils
  ```

## Installation

### Using Lazy

```
{
  'SBlokhuizen/rst-preview.nvim',
  cmd = { 'RSTPreview', 'RSTPreviewStop', 'RSTPreviewToggle' },
  build = 'cd app && npm install && cp node_modules/socket.io-client/dist/socket.io.js _static/socket.io.min.js',
  init = function()
    vim.g.rstpvw_filetypes = { 'rst' }
  end,
  ft = { 'rst' },
}
```
## Usage

Open any `.rst` file and run:

| Command              | Description              |
|----------------------|--------------------------|
| `:RSTPreview`        | Open preview in browser  |
| `:RSTPreviewStop`    | Stop the preview server  |
| `:RSTPreviewToggle`  | Toggle preview on/off    |

### Key mappings

```vim
nmap <C-p> <Plug>RSTPreviewToggle
```

## Configuration

```vim
" Auto-open preview when entering an RST buffer (default: 0)
let g:rstpvw_auto_start = 0

" Auto-close preview when leaving RST buffer (default: 1)
let g:rstpvw_auto_close = 1

" Slow refresh: only update on save/InsertLeave (default: 0 = update on cursor move)
let g:rstpvw_refresh_slow = 0

" Open server to the network, not just localhost (default: 0)
let g:rstpvw_open_to_the_world = 0

" Custom IP for the preview URL (default: '' = auto)
let g:rstpvw_open_ip = ''

" Echo the preview URL in the command line (default: 0)
let g:rstpvw_echo_preview_url = 0

" Custom function to open browser (receives URL as argument)
let g:rstpvw_browserfunc = ''

" Browser binary to use (default: '' = system default)
let g:rstpvw_browser = ''

" Port (default: '' = auto-pick around 8090)
let g:rstpvw_port = ''

" Page title template, ${name} = filename without extension
let g:rstpvw_page_title = '「${name}」'

" Recognized filetypes (default: ['rst'])
let g:rstpvw_filetypes = ['rst']

" Custom CSS file (absolute path) to override default styles
let g:rstpvw_css = ''

" Theme: 'light', 'dark', or '' (follow system)
let g:rstpvw_theme = ''

" Preview options
let g:rstpvw_preview_options = {
    \ 'disable_sync_scroll': 0,
    \ 'sync_scroll_type': 'middle',
    \ 'disable_filename': 0,
    \ }
" sync_scroll_type options:
"   'middle' - keep cursor line in middle of browser viewport
"   'top'    - keep cursor line near top of browser viewport
"   'relative' - mirror vim window scroll position proportionally
```

## Health Check

```vim
:checkhealth rstpvw
```

