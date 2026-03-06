function! rstpvw#autocmd#init() abort
  execute 'augroup RSTPVW_REFRESH_INIT' . bufnr('%')
    autocmd!
    if g:rstpvw_refresh_slow
      autocmd CursorHold,BufWrite,InsertLeave <buffer> call rstpvw#rpc#preview_refresh()
    else
      autocmd CursorHold,CursorHoldI,CursorMoved,CursorMovedI <buffer> call rstpvw#rpc#preview_refresh()
    endif
    if g:rstpvw_auto_close
      autocmd BufHidden <buffer> call rstpvw#rpc#preview_close()
    endif
    autocmd VimLeave * call rstpvw#rpc#stop_server()
  augroup END
endfunction

function! rstpvw#autocmd#clear_buf() abort
  execute 'autocmd! RSTPVW_REFRESH_INIT' . bufnr('%')
endfunction
