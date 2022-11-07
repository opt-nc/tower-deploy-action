const core = require('@actions/core');
const fs = require('fs');
const axios = require('axios');
const { setTimeout } = require('timers/promises');

module.exports = async function () {
  const WAITSTEP = 5; // seconds between two consecutive checks of the job's status

  try {
    // eval expression "$VAR" on extravars template file
    const values = {
      ...JSON.parse(core.getInput('vars')),
      ARTIFACT_URL: core.getInput('asset_url'),
      IMAGE_URL: core.getInput('image_url'),
      GITHUB_RUN_ID: process.env.GITHUB_RUN_ID, // Tower workaround to force restart
    };
    const varsFilename = core.getInput('extravars_template_filename');
    const vars = fs.readFileSync(varsFilename).toString().replace('$(\\W)', v => (v in values ? values[v] : v));
    core.info(`⚙️ EXTRA_VARS file evaluated :\n ${vars}`);

    // launch Tower by a rest API
    const towerTemplateId = core.getInput('tower_template_id');
    const towerUrl = core.getInput('tower_url');
    const auth = { username: core.getInput('tower_user'), password: core.getInput('tower_password') };

    const response = await axios({
      method: 'POST',
      url: `${towerUrl}/job_templates/${towerTemplateId}/launch/`,
      auth,
      data: vars && { extra_vars: vars },
    });

    const jobId = response.data.job;
    core.info(`🚀 Deploy job launched ${towerUrl}/#/jobs/playbook/${jobId}`);

    // poll waiting until the end of job in order to know if it will succed or not
    const maxsteps = (core.getInput('tower_timeout') || 300) / WAITSTEP;
    let step = 0;
    while (step < maxsteps) {
      await setTimeout(WAITSTEP * 1000);
      const res = await axios({ url: `${towerUrl}/jobs/${jobId}`, auth });
      
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

    core.info(`✅ Automatic deployment succeeded.`)
  } catch (error) {
    if (error.response && error.response.status === 401) {
      core.setFailed('HTTP 401 : maybe you have to check tower_ser/tower_password inputs ?');
    } else if (error.response && error.response.data) {
      core.setFailed(error.response.data);
    } else {
      core.setFailed(error);
    }
  }
};
