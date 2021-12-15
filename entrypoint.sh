#!/bin/sh -l

# $1 extravars_template_filename
# $2 vars
# $3 asset_url
# $4 tower_template_id
# $5 tower_url
# $6 tower_user
# $7 tower_password
# $8 tower_timeout

export EXTRA_VARS_TEMPLATE_FILENAME="/github/workspace/app/src/main/java/resources/"$1
export ARTIFACT_URL=$3
export SECRETS_CONTEXT=$2
export OPT_TOWER_TEMPLATE_ID=$4
export EXTRA_VARS_FILE="/github/workspace/tmp_extra_vars.txt"
export OPT_TOWER_URL=$5
export OPT_TOWER_USER=$6
export OPT_TOWER_PASSWORD=$7
export OPT_TOWER_TIMEOUT=$8

ls /github/workspace/app/

/prepare_extra_vars.py
/launch_job.py
