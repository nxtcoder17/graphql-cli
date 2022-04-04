import fs from 'fs/promises';
import yaml from 'js-yaml';
import lodash from 'lodash';
import axios from 'axios';

const { template } = lodash;

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

const readFile = async (fileName) => {
  const f = await fs.readFile(fileName, 'utf8');
  return f.toString();
};

export const YAML_DELIMETER = '---';

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

export const buildQuery = ({ yamlDoc, env }) => {
  const q = {
    query: yamlDoc.query,
    operationName: yamlDoc.query.split(/\s+/, 3)[1].split('{')[0].split('(')[0],
    ...(yamlDoc.variables ? { variables: yamlDoc.variables } : {}),
  };

  const v = template(JSON.stringify(q.variables), {
    interpolate: /{{([\s\S]+?)}}/g,
  })(env);

  if (v) q.variables = JSON.parse(v);

  const headers = {
    'Content-Type': 'application/json',
    ...(yamlDoc.headers || {}),
    ...env.headers,
  };

  return { query: q, headers };
};

export const executeQuery = async ({ url, query, headers }) => {
  return axios.post(url, query, { headers });
};
