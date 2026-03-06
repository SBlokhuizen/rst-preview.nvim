function! rstpvw#util#echo_messages(hl, msgs)
  if empty(a:msgs) | return | endif
  execute 'echohl ' . a:hl
  if type(a:msgs) ==# 1
    echomsg a:msgs
  else
    for msg in a:msgs
      echom msg
    endfor
  endif
  echohl None
endfunction

function! rstpvw#util#echo_url(url)
  call rstpvw#util#echo_messages('Type', 'Preview page: ' . a:url)
endfunction

function! s:try_open_preview_page(timer_id) abort
  if rstpvw#rpc#get_server_status() !=# 1
    call rstpvw#rpc#stop_server()
    call rstpvw#rpc#start_server()
  endif
endfunction

function! rstpvw#util#open_preview_page() abort
  if get(s:, 'try_id', '') !=# ''
    return
  endif
  let l:status = rstpvw#rpc#get_server_status()
  if l:status ==# -1
    call rstpvw#rpc#start_server()
  elseif l:status ==# 0
    let s:try_id = timer_start(1000, function('s:try_open_preview_page'))
  else
    call rstpvw#util#open_browser()
  endif
endfunction

function! rstpvw#util#open_browser() abort
  call rstpvw#rpc#open_browser()
  call rstpvw#autocmd#init()
endfunction

function! rstpvw#util#stop_preview() abort
  let g:rstpvw_clients_active = 0
  call rstpvw#rpc#stop_server()
endfunction

function! rstpvw#util#toggle_preview() abort
  if !get(b:, 'RSTPreviewToggleBool')
    call rstpvw#util#open_preview_page()
    let b:RSTPreviewToggleBool = 1
  else
    call rstpvw#util#stop_preview()
    let b:RSTPreviewToggleBool = 0
  endif
endfunction
