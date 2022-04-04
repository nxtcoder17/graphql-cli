local M = {}

local defaultConfig = {
	command = "Gql",
	envFile = function()
		return string.format("%s/%s", vim.env.PWD, "gqlenv.json")
	end,
}

M.setup = function(config)
	config = vim.tbl_deep_extend("force", defaultConfig, config or {})
	print(vim.inspect(nConfig))

	local currDir = debug.getinfo(1).source:match("@?(.*/)")
	local pRootDir = currDir .. "../.."

	local vimBufOptions = "vne | setlocal buftype=nofile | setlocal bufhidden=hide | setlocal noswapfile | set ft=json "

	local cliExec = string.format("cd %s && pnpm start --silent -- graphql", pRootDir)

	local cmd = string.format(
		"command! -nargs=0 %s execute '%s | r! %s -f ' . expand('%%:p') . ' -e %s -l ' . line('.')",
		config.command,
		vimBufOptions,
		cliExec,
		config.envFile()
	)

	vim.cmd(cmd)
end

return M
