#! /usr/bin/env python
# -*- coding: utf-8 -*-

"""This module provides a class to interact with Tower servers.

When launched from the command line, it connects to a Tower server and
launches a job based on a template id, then waits for the job to
finish and returns its status, 0 indicating no error.

Input arguments are taken from environment variables :

* TOWER_URL : base url of the Tower server
* TOWER_USER : Username on the Tower server
* TOWER_PASSWORD : Username's password
* TOWER_TEMPLATE_ID : Template to use to launch the job
* TOWER_TIMEOUT : optional timeout in seconds, defaults to 300 if not set
* EXTRA_VARS_FILE : Extra vars file
"""

import sys
import os
import time
import json
import requests

WAITSTEP = 5.0 # seconds between two consecutive checks of the job's status

class Tower:
    """A class for Tower servers."""
    def __init__(self, url, username, password):
        """Initialize server authentication."""
        self.towerurl = url
        self.towerauth = requests.auth.HTTPBasicAuth(username, password)

    def launch(self, templateid):
        """Launch a job based on a template id."""
        response = requests.post(f"{self.towerurl}/job_templates/{templateid}/launch/",
                                 auth=self.towerauth)
        
        sys.stderr.write(f"status code : {response.status_code}")
        if response.status_code == 201:
            return json.loads(response.text).get("job", 0)
        sys.stderr.write(f"ERROR :\n{repr(response.text)}\n")
        return 0
    
    def launch_with_vars(self, templateid, extra_vars_file):
        """Push file content in string """
        t = open(extra_vars_file, 'r')
        extra_vars_string = t.read()
        t.close()
        
        """Launch a job based on a template id."""
        sys.stdout.write(f"INFO :\n Call job with extra_vars :{repr(extra_vars_string)} \n")
        response = requests.post(f"{self.towerurl}/job_templates/{templateid}/launch/",
                                 auth=self.towerauth, json={"extra_vars":extra_vars_string} )
        
        sys.stderr.write(f"status code : {response.status_code}")
        if response.status_code == 201:
            return json.loads(response.text).get("job", 0)
        sys.stderr.write(f"ERROR :\n{repr(response.text)}\n")
        return 0

    def wait(self, jobid):
        """Wait for a job to finish and return its result."""
        # Timeout defaults to 5 minutes if not set, with a minimum of 30 seconds
        timeout = max(30, int(os.environ.get("TOWER_TIMEOUT", 300)))
        maxsteps = timeout / WAITSTEP
        step = 0
        while step < maxsteps:
            time.sleep(WAITSTEP)
            step += 1
            response = requests.get(f"{self.towerurl}/jobs/{jobid}/", auth=self.towerauth)
            if response.status_code == 404:
                sys.stderr.write(f"ERROR : Unable to find Tower Job #{jobid}\n")
                return True
            status = json.loads(response.text).get("status", "unknown")
            if status == "successful":
                return False
            if status in ("failed", "cancelled"):
                return True
            #else :
            #    pass # ("pending", "waiting", "running")
        sys.stderr.write(f"ERROR : Tower Job #{jobid} was still running after {timeout} seconds\n")
        return True

def main():
    """Main function."""
    tower_url = os.environ.get("TOWER_URL")
    tower_username = os.environ.get("TOWER_USER")
    tower_password = os.environ.get("TOWER_PASSWORD")
    tower_template_id = os.environ.get("TOWER_TEMPLATE_ID")
    extra_vars_file = os.environ.get("EXTRA_VARS_FILE")

    if tower_url and tower_username and tower_password and tower_template_id:
        try:
            twr = Tower(tower_url, tower_username, tower_password)
            if extra_vars_file:
               jobid = twr.launch_with_vars(tower_template_id, extra_vars_file)
               sys.stdout.write(f"INFO : Launch job #{jobid} with extra vars template file : {extra_vars_file}\n")
            else:
               jobid = twr.launch(tower_template_id)
            if jobid > 0:
                sys.stdout.write(f"INFO : Please wait, Tower Job #{jobid} is running...\n")
                sys.stdout.flush()
                jobstatus = twr.wait(jobid)
                if not jobstatus:
                    return 0
                sys.stderr.write(f"ERROR : Problem encountered while running Tower Job #{jobid}\n")
                return -1
            sys.stderr.write(f"ERROR : Impossible to execute a job based on Tower Template #{tower_template_id}\n")  # pylint: disable=line-too-long
            return -2
        except requests.exceptions.ConnectionError as msg:
            sys.stderr.write(f"ERROR : Impossible to connect to Tower at {tower_url} :\n{msg}\n")
            return -3
    sys.stderr.write(("ERROR : Environnement variables TOWER_URL, TOWER_USER,"
                      " TOWER_PASSWORD and TOWER_TEMPLATE_ID must be defined.\n"))
    return -4

if __name__ == "__main__":
    sys.exit(main())
