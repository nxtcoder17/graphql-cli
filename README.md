## grapqhl client to speed up grapqhl query/mutation development

![demo](https://user-images.githubusercontent.com/22402557/160329835-7f445332-fbbc-48bf-9922-43e907975ba2.gif)

## How to Use (with neovim)

- if you use packer
```lua
  use({
    "nxtcoder17/graphql-cli",
    run = "pnpm i",  -- npm i, as per your choice
    config = function()
      require("graphql-cli").setup()
    end,
  })
```

- default config
```lua
local defaultConfig = {
	command = "Gql",
	envFile = function()
		return string.format("%s/%s", vim.env.PWD, "gqlenv.json")
	end,
}
```

## How to Use

- You should create a gqlenv.json file in your project root directory, something like this
```jsonc
{
  "mode": "dev", // could be anything you define below, here dev|prod
  "dev": {
    // variables while making requests in dev mode
    "url": "<graphql endpoint>",
    "name": "sample",
  },
  "prod": {
    // variables while making requests in prod mode
    "url": "<production grapqhl endpoint>",
    "name": "prod-sample"
  }
}
```

- then, create a file `$filename.yml` file
```yaml
# filename: auth-graphql.yml

---
global:
  email: "sample@gmail.com"

---
query: |
  mutation Login($email: String!, $password: String!) {
    auth {
      login(email: $email, password: $password) {
        id
        userId
        userEmail
      }
    }
  }

variables:
  email: "{{email}}" # this is variable parsing, from either 'gqlenv.json' or from 'global' doc at the top
  password: "hello"  
```

- now, execute it
```sh
pnpm start -- $filename $envFileName $lineNumber
```

+ you need to have a variable `url` either in one of the mode vars or global vars

## Inspired By
.http file based REST Client in [Neovim/vim](https://github.com/bayne/vim-dot-http) and Intellij

## Next To Come

- [x] Neovim plugin that could just setup the previous step for you
- [x] i don't know yet 😂
