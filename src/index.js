import fs from 'fs/promises';
import _ from 'lodash';
import axios from 'axios';
import yaml from 'js-yaml';

console.time('timetaken');

const debug = process.env?.DEBUG === 'true';

const { template } = _;

const argFile = process.argv[2];
const envFile = process.argv[3];
const argLine = Number(process.argv[4]);

const f = await fs.readFile(argFile, 'utf8');
const file = f.toString();

const lines = file.split('\n');
if (lines[lines.length - 2].trim() !== '---') {
  lines.push('---');
}

const logd = (...msg) => {
  if (debug) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG]:', msg);
  }
};

const log = (...msg) => {
  // eslint-disable-next-line no-console
  console.log(msg);
};

const linesR = [];
let hasVariables = false;
const s = lines.reduce((acc, item, idx) => {
  if (item === '---') {
    acc.add(idx);
  }
  if (item.trim().startsWith('global:')) {
    hasVariables = true;
  }
  return acc;
}, new Set());

const sa = [...s];
for (let i = 1; i < sa.length; i += 1) {
  linesR.push([sa[i - 1] + 1, sa[i]]);
}

let docVariables = {};
if (hasVariables) {
  const { global } = yaml.load(
    lines.slice(linesR[0][0], linesR[0][1]).join('\n')
  );
  docVariables = global;
}

const docIdx = linesR.findIndex((item) => {
  if (item[0] <= argLine && item[1] >= argLine) {
    return true;
  }
  return false;
});

logd(`line nr ${argLine} is in yaml document idx ${docIdx}`);

const yamlDoc = yaml.load(
  lines.slice(linesR[docIdx][0], linesR[docIdx][1]).join('\n')
);

logd('yamlDoc:', yamlDoc);

const envF = await fs.readFile(envFile, 'utf8');
const envJson = JSON.parse(envF.toString());

const env = {
  ...envJson[envJson.mode],
  ...docVariables,
};

logd('YAML query: ', yamlDoc.query.split(/\s+/, 2));

const gqlQuery = {
  query: yamlDoc.query,
  operationName: yamlDoc.query.split(/\s+/, 3)[1].split('{')[0].split('(')[0],
  ...(yamlDoc.variables ? { variables: yamlDoc.variables } : {}),
};

logd('GQL Query:', gqlQuery);

const gqlHeaders = {
  headers: {
    'Content-Type': 'application/json',
    ...(yamlDoc.headers || {}),
    ...env.headers,
  },
};

logd('GQL Headers:', gqlHeaders);
logd('GQL Variables:', gqlQuery.variables);

const v = template(JSON.stringify(gqlQuery.variables), {
  interpolate: /{{([\s\S]+?)}}/g,
})(env);

if (v) gqlQuery.variables = v;

log('### request headers ###\n');
log(JSON.stringify(gqlHeaders, null, 2));

console.time('timetaken (gql-request)');
const response = await axios.post(env.url, gqlQuery, gqlHeaders);
console.timeEnd('timetaken (gql-request)');
console.timeEnd('timetaken');

log('\n### response headers ###\n');
log(JSON.stringify(response.headers, null, 2));

log('\n### GQL response ###\n');
log(JSON.stringify(response.data, null, 2));

await fs.appendFile(
  `${process.cwd()}/gqlcli.log.yml`,
  `\n---\n${yaml.dump({
    gqlQuery,
    response: JSON.stringify(response.data, null, 2),
  })}`
);
