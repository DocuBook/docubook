/** @type {import('czg').GlobalOptions} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
  prompt: {
    alias: {
      fd: 'docs: fix typos',
      af: 'fix: fix something',
    },
    customScopesAlign: {
      when: 'always',
      value: ['docs', 'app', 'packages', 'components', 'utils', 'hooks', 'types', 'configs', 'scripts'],
    },
    defaultScopes: ['app', 'packages'],
    allowEmptyScopes: true,
    customScopesAlign: true,
    emptyScopesAlias: 'empty',
    upperCaseSubject: false,
  },
}

export default config