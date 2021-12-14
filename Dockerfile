# Container image that runs your code
FROM alpine:3.10

RUN apt update
RUN apt install python

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh
COPY launch_job.py /launch_job.py
COPY prepare_extra_vars.py /prepare_extra_vars.py

RUN chmod +x entrypoint.sh
RUN chmod +x launch_job.py
RUN chmod +x prepare_extra_vars.py

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/entrypoint.sh"]
