#!/bin/sh -l
/prepare_extra_vars.py
/launch_job.py

result=$?
if [ $result -ne 0 ] ; then
  echo "$(date "+%F %T.%3N") ERROR    ❌ Deployment failed. Check you changes and relaunch, or try to deploy manually" ;
else
  echo "$(date "+%F %T.%3N") INFO     ✅ Automatic deployment succeeded." ;
fi ;

exit $result
