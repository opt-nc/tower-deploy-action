import * as core from '@actions/core';
import * as fs from 'fs';
import axios, { AxiosError } from 'axios';
import { setTimeout } from 'timers/promises';

export default async function action(): Promise<number | void> {
  const WAITSTEP = 5; // seconds between two consecutive checks of the job's status

  try {
    // eval expression "$VAR" on extravars template file
    const values: Record<string, string> = {
      ...JSON.parse(core.getInput('vars')),
      ARTIFACT_URL: core.getInput('asset_url'),
      IMAGE_URL: core.getInput('image_url'),
      GITHUB_RUN_ID: process.env.GITHUB_RUN_ID ?? '', // Tower workaround to force restart
    };
    const varsFilename = core.getInput('extravars_template_filename');
    const vars = fs
      .readFileSync(varsFilename)
      .toString()
      .replace(/\$(\w+)/g, (_m: string, p1: string) => (p1 in values ? values[p1] : p1));

    // launch Tower by a rest API
    const towerTemplateId = core.getInput('tower_template_id');
    const towerUrl = core.getInput('tower_url');
    const auth = { username: core.getInput('tower_user'), password: core.getInput('tower_password') };

    core.info(`⚡️ Launching Tower job ${towerUrl}/job_templates/${towerTemplateId}/launch :\n${vars}`);

    const response = await axios({
      method: 'POST',
      url: `${towerUrl}/job_templates/${towerTemplateId}/launch/`,
      auth,
      data: vars ? { extra_vars: vars } : undefined,
    });

    const jobId: number = response.data.job;
    core.info(`🚀 Deploy job launched ${towerUrl}/#/jobs/playbook/${jobId}`);

    // poll waiting until the end of job in order to know if it will succeed or not
    const maxsteps = (Number(core.getInput('tower_timeout')) || 300) / WAITSTEP;
    let step = 0;
    while (step < maxsteps) {
      await setTimeout(WAITSTEP * 1000);
      const res = await axios({ url: `${towerUrl}/jobs/${jobId}/`, auth });

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
