import * as core from '@actions/core';
import * as fs from 'fs';
import axios, { AxiosError } from 'axios';
import { setTimeout } from 'timers/promises';
import * as yaml from 'js-yaml';

export default async function action(): Promise<number | void> {
  const WAITSTEP = 5; // seconds between two consecutive checks of the job's status

  try {
    // eval expression "$VAR" on extravars template file
    const varsInput = core.getInput('vars');
    const values: Record<string, string> = {
      ...(varsInput ? JSON.parse(varsInput) : {}),
      ARTIFACT_URL: core.getInput('asset_url'),
      IMAGE_URL: core.getInput('image_url'),
      GITHUB_RUN_ID: process.env.GITHUB_RUN_ID ?? '', // Tower workaround to force restart
    };
    const varsFilename = core.getInput('extravars_template_filename');
    const rawTemplate = varsFilename ? fs.readFileSync(varsFilename).toString() : '';
    let extra_vars: string | undefined;
    if (varsFilename) {
      extra_vars = rawTemplate.replace(/\$(\w+)/g, (_m: string, p1: string) =>
        p1 in values ? values[p1] : p1,
      );
    } else {
      extra_vars = JSON.stringify({
        IMAGE_URL: values.IMAGE_URL,
        GITHUB_RUN_ID: values.GITHUB_RUN_ID,
      });
    }

    // launch Tower by a rest API
    const towerTemplateId = core.getInput('tower_template_id');
    const towerUrl = core.getInput('tower_url');
    const towerUser = core.getInput('tower_user');
    const towerPassword = core.getInput('tower_password');
    const towerApiKey = core.getInput('tower_x_api_key');

    const hasApiKey = !!towerApiKey;
    const hasUserPass = !!(towerUser || towerPassword);

    if (hasApiKey && hasUserPass) {
      core.setFailed('Vous devez définir soit tower_x_api_key, soit tower_user + tower_password, mais pas les deux en même temps.');
      return -1;
    }
    if (!hasApiKey && !hasUserPass) {
      core.setFailed('Vous devez définir soit tower_x_api_key, soit tower_user + tower_password.');
      return -1;
    }

    const auth = hasApiKey ? undefined : { username: towerUser, password: towerPassword };
    const headers = {
      'Content-Type': 'application/json',
      ...(hasApiKey ? { 'x-apikey': towerApiKey } : {})
    };

    let extraVarsPayload: unknown = extra_vars;
    if (hasApiKey) {
      if (varsFilename) {
        // Parse YAML/JSON template first, then substitute $VAR inside string
        // values. This prevents multi-line substituted values from breaking
        // YAML indentation.
        const parsed = yaml.load(rawTemplate);
        const substitute = (node: unknown): unknown => {
          if (typeof node === 'string') {
            return node.replace(/\$(\w+)/g, (_m: string, p1: string) =>
              p1 in values ? values[p1] : p1,
            );
          }
          if (Array.isArray(node)) {
            return node.map(substitute);
          }
          if (node && typeof node === 'object') {
            return Object.fromEntries(
              Object.entries(node as Record<string, unknown>).map(([k, v]) => [k, substitute(v)]),
            );
          }
          return node;
        };
        extraVarsPayload = substitute(parsed);
      } else {
        extraVarsPayload = {
          IMAGE_URL: values.IMAGE_URL,
          GITHUB_RUN_ID: values.GITHUB_RUN_ID,
        };
      }
    }

    core.info(`⚡️ Launching Tower job ${towerUrl}/job_templates/${towerTemplateId}/launch :\n${extra_vars}`);

    const response = await axios({
      method: 'POST',
      url: `${towerUrl}/job_templates/${towerTemplateId}/launch/`,
      auth,
      headers,
      data: extra_vars ? { extra_vars: extraVarsPayload } : undefined,
    });

    const jobId: number = response.data.job;
    core.info(`📦 Full response: ${JSON.stringify(response.data, null, 2)}`);

    core.info(`🚀 Deploy job launched ${towerUrl}/#/jobs/playbook/${jobId}`);
    // poll waiting until the end of job in order to know if it will succeed or not
    const maxsteps = (Number(core.getInput('tower_timeout')) || 300) / WAITSTEP;
    let step = 0;
    while (step < maxsteps) {
      await setTimeout(WAITSTEP * 1000);
      const res = await axios({ url: `${towerUrl}/jobs/${jobId}/`, auth, headers });

      if (res.data.status === 'successful') {
        break;
      } else if (res.data.status === 'failed' || res.data.status === 'cancelled') {
        core.error(`❌ Deployment failed (${res.data.status}) ${towerUrl}/#/jobs/playbook/${jobId}`);
        core.setFailed(res.data);
        return -1;
      }
      core.info(`⌛️ Check ${step}/${maxsteps} : ${res.data.status}`);

      step++;
    }

    core.info(`✅ Automatic deployment succeeded.`);
  } catch (error: unknown) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response && axiosErr.response.status === 401) {
      core.setFailed('HTTP 401 : maybe you have to check tower_user/tower_password inputs ?');
    } else if (axiosErr.response && axiosErr.response.data) {
      core.setFailed(axiosErr.response.data as string);
    } else {
      core.setFailed(error as Error);
    }
  }
}
