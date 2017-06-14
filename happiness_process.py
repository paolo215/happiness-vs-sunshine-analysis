"""
    Preprocessing survey responses for analysis and data visualization
"""

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

# Drop timestamp column
dataframe = dataframe.drop(dataframe.columns[0], axis=1)

# Replaced NaN with 0
dataframe.fillna(0, inplace=True) 

# Get label columns
label = dataframe.columns[len(dataframe.columns)-1]

# Replace 'Yes' and 'No' with assigned values
dataframe = dataframe.replace(["Yes", "No"], [YES, NO])

# Get dataframe label column
locations = dataframe[label]

# Get all header columns
headers = dataframe.columns.values

# Create a set of locations using the locations dataframe
set_locations = set(locations)


# Column 0 to 14 are the scale questions
scale_questions = range(0, 14)

# 14 to the 2nd to the last column are yes and no typed questions
yes_no_questions = range(14, len(dataframe.columns)-1)


def get_locations():
    """
    Get GPS locations using Google maps API for each of unique locations in the
    locations dataframe. It then dumps all the locations information to a JSON
    file.
    """
    
    # Initializes main data structure for this method
    data = dict()

    # Checks if file already exists. If so, extract all the information 
    if os.path.exists(locations_filename):
        log_locations = open(locations_filename, "r")
        data = json.load(log_locations)
        log_locations.close()


    
    log_locations = open(locations_filename, "w")

    # Get coordinates for the map
    for location in set_locations:

        # Skip if location key already exists
        if location in data:
            continue

        # Call Google maps API 
        response = requests.get("https://maps.google.com/maps/api/geocode/json?" + 
            "key=" + api_key + "&address=" + "+".join(location.split(" ")))

        # Get contents in JSON
        content = response.content
        content = json.loads(content)
        try:
            # Extract coordinates 
            coordinates = content["results"][0]["geometry"]["location"]
            lat = coordinates["lat"]
            longi = coordinates["lng"]

            # Add coordinates to main data structure
            data[location] = {}
            data[location]["latitude"] = lat
            data[location]["longitude"] = longi
        except:
            print(content)

    
    # Dump data to JSON file
    if data:
        json.dump(data, log_locations)
        log_locations.close()


def analysis():
    """
    - Calculates the mean, std and std error for all the Likert scale responses
    - Uses each yes and no questions by grouping up responses who responded
        yes or no and calculates the mean, std, and std error

    """
    data = {}

    scale = [headers[f] for f in scale_questions]
    yes_no = [headers[f] for f in yes_no_questions]


    # Set up JSON
    data["scale"] = {}
    data["yes_no"] = {}

    data["scale"]["locations"] = {}
    data["yes_no"]["results"] = {}

    data["scale"]["questions"] = scale
    data["yes_no"]["questions"] = yes_no

    for location in set_locations:

        # Select responses obtained in this location
        df = dataframe[dataframe[label] == location]

        # Skip empty dataframe
        if len(df) == 0:
            continue

        # Drop label
        df_no_label = df.drop(label, axis=1)

        # Get scale and yes and no dataframes
        scale_df = df[scale]
        yes_no_df = df[yes_no]
        

        # Set up location for scale
        if not location in data["scale"]["locations"]:
            data["scale"]["locations"][location] = {"mean" : 0, "std": 0, "error" : 0}
        
        # Sum up all scale questions and calculate mean, std and std error
        data["scale"]["locations"][location]["mean"] = scale_df.sum(axis=1).mean(axis=0)
        data["scale"]["locations"][location]["std"] = scale_df.sum(axis=1).std(axis=0)
        data["scale"]["locations"][location]["error"] = scale_df.sum(axis=1).std(axis=0) / np.sqrt(len(df))


        # Iterate through yes and no questions
        for question in yes_no:

            # Set up results for this yes and no question
            if not question in data["yes_no"]["results"]:
                data["yes_no"]["results"][question] = {"yes" : {}, "no": {}}
                data["yes_no"]["results"][question]["yes"]["locations"] = {}
                data["yes_no"]["results"][question]["no"]["locations"] = {}
            
            # Set up for no
            if not location in data["yes_no"]["results"][question]["no"]["locations"]:
                    data["yes_no"]["results"][question]["no"]["locations"][location] = {"mean": 0, "std": 0, "error" : 0}

            # Set up for yes
            if not location in data["yes_no"]["results"][question]["yes"]["locations"]:
                data["yes_no"]["results"][question]["yes"]["locations"][location] = {"mean": 0, "std": 0, "error": 0}

            # Group up dataframe
            yes = df[df[question] == YES]
            no = df[df[question] == NO]

            # Calculate stats for yes dataframe if length is greater than 1
            if len(yes) > 1:
                data["yes_no"]["results"][question]["yes"]["locations"][location]["mean"] = yes[scale].sum(axis=1).mean(axis=0)
                data["yes_no"]["results"][question]["yes"]["locations"][location]["std"] = yes[scale].sum(axis=1).std(axis=0)
                data["yes_no"]["results"][question]["yes"]["locations"][location]["error"] = yes[scale].sum(axis=1).std(axis=0) / np.sqrt(len(yes))

            # Calculate stats for no dataframe if length is greater than 1
            if len(no) > 1:
                data["yes_no"]["results"][question]["no"]["locations"][location]["mean"] = no[scale].sum(axis=1).mean(axis=0)
                data["yes_no"]["results"][question]["no"]["locations"][location]["std"] = no[scale].sum(axis=1).std(axis=0)
                data["yes_no"]["results"][question]["no"]["locations"][location]["error"] = no[scale].sum(axis=1).std(axis=0) / np.sqrt(len(no))



    log = open("analysis.json", "w")
    json.dump(data, log)
    log.close()


def responses():
    """
    Count of responses for each region and group up based on their responses
    For example, there are 5 groups for Likert scale questiosn (1-5)
    
    """    

    # Set up JSON
    data = {}
    data["questions"] = {}
    for i in scale_questions:
        data["questions"][headers[i]] = "scale"

    for i in yes_no_questions:
        data["questions"][headers[i]] = "yes_no"


    # Iterate through locations
    for location in set_locations:

        # Filter out rows that does not belong in this location
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

            # Set type, mean, total responses and std
            data[location][question]["type"] = "scale"
            data[location][question]["mean"] = float(mean)
            data[location][question]["total"] = int(total)
            data[location][question]["std"] = float(std)

            
            total_score += total

            # Count number of occurrances
            data[location][question]["count"] = dict(question_df.value_counts().reindex(range(1,6)).fillna(0).astype(int))

        # Set total score and mean
        data[location]["scale_total"] = total_score
        data[location]["scale_mean"] = total_score / len(scale_questions)

        # Yes no questions
        for i in yes_no_questions:
            question = headers[i]
            question_df = df[question]
            value_counts = dict(question_df.value_counts())

            # Set up 
            data[location][question] = {}
            data[location][question]["type"] = "yes_no"
            data[location][question]["count"] = {}
            data[location][question]["count"]["Yes"] = 0
            data[location][question]["count"]["No"] = 0

            # Count number of occurrances that responded yes
            if YES in value_counts:
                data[location][question]["count"]["Yes"] = value_counts[YES]
            
            if NO in value_counts:
                data[location][question]["count"]["No"] = value_counts[NO]

            total = question_df.sum()
            total_score += total

        # Calculate total, mean and std
        num_questions = len(scale_questions) + len(yes_no_questions)            
        data[location]["total_score"] = total_score
        data[location]["mean_score"] = total_score / float(num_questions)
        data[location]["std_score"] = df[question].std()



    log = open("responses.json", "w")
    json.dump(data, log)
    log.close()


#get_locations()
#responses()
analysis()







