import pandas as pd
import numpy as np
import requests
import json
import os
import sys
import config

filename = "happiness_survey.csv"
locations_filename = "locations.json"
api_key = config.api_key
YES = 5
NO = 1


# Read csv and return dataframe
dataframe = pd.read_csv(filename)
dataframe = dataframe.drop(dataframe.columns[0], axis=1)
dataframe.fillna(0, inplace=True)
label = dataframe.columns[len(dataframe.columns)-1]
dataframe = dataframe.replace(["Yes", "No"], [YES, NO])
locations = dataframe[label]
headers = dataframe.columns.values
set_locations = set(locations)


scale_questions = range(0, 14)
yes_no_questions = range(14, len(dataframe.columns)-1)


#print([headers[i] for i in scale_questions])
#print([headers[i] for i in yes_no_questions])
#sys.exit(1)


def get_locations():
    dict_locations = dict()

    if os.path.exists(locations_filename):
        log_locations = open(locations_filename, "r")
        dict_locations = json.load(log_locations)
        log_locations.close()


    log_locations = open(locations_filename, "w")

    # Get coordinates for the map
    for location in set_locations:
        if location in dict_locations:
            continue
        response = requests.get("https://maps.google.com/maps/api/geocode/json?" + 
            "key=" + api_key + "&address=" + "+".join(location.split(" ")))
        content = response.content
        content = json.loads(content)
        try:
            coordinates = content["results"][0]["geometry"]["location"]
            lat = coordinates["lat"]
            longi = coordinates["lng"]
            dict_locations[location] = {}
            dict_locations[location]["latitude"] = lat
            dict_locations[location]["longitude"] = longi
        except:
            print(content)

    
    if dict_locations:
        json.dump(dict_locations, log_locations)
        log_locations.close()


def analysis():
    data = {}

    num_questions = len(scale_questions) + len(yes_no_questions)
    scale = [headers[f] for f in scale_questions]
    yes_no = [headers[f] for f in yes_no_questions]

    data["all"] = {}
    data["scale"] = {}
    data["yes_no"] = {}

    data["scale"]["locations"] = {}
    data["yes_no"]["locations"] = {}
    data["all"]["locations"] = {}

    data["scale"]["questions"] = scale
    data["yes_no"]["questions"] = yes_no
    data["all"]["questions"] = [headers[f] for f in scale_questions + yes_no_questions]

    for location in set_locations:
        df = dataframe[dataframe[label] == location]
        df_no_label = df.drop(label, axis=1)
        scale_df = df[scale]
        yes_no_df = df[yes_no]
        

        total = df_no_label.sum(axis=1).mean()
        print(location, total)

        if not location in data["scale"]["locations"]:
            data["scale"]["locations"][location] = {"mean" : 0, "std": 0}
        data["scale"]["locations"][location]["mean"] = scale_df.mean().mean()
        data["scale"]["locations"][location]["std"] = scale_df.mean().std()
        
    
        if not location in data["all"]["locations"]:
            data["all"]["locations"][location] = {"total" : 0}


    log = open("analysis.json", "w")
    json.dump(data, log)
    log.close()


def responses():    
    data = {}
    data["questions"] = {}
    for i in scale_questions:
        data["questions"][headers[i]] = "scale"

    for i in yes_no_questions:
        data["questions"][headers[i]] = "yes_no"


    num_questions = len(scale_questions) + len(yes_no_questions)

    for location in set_locations:
        df = dataframe[dataframe[label] == location]
        # Number of partipants
        data[location] = {}
        data[location]["count"] = len(df)
        total_score = 0

        # scale questions stats
        for i in scale_questions:
            question = headers[i]
            question_df = df[question]
            mean = question_df.mean()
            std = question_df.std()
            total = question_df.sum()
            data[location][question] = {}
            data[location][question]["type"] = "scale"
            data[location][question]["mean"] = float(mean)
            data[location][question]["total"] = int(total)
            data[location][question]["std"] = float(std)
            total_score += total
            # Count number of occurrances
            data[location][question]["count"] = dict(question_df.value_counts().reindex(range(1,6)).fillna(0).astype(int))

        data[location]["scale_total"] = total_score
        data[location]["scale_mean"] = total_score / len(scale_questions)

        # Yes no questions
        for i in yes_no_questions:
            question = headers[i]
            question_df = df[question]
            value_counts = dict(question_df.value_counts())
            data[location][question] = {}
            data[location][question]["type"] = "yes_no"
            data[location][question]["count"] = {}
            data[location][question]["count"]["Yes"] = 0
            data[location][question]["count"]["No"] = 0
            if YES in value_counts:
                data[location][question]["count"]["Yes"] = value_counts[YES]
            
            if NO in value_counts:
                data[location][question]["count"]["No"] = value_counts[NO]

            total = question_df.sum()
            total_score += total
            
        data[location]["total_score"] = total_score
        data[location]["mean_score"] = total_score / float(num_questions)
        data[location]["std_score"] = df[question].std()



    log = open("responses.json", "w")
    json.dump(data, log)
    log.close()


#responses()
analysis()







