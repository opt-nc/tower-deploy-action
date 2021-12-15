# Container image that runs your code
FROM python:3.11.0a3-alpine

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh
COPY launch_job.py /launch_job.py
COPY prepare_extra_vars.py /prepare_extra_vars.py

RUN chmod +x entrypoint.sh
RUN chmod +x launch_job.py
RUN chmod +x prepare_extra_vars.py

COPY ./../app /app
RUN echo $(ls .)

RUN pip install requests

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/entrypoint.sh"]
