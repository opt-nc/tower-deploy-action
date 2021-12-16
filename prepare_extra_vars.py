#!/usr/bin/env python

import os
import json
import sys

  
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
sys.stdout.write(f"INFO: Environment variables processing...\n")

# ajout des variables du job dans l'environnement
tmp_var_deploy_dict["ARTIFACT_URL"] = os.environ.get("ARTIFACT_URL")

# récupération du nom du tempate extra_vars
sys.stdout.write(f"INFO: YAML file template processing...\n")
extra_vars_template_file = os.environ.get("EXTRA_VARS_TEMPLATE_FILENAME")

# Open your desired file as 't' and read the lines into string 'tempstr'
t = open(extra_vars_template_file, 'r')
tempstr = t.read()
t.close()

# Add $ in dictionary keys
final_var_deploy_dict = prepare_secrets_list(tmp_var_deploy_dict)

# Using the &quot;replace_words&quot; function, we'll pass in our tempstr to be used as the base,
# and our device_values to be used as replacement.
sys.stdout.write(f"INFO: Generate EXTRA_VARS file...\n")
output = replace_words(tempstr, final_var_deploy_dict)
sys.stdout.write(f"{repr(output)}\n")

writefile = open("tmp_extra_vars.txt", 'w+')
writefile.write(output)
writefile.close()

