local M = {}

local defaultConfig = {
  command = "Gql",
  envFile = "gqlenv.json",
  logFile = "/tmp/grapqhl-cli.log.yml"
}

M.setup = function(config)
  config = vim.tbl_deep_extend('force', defaultConfig, config or {})
  print(vim.inspect(nConfig))

  local currDir = debug.getinfo(1).source:match("@?(.*/)")
  local pRootDir = currDir .. '../..'

  local vimBufOptions = "vne | setlocal buftype=nofile | setlocal bufhidden=hide | setlocal noswapfile | set ft=json "

  local cliExec = string.format("node --es-module-specifier-resolution=node %s/src/index.js", pRootDir)

  local cmd = string.format(
    "command! -nargs=0 %s execute '%s | r! %s ' . expand('%%:p') . ' %s ' . line('.')",
    config.command,
    vimBufOptions,
    cliExec,
    config.envFile
  )

  -- print(cmd)
  vim.cmd(cmd)
end

-- M.setup()
-- print()

return M;
