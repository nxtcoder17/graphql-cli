import { Command } from 'commander';
import os from 'os';
import path from 'path';
import { log, readAndParseFile, buildQuery, executeQuery } from './lib';

const program = new Command();

const actions = {
  GRAPHQL: 'graphql',
  REST: 'rest',
};

program
  .command(actions.GRAPHQL)
  .description('handles grapqhl requests')
  .requiredOption('-f|--file <file-name>', 'file name')
  .requiredOption('-e|--env <env-file-name>', 'env file name')
  .requiredOption('-l|--line <line-no>', 'line number')
  .option('--dry-run', 'dry run')
  .option(
    '--log-file',
    'log file',
    path.resolve(os.tmpdir(), 'graphql-cli.log.yml')
  )
  .action(async (args) => {
    args.line = Number(args.line);
    const { yamlDoc, env } = await readAndParseFile({
      fileName: args.file,
      envFile: args.env,
      line: args.line,
    });

    const { query, headers } = buildQuery({ yamlDoc, env });
    log('### request headers ###\n');
    log(JSON.stringify(headers, null, 2));

    log('');
    console.time('TIME TAKEN');
    const response = await executeQuery({ url: env.url, query, headers });
    console.timeEnd('TIME TAKEN');

    log('\n### response headers ###\n');
    log(JSON.stringify(response.headers, null, 2));

    log('\n### GQL response ###\n');
    log(JSON.stringify(response.data, null, 2));
  });

program
  .command(actions.REST)
  .description('handles rest requests')
  .requiredOption('-f|--file <file-name>', 'file name')
  .requiredOption('-e|--env <env-file-name>', 'env file name')
  .requiredOption('-l|--line <line-no>', 'line number')
  .option('--dry-run', 'dry run')
  .option(
    '--log-file',
    'log file',
    path.resolve(os.tmpdir(), 'graphql-cli.log.yml')
  )
  .action(async (_args) => {
    throw new Error('REST API is not supported yet');
  });

program.parse();
