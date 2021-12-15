# tower-deploy-action

This Github action aims to interact with Tower servers.

It connects to a Tower server and launches a job based on a template id, if needed an extra_vars file can be send.

## Usage

See [action.yml](action.yml)

If you need extra_vars, you have to first to checkout the repository you aim to deploy. 
You have to put the templated yaml file in the src/main/resource folder. 
Default filename is *tower_extra_vars_template.yml*, if you want to use another filename, please use *extravars_template_filename* input.

### Deploy an application from main branch

```yaml
  call-deploy-action:
    name: Call deploy action
    runs-on: ubuntu-latest
    environment: integration
    steps:
      - name: Checkout my repo
        uses: actions/checkout@v2
        with:
          path: ./app
      - name: Invoke deploy action
        env:
          SECRETS_CONTEXT: ${{ tojson(secrets) }}
        uses: ./tower-deploy-action
        with:
          vars: ${{ env.SECRETS_CONTEXT }}
          asset_url:  https://github.com/my_org/my_repo/releases/download/integration/my_app.jar
          tower_template_id : 45
          tower_url: ${{ secrets.TOWER_URL }}
          tower_password: ${{ secrets.TOWER_PASSWORD }}
          tower_user: ${{ secrets.TOWER_USER }}
```

### Deploy an application from tag

```yaml
  call-deploy-action:
    name: Call deploy action
    runs-on: ubuntu-latest
    environment: qualification
    steps:
      - name: Checkout my repo
        uses: actions/checkout@v2
        with:
          path: ./app
          ref: 1.0.0
      - name: Invoke deploy action
        env:
          SECRETS_CONTEXT: ${{ tojson(secrets) }}
        uses: ./tower-deploy-action
        with:
          vars: ${{ env.SECRETS_CONTEXT }}
          asset_url:  https://github.com/my_org/my_repo/releases/download/1.0.0/my_app.jar
          tower_template_id : 46
          tower_url: ${{ secrets.TOWER_URL }}
          tower_password: ${{ secrets.TOWER_PASSWORD }}
          tower_user: ${{ secrets.TOWER_USER }}
```
