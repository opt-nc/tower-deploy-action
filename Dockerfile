# Container image that runs your code
FROM python:3.11.0a3-alpine

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh
COPY launch_job.py /launch_job.py
COPY prepare_extra_vars.py /prepare_extra_vars.py

RUN chmod +x entrypoint.sh
RUN chmod +x launch_job.py
RUN chmod +x prepare_extra_vars.py

# Répertoire contenant le source de l'application à déployer
# Permet de récuperer le fichier templaté des extra_vars contenu dans src/main/resources
VOLUME ./../app /app

RUN pip install requests
RUN apk add jq

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/entrypoint.sh"]
