#!/usr/bin/env python

import os
import json
import sys
import logging

logging.basicConfig(
    format='%(asctime)s.%(msecs)03d %(levelname)-8s %(message)s',
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S')
  
def replace_words(base_text, vars_values):
    for key, val in vars_values.items():
        base_text = base_text.replace(key, val)
    return base_text

def prepare_secrets_list(vars_dict):
    target_vars_dict = {}
    for key, val in vars_dict.items():
        target_vars_dict["$"+key] = val
    return target_vars_dict

  
# récupération des secrets Github dans l'environnement
tmp_var_deploy = os.environ.get("SECRETS_CONTEXT")
tmp_var_deploy_dict = json.loads(tmp_var_deploy)
logging.info(f"⚙️ Environment variables processing...")

# ajout des variables du job dans l'environnement
tmp_var_deploy_dict["ARTIFACT_URL"] = os.environ.get("ARTIFACT_URL")

# Tower workaround to force restart
tmp_var_deploy_dict["GITHUB_RUN_ID"] = os.environ.get("GITHUB_RUN_ID")

# récupération du nom du tempate extra_vars
logging.info(f"⚙️ YAML file template processing...")
extra_vars_template_file = os.environ.get("EXTRA_VARS_TEMPLATE_FILENAME")

# Open your desired file as 't' and read the lines into string 'tempstr'
t = open(extra_vars_template_file, 'r')
tempstr = t.read()
t.close()

# Add $ in dictionary keys
final_var_deploy_dict = prepare_secrets_list(tmp_var_deploy_dict)

# Using the &quot;replace_words&quot; function, we'll pass in our tempstr to be used as the base,
# and our device_values to be used as replacement.
logging.info(f"⚙️ Generate EXTRA_VARS file...")
output = replace_words(tempstr, final_var_deploy_dict)
logging.info({repr(output)})

extra_vars_file = os.environ.get("EXTRA_VARS_FILE")
writefile = open(extra_vars_file, 'w+')
writefile.write(output)
writefile.close()

