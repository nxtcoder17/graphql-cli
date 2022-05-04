import fs from 'fs/promises';
import yaml from 'js-yaml';
import lodash from 'lodash';
import axios from 'axios';
import assert from 'assert';

export const debug = process.env?.DEBUG === 'true';

export const logd = (...msg) => {
  if (debug) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG]:', msg);
  }
};

export const log = (...msg) => {
  // eslint-disable-next-line no-console
  console.log(...msg);
};

const template = (str, values) => {
  const v = lodash.template(str, {
    interpolate: /{{([\s\S]+?)}}/g,
  })(values);
  return v;
};

const readFile = async (fileName) => {
  const f = await fs.readFile(fileName, 'utf8');
  return f.toString();
};

const YAML_DELIMETER = '---';

export const readEnv = async ({ envFile, mode }) => {
  const body = yaml.load(await readFile(envFile), {
    json: true,
  });
  assert(
    mode || body.mode,
    'CLI option -m|--mode or mode in envfile must be set'
  );
  return body[mode || body.mode];
};

export const findYamlBlock = async ({ file, line, env }) => {
  const f = await readFile(file);
  const lines = f.split('\n');
  const delims = [];
  if (lines[0].trim() !== YAML_DELIMETER) {
    delims.push(0);
  }
  let hasGlobalVars = false;
  lines.forEach((l, idx) => {
    if (l.trim() === YAML_DELIMETER) {
      delims.push(idx);
    }
    if (delims.length <= 1 && l.trim().startsWith('global:')) {
      hasGlobalVars = true;
    }
  });
  if (lines[lines.length - 1].trim() !== YAML_DELIMETER) {
    delims.push(lines.length - 1);
  }

  // check if file defines some global vars
  let globalVars = { ...env[env.mode] };
  if (hasGlobalVars) {
    const { global: vars } = yaml.load(
      lines.slice(delims[0], delims[1]).join('\n')
    );
    globalVars = {
      ...globalVars,
      ...vars,
    };
  }

  for (let i = 1; i < delims.length; i += 1) {
    if (line - 1 < delims[i]) {
      const s = lines
        .slice(Math.max(delims[i - 1] + 1, 0), delims[i])
        .join('\n');

      const p = template(s, globalVars);
      return yaml.load(p, {
        json: true,
      });
    }
  }

  throw new Error('could not find yaml block');
};

export const readAndParseFile = async ({ fileName, line, envFile }) => {
  const file = await readFile(fileName);
  const lines = file.split('\n');
  if (lines[lines.length - 2].trim() !== YAML_DELIMETER) {
    lines.push(YAML_DELIMETER);
  }

  const linesR = [];
  let hasVariables = false;

  const s = lines.reduce((acc, item, idx) => {
    if (item === YAML_DELIMETER) {
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
    if (item[0] <= line && item[1] >= line) {
      return true;
    }
    return false;
  });

  logd(`line nr ${line} is in yaml document idx ${docIdx}`);

  const yamlDoc = yaml.load(
    lines.slice(linesR[docIdx][0], linesR[docIdx][1]).join('\n')
  );

  logd('yamlDoc:', yamlDoc);

  const env = await (async () => {
    const f = await readFile(envFile);
    const json = JSON.parse(f);

    return {
      ...json[json.mode],
      ...docVariables,
    };
  })();

  return {
    yamlDoc,
    env,
  };
};

export const buildQuery = ({ yamlBlock, env }) => {
  const q = {
    query: yamlBlock.query,
    operationName: yamlBlock.query
      .split(/\s+/, 3)[1]
      .split('{')[0]
      .split('(')[0],
    ...(yamlBlock.variables ? { variables: yamlBlock.variables } : {}),
  };

  const headers = {
    'Content-Type': 'application/json',
    ...(yamlBlock.headers || {}),
    ...env.headers,
  };

  return { query: q, headers };
};

export const executeQuery = async ({ url, query, headers }) => {
  return axios.post(url, query, { headers });
};
