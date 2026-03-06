" rst-preview.nvim - ReStructuredText preview plugin for (neo)vim
" Maintainer: rst-preview.nvim
" License: MIT

" Auto-start on RST files
if !exists('g:rstpvw_auto_start')
  let g:rstpvw_auto_start = 0
endif

" Auto-close preview when leaving RST buffer
if !exists('g:rstpvw_auto_close')
  let g:rstpvw_auto_close = 1
endif

" Slow refresh: only on save/InsertLeave (0 = refresh on cursor move)
if !exists('g:rstpvw_refresh_slow')
  let g:rstpvw_refresh_slow = 0
endif

" Allow command for all filetypes
if !exists('g:rstpvw_command_for_global')
  let g:rstpvw_command_for_global = 0
endif

" Open server to the world (0 = localhost only)
if !exists('g:rstpvw_open_to_the_world')
  let g:rstpvw_open_to_the_world = 0
endif

" Custom IP to open preview page
if !exists('g:rstpvw_open_ip')
  let g:rstpvw_open_ip = ''
endif

" Echo preview URL in command line
if !exists('g:rstpvw_echo_preview_url')
  let g:rstpvw_echo_preview_url = 0
endif

" Custom vim function to open browser (receives url as param)
if !exists('g:rstpvw_browserfunc')
  let g:rstpvw_browserfunc = ''
endif

" Browser to use for preview
if !exists('g:rstpvw_browser')
  let g:rstpvw_browser = ''
endif

" Port (empty = auto)
if !exists('g:rstpvw_port')
  let g:rstpvw_port = ''
endif

" Page title template (${name} replaced with filename)
if !exists('g:rstpvw_page_title')
  let g:rstpvw_page_title = '「${name}」'
endif

" Filetypes that trigger the preview
if !exists('g:rstpvw_filetypes')
  let g:rstpvw_filetypes = ['rst']
endif

" Custom CSS file (absolute path)
if !exists('g:rstpvw_css')
  let g:rstpvw_css = ''
endif

" Preview options
if !exists('g:rstpvw_preview_options')
  let g:rstpvw_preview_options = {
      \ 'disable_sync_scroll': 0,
      \ 'sync_scroll_type': 'middle',
      \ 'disable_filename': 0,
      \ }
endif

" Theme: 'light' or 'dark' (empty = follow system)
if !exists('g:rstpvw_theme')
  let g:rstpvw_theme = ''
endif

" Track active clients
let g:rstpvw_clients_active = 0

function! s:init_command() abort
  command! -buffer RSTPreview       call rstpvw#util#open_preview_page()
  command! -buffer RSTPreviewStop   call rstpvw#util#stop_preview()
  command! -buffer RSTPreviewToggle call rstpvw#util#toggle_preview()
  noremap  <buffer> <silent> <Plug>RSTPreview        :RSTPreview<CR>
  inoremap <buffer> <silent> <Plug>RSTPreview        <Esc>:RSTPreview<CR>a
  noremap  <buffer> <silent> <Plug>RSTPreviewStop    :RSTPreviewStop<CR>
  inoremap <buffer> <silent> <Plug>RSTPreviewStop    <Esc>:RSTPreviewStop<CR>a
  nnoremap <buffer> <silent> <Plug>RSTPreviewToggle  :RSTPreviewToggle<CR>
  inoremap <buffer> <silent> <Plug>RSTPreviewToggle  <Esc>:RSTPreviewToggle<CR>a
endfunction

function! s:init() abort
  augroup rstpvw_init
    autocmd!
    if g:rstpvw_command_for_global
      autocmd BufEnter * :call s:init_command()
    else
      autocmd BufEnter,FileType * if index(g:rstpvw_filetypes, &filetype) !=# -1 | call s:init_command() | endif
    endif
    if g:rstpvw_auto_start
      execute 'autocmd BufEnter *.{rst,rest} call rstpvw#util#open_preview_page()'
    endif
  augroup END
endfunction

call s:init()
