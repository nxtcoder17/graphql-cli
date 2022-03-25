## Inspiration
.http file based REST api interaction in [Neovim/vim](https://github.com/bayne/vim-dot-http) and Intellij

<blockquote class="imgur-embed-pub" lang="en" data-id="a/qdoRU5f" data-context="false" ><a href="//imgur.com/a/qdoRU5f"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>

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

----
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

## How I Use It

- I have added this line in my nvim(0.5+) configuration, it would create a command `Gql`
```lua
vim.cmd [[
  command! -nargs=0 Gql  execute 'vne | setlocal buftype=nofile | setlocal bufhidden=hide | setlocal noswapfile | set ft=json | r! node --es-module-specifier-resolution=node <where-you-cloned>/src/index.js' . ' '. expand('%:p') . ' gqlenv.json'. ' '. line('.')
]]
```

- then, while editing graphql-cli yml file, on the yaml block that you want to make grapqhl call for, do `:Gql`, and the response would come to you in a vertical split next to you

## Next To Come

- [ ] Neovim plugin that could just setup the previous step for you
- [x] i don't know now 😂
