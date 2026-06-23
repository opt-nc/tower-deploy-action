import { jest, test, expect, beforeEach } from '@jest/globals';
import nock from 'nock';

const mockGetInput = jest.fn<(name: string) => string>();
const mockInfo = jest.fn<(message: string) => void>();
const mockError = jest.fn<(message: string | Error) => void>();
const mockSetFailed = jest.fn<(message: string | Error) => void>();

jest.unstable_mockModule('timers/promises', () => ({
  setTimeout: jest.fn(() => Promise.resolve()),
}));

jest.unstable_mockModule('@actions/core', () => ({
  getInput: mockGetInput,
  info: mockInfo,
  error: mockError,
  setFailed: mockSetFailed,
}));

const { default: action } = await import('../lib');

beforeEach(() => {
  jest.clearAllMocks();
  nock.cleanAll();
});

test('a deploy with success', async () => {
  // Given
  const inputs: Record<string, string> = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: '1',
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    extravars_template_filename: './test/test-template.yml',
  };
  mockGetInput.mockImplementation((n: string) => inputs[n] ?? '');

  const auth = { user: 'user', pass: 'password' };
  nock('https://tower.test')
    .post('/job_templates/1/launch/', (body: { extra_vars: string }) => {
      return body.extra_vars === `self_env: '{\n    "TEST": "secret"\n  }'\nself_id: valeur\nself_image_url: test:latest\n`;
    })
    .once()
    .basicAuth(auth)
    .reply(201, { job: 10 });
  nock('https://tower.test').get('/jobs/10/').once().basicAuth(auth).reply(200, { status: 'pending' });
  nock('https://tower.test').get('/jobs/10/').once().basicAuth(auth).reply(200, { status: 'successful' });

  // When
  await action();

  // Then
  expect(mockSetFailed).toHaveBeenCalledTimes(0);
  expect(mockInfo).toHaveBeenCalled();
});

test('a failure with tower', async () => {
  // Given
  const inputs: Record<string, string> = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: '1',
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    extravars_template_filename: './test/test-template.yml',
  };
  mockGetInput.mockImplementation((n: string) => inputs[n] ?? '');

  const auth = { user: 'user', pass: 'password' };
  nock('https://tower.test').post('/job_templates/1/launch/').once().basicAuth(auth).reply(201, { job: 10 });
  nock('https://tower.test').get('/jobs/10/').once().basicAuth(auth).reply(200, { status: 'pending' });
  nock('https://tower.test').get('/jobs/10/').once().basicAuth(auth).reply(200, { status: 'failed' });

  // When
  await action();

  // Then
  expect(mockSetFailed).toHaveBeenCalled();
});

test('a deploy with success using api key', async () => {
  // Given
  const inputs: Record<string, string> = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: '1',
    tower_url: 'https://tower.test',
    tower_x_api_key: 'my-api-key',
    extravars_template_filename: './test/test-template.yml',
  };
  mockGetInput.mockImplementation((n: string) => inputs[n] ?? '');

  nock('https://tower.test', { reqheaders: { 'x-apikey': 'my-api-key' } })
    .post('/job_templates/1/launch/')
    .once()
    .reply(201, { job: 10 });
  nock('https://tower.test', { reqheaders: { 'x-apikey': 'my-api-key' } })
    .get('/jobs/10/')
    .once()
    .reply(200, { status: 'successful' });

  // When
  await action();

  // Then
  expect(mockSetFailed).toHaveBeenCalledTimes(0);
  expect(mockInfo).toHaveBeenCalled();
});

test('fails when both tower_x_api_key and tower_user are defined', async () => {
  // Given
  const inputs: Record<string, string> = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: '1',
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    tower_x_api_key: 'my-api-key',
    extravars_template_filename: './test/test-template.yml',
  };
  mockGetInput.mockImplementation((n: string) => inputs[n] ?? '');

  // When
  await action();

  // Then
  expect(mockSetFailed).toHaveBeenCalledWith(
    'Vous devez définir soit tower_x_api_key, soit tower_user + tower_password, mais pas les deux en même temps.',
  );
});

test('fails when neither tower_x_api_key nor tower_user are defined', async () => {
  // Given
  const inputs: Record<string, string> = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: '1',
    tower_url: 'https://tower.test',
    extravars_template_filename: './test/test-template.yml',
  };
  mockGetInput.mockImplementation((n: string) => inputs[n] ?? '');

  // When
  await action();

  // Then
  expect(mockSetFailed).toHaveBeenCalledWith('Vous devez définir soit tower_x_api_key, soit tower_user + tower_password.');
});

test('a failure with parameters', async () => {
  // Given
  const inputs: Record<string, string> = {
    vars: '{ "SECRET": "secret" }',
    image_url: 'test:latest',
    tower_template_id: '1',
    tower_url: 'https://tower.test',
    tower_user: 'user',
    tower_password: 'password',
    extravars_template_filename: './test/test-template.yml',
  };
  mockGetInput.mockImplementation((n: string) => inputs[n] ?? '');

  const auth = { user: 'user', pass: 'password' };
  nock('https://tower.test').post('/job_templates/1/launch/').once().basicAuth(auth).reply(401);

  // When
  await action();

  // Then
  expect(mockSetFailed).toHaveBeenCalled();
});
