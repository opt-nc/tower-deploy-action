#!/bin/sh -l
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
