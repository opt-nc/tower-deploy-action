[![DEV.to](https://img.shields.io/badge/DEV.to%20posts-Speeding%20Up%20Time%20to%20Market%20with%20Custom%20Github%20Actions-blue)](https://dev.to/adriens/speeding-up-time-to-market-with-custom-github-actions-3md0)
# tower-deploy-action

This Github action aims to interact with Tower servers.

It connects to a Tower server and launches a job based on a template id, if needed an extra_vars file can be send.

## Usage

See [action.yml](action.yml)

If you need extra_vars data, you have to first checkout the repository you aim to deploy and that contains the extra_vars yaml file template. 
The templated yaml file have to be put in the *src/main/resource* folder. 
Default filename is *tower_extra_vars_template.yml*, if you want to use another filename, please use *extravars_template_filename* input.

### Deploy an application from main branch

```yaml
  integration-deploy:
    name: Call deploy action
    runs-on: ubuntu-latest
    environment: integration
    steps:
      - name: Checkout my repo
        uses: actions/checkout@v2
      - name: Invoke deploy action
        uses: opt-nc/tower-deploy-action@v1.1.0
        with:
          vars: ${{ tojson(secrets) }}
          asset_url:  https://github.com/my_org/my_repo/releases/download/integration/my_app.jar
          tower_template_id : 45
          tower_url: ${{ secrets.TOWER_URL }}
          tower_password: ${{ secrets.TOWER_PASSWORD }}
          tower_user: ${{ secrets.TOWER_USER }}
```

### Deploy an application from tag

```yaml
  qualification-deploy:
    name: Call deploy action
    runs-on: ubuntu-latest
    environment: qualification
    steps:
      - name: Checkout my repo
        uses: actions/checkout@v2
          ref: 1.0.0
      - name: Invoke deploy action
        uses: opt-nc/tower-deploy-action@v1.1.0
        with:
          vars: ${{ tojson(secrets) }}
          asset_url:  https://github.com/my_org/my_repo/releases/download/1.0.0/my_app.jar
          tower_template_id : 46
          tower_url: ${{ secrets.TOWER_URL }}
          tower_password: ${{ secrets.TOWER_PASSWORD }}
          tower_user: ${{ secrets.TOWER_USER }}
```

## The Team
- [@tamere-allo-peter](https://github.com/tamere-allo-peter) as OPS
- [@mbarre](https://github.com/mbarre) as Gh Action developer
- [@Dougniel](https://github.com/Dougniel) as Gh Action reviewer
- [@adriens](https://github.com/adriens) as Product Owner

Many thanks to your contribution.
