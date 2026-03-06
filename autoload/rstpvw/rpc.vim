let s:rstpvw_root_dir = expand('<sfile>:h:h:h')
let s:is_vim = !has('nvim')
let s:rstpvw_channel_id = s:is_vim ? v:null : -1

function! s:on_stdout(chan_id, msgs, ...) abort
  call rstpvw#util#echo_messages('Error', a:msgs)
endfunction

function! s:on_stderr(chan_id, msgs, ...) abort
  call rstpvw#util#echo_messages('Error', a:msgs)
endfunction

function! s:on_exit(chan_id, code, ...) abort
  let s:rstpvw_channel_id = s:is_vim ? v:null : -1
endfunction

function! s:start_vim_server(cmd) abort
  let options = {
        \ 'in_mode':  'json',
        \ 'out_mode': 'json',
        \ 'err_mode': 'nl',
        \ 'out_cb':   function('s:on_stdout'),
        \ 'err_cb':   function('s:on_stderr'),
        \ 'exit_cb':  function('s:on_exit'),
        \ 'env': { 'VIM_NODE_RPC': 1 }
        \ }
  if has('patch-8.1.350')
    let options['noblock'] = 1
  endif
  let l:job = job_start(a:cmd, options)
  if job_status(l:job) !=# 'run'
    echohl Error | echon 'rst-preview.nvim: Failed to start server' | echohl None
    return
  endif
  let s:rstpvw_channel_id = l:job
endfunction

function! rstpvw#rpc#start_server() abort
  let l:script = s:rstpvw_root_dir . '/app/index.js'
  if executable('node')
    let l:cmd = ['node', l:script, '--path', s:rstpvw_root_dir . '/app/server.js']
  else
    call rstpvw#util#echo_messages('Error', 'rst-preview.nvim: node not found in PATH')
    return
  endif
  if s:is_vim
    call s:start_vim_server(l:cmd)
  else
    let l:opts = {
          \ 'rpc':        1,
          \ 'on_stdout':  function('s:on_stdout'),
          \ 'on_stderr':  function('s:on_stderr'),
          \ 'on_exit':    function('s:on_exit')
          \ }
    let s:rstpvw_channel_id = jobstart(l:cmd, l:opts)
  endif
endfunction

function! rstpvw#rpc#stop_server() abort
  if s:is_vim
    if s:rstpvw_channel_id !=# v:null
      if job_status(s:rstpvw_channel_id) ==# 'run'
        call rstpvw#rpc#request(s:rstpvw_channel_id, 'close_all_pages')
        try | call job_stop(s:rstpvw_channel_id) | catch | endtry
      endif
    endif
    let s:rstpvw_channel_id = v:null
  else
    if s:rstpvw_channel_id !=# -1
      call rpcrequest(s:rstpvw_channel_id, 'close_all_pages')
      try | call jobstop(s:rstpvw_channel_id) | catch | endtry
    endif
    let s:rstpvw_channel_id = -1
  endif
  let b:RSTPreviewToggleBool = 0
endfunction

function! rstpvw#rpc#get_server_status() abort
  if s:is_vim && s:rstpvw_channel_id ==# v:null | return -1 | endif
  if !s:is_vim && s:rstpvw_channel_id ==# -1    | return -1 | endif
  return 1
endfunction

function! rstpvw#rpc#preview_refresh() abort
  if s:is_vim
    if s:rstpvw_channel_id !=# v:null
      call rstpvw#rpc#notify(s:rstpvw_channel_id, 'refresh_content', { 'bufnr': bufnr('%') })
    endif
  else
    if s:rstpvw_channel_id !=# -1
      call rpcnotify(s:rstpvw_channel_id, 'refresh_content', { 'bufnr': bufnr('%') })
    endif
  endif
endfunction

function! rstpvw#rpc#preview_close() abort
  if s:is_vim
    if s:rstpvw_channel_id !=# v:null
      call rstpvw#rpc#notify(s:rstpvw_channel_id, 'close_page', { 'bufnr': bufnr('%') })
    endif
  else
    if s:rstpvw_channel_id !=# -1
      call rpcnotify(s:rstpvw_channel_id, 'close_page', { 'bufnr': bufnr('%') })
    endif
  endif
  let b:RSTPreviewToggleBool = 0
  call rstpvw#autocmd#clear_buf()
endfunction

function! rstpvw#rpc#open_browser() abort
  if s:is_vim
    if s:rstpvw_channel_id !=# v:null
      call rstpvw#rpc#notify(s:rstpvw_channel_id, 'open_browser', { 'bufnr': bufnr('%') })
    endif
  else
    if s:rstpvw_channel_id !=# -1
      call rpcnotify(s:rstpvw_channel_id, 'open_browser', { 'bufnr': bufnr('%') })
    endif
  endif
endfunction

function! rstpvw#rpc#request(clientId, method, ...) abort
  let args = get(a:, 1, [])
  let res = ch_evalexpr(a:clientId, [a:method, args], {'timeout': 5000})
  if type(res) == 1 && res ==# '' | return '' | endif
  let [l:errmsg, res] = res
  if l:errmsg
    echohl Error | echon '[rstpvw] client error: ' . l:errmsg | echohl None
  else
    return res
  endif
endfunction

function! rstpvw#rpc#notify(clientId, method, ...) abort
  let args = get(a:000, 0, [])
  let data = json_encode([0, [a:method, args]])
  call ch_sendraw(s:rstpvw_channel_id, data . "\n")
endfunction
