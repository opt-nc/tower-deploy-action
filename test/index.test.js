const nock = require('nock');
const core = require('@actions/core');

jest.spyOn(require('timers/promises'), 'setTimeout').mockImplementation(() => Promise.resolve());

const action = require('../lib');

test('a deploy with success', async () => {
  // Given
  const inputs = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: 1,
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    extravars_template_filename: './test/test-template.yml',
  };
  jest.spyOn(core, 'getInput').mockImplementation(n => inputs[n]);

  const info = jest.spyOn(core, 'info');
  const setFailed = jest.spyOn(core, 'setFailed');

  const auth = { user: 'user', pass: 'password' };
  nock('https://tower.test').post('/job_templates/1/launch/').once().basicAuth(auth).reply(201, { job: 10 });
  nock('https://tower.test').get('/jobs/10').once().basicAuth(auth).reply(200, { status: 'pending' });
  nock('https://tower.test').get('/jobs/10').once().basicAuth(auth).reply(200, { status: 'successful' });

  // When
  await action();

  // Then
  expect(setFailed).toHaveBeenCalledTimes(0);
  expect(info).toHaveBeenCalled();
});

test('a failure with tower', async () => {
  // Given
  const inputs = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: 1,
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    extravars_template_filename: './test/test-template.yml',
  };
  jest.spyOn(core, 'getInput').mockImplementation(n => inputs[n]);

  const info = jest.spyOn(core, 'info');
  const setFailed = jest.spyOn(core, 'setFailed');

  const auth = { user: 'user', pass: 'password' };
  nock('https://tower.test').post('/job_templates/1/launch/').once().basicAuth(auth).reply(201, { job: 10 });
  nock('https://tower.test').get('/jobs/10').once().basicAuth(auth).reply(200, { status: 'pending' });
  nock('https://tower.test').get('/jobs/10').once().basicAuth(auth).reply(200, { status: 'failed' });

  // When
  await action();

  // Then
  expect(setFailed).toHaveBeenCalled();
});

test('a failure with parameters', async () => {
  // Given
  const inputs = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: 1,
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    extravars_template_filename: './test/test-template.yml',
  };
  jest.spyOn(core, 'getInput').mockImplementation(n => inputs[n]);

  const info = jest.spyOn(core, 'info');
  const setFailed = jest.spyOn(core, 'setFailed');

  const auth = { user: 'user', pass: 'password' };
  nock('https://tower.test').post('/job_templates/1/launch/').once().basicAuth(auth).reply(401);

  // When
  await action();

  // Then
  expect(setFailed).toHaveBeenCalled();
});
