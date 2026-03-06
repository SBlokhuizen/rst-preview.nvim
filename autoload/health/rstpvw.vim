function! health#rstpvw#check()
  lua require('health').start('rst-preview.nvim')

  " Check node
  if executable('node')
    let l:ver = system('node --version')
    lua require('health').ok('node found: ' .. vim.fn.system('node --version'):gsub('\n',''))
  else
    lua require('health').error('node not found', {'Install Node.js: https://nodejs.org'})
  endif

  " Check python3 / docutils
  if executable('python3')
    call system('python3 -c "import docutils" 2>&1')
    if v:shell_error == 0
      lua require('health').ok('python3 + docutils found')
    else
      lua require('health').error('docutils not found', {'Run: pip3 install docutils'})
    endif
  else
    lua require('health').error('python3 not found', {'Install Python 3'})
  endif

  " Check app/index.js exists
  let l:root = expand('<sfile>:h:h:h')
  if filereadable(l:root . '/app/index.js')
    lua require('health').ok('app/index.js found')
  else
    lua require('health').error('app/index.js not found', {'Run: cd app && npm install'})
  endif

  " Check node_modules
  if isdirectory(l:root . '/app/node_modules')
    lua require('health').ok('node_modules found')
  else
    lua require('health').error('node_modules missing', {'Run: cd app && npm install'})
  endif
endfunction
