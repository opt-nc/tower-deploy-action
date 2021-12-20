#!/bin/sh -l

# $1 extravars_template_filename
# $2 vars
# $3 asset_url
# $4 tower_template_id
# $5 tower_url
# $6 tower_user
# $7 tower_password
# $8 tower_timeout

export EXTRA_VARS_TEMPLATE_FILENAME="/github/workspace/app/src/main/resources/"$1
export ARTIFACT_URL=$3
export SECRETS_CONTEXT=$2 
export TOWER_TEMPLATE_ID=$4
export EXTRA_VARS_FILE="/github/workspace/tmp_extra_vars.txt"
export TOWER_URL=$5
export TOWER_USER=$6
export TOWER_PASSWORD=$7
export TOWER_TIMEOUT=$8

# fix double quote secret value
SECRETS_CONTEXT=$(echo $SECRETS_CONTEXT | sed -s 's,\\\\",\\\",g')

/prepare_extra_vars.py
/launch_job.py

result=$?
if [ $result -ne 0 ] ; then
  echo "ERROR : Deployment failed." ;
  echo "Check you changes and relaunch, or try to deploy manually" ;
else
  echo "INFO : Automatic deployment succeeded." ;
fi ;

exit $result
