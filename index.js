const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fs = require('fs');
const { fetchContributionHistory, formatAPIContributionHistory } = require('./history');
const { getProcessableHistory, mergeAPIHistoryWithTracker, sortTrackerObject } = require('./tracker');
const { commitFromTrackerObject } = require('./commit');

try {

    // Load the inputs
    const sourceUsername = core.getInput('source-graph-username');
    const sourceToken = core.getInput('source-graph-token');
    // const offsetHHMM = "+0800"
    const offsetHHMM = core.getInput('offset-hhmm');
    const authorEmail = core.getInput('git-author-email');
    const authorName = core.getInput('git-author-name');

    console.log(`Fetching graph from ${sourceUsername}`);

    const contributionHistoryWeeks = await fetchContributionHistory(sourceUsername, sourceToken);

    contributionHistoryWeeks = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]

    console.log("Contribution history returned:", contributionHistoryWeeks)

    // Check tracker.json for progress
    // If it doesn't exist, return empty object

    /* Tracker format is
     {    
        "2023": {
            "01": {
                30: {
                    "usernameHere": 3,
                    "usernameHere2": 2
                },
                31: {
                    "usernameHere": 3,
                    "usernameHere2": 2
                }
            },
            "02": {
                01: {
                    "usernameHere": 3,
                    "usernameHere2": 2
                }
            }
        },
        "2024": {
            "01": {
                30: {
                    "usernameHere": 3,
                    "usernameHere2": 2
                }
            }
        }
    }
    */
    let tracker
    try {
        tracker = JSON.parse(fs.readFileSync('tracker.json', 'utf8'));
    } catch (err) {
        console.log("No tracker.json found, starting from scratch");
    }

    let mostRecentYear, mostRecentMonth, mostRecentDay, mostRecentData, mostRecentDate
    if (tracker) {
        // Select the most recent [year][month][day] from the tracker
        // Also select its data
        mostRecentYear = Object.keys(tracker).sort().reverse()[0]
        mostRecentMonth = Object.keys(tracker[mostRecentYear]).sort().reverse()[0]
        mostRecentDay = Object.keys(tracker[mostRecentYear][mostRecentMonth]).sort().reverse()[0]
        mostRecentData = tracker[mostRecentYear][mostRecentMonth][mostRecentDay]
        mostRecentDate = new Date(mostRecentYear, mostRecentMonth, mostRecentDay)
    }

    /* Each week from api looks like
 
    {
        "contributionDays": [
            {
                "contributionCount": 0,
                "date": "2023-09-10"
            },
            {
                "contributionCount": 3,
                "date": "2023-09-11"
            },
            {
                "contributionCount": 0,
                "date": "2023-09-12"
            },
            {
                "contributionCount": 3,
                "date": "2023-09-13"
            },
            {
                "contributionCount": 3,
                "date": "2023-09-14"
            },
            {
                "contributionCount": 0,
                "date": "2023-09-15"
            },
            {
                "contributionCount": 0,
                "date": "2023-09-16"
            }
        ]
    },
 
    */
    /* Convert the days from the API into our tracker format
     This:
     {
         "contributionCount": 8,
         "date": "2023-09-10"
     }
 
     should become this:
     "2023": {
         "09": {
             10: {
                 "{sourceUsername}": 8,
             }
         }
     }
     */
    let trackerFormattedFromAPI = formatAPIContributionHistory(contributionHistoryWeeks, sourceUsername, mostRecentDate)
    // Calculate the difference between the most recent data from the tracker and the most recent data from the API
    let processableHistory = getProcessableHistory(tracker, trackerFormattedFromAPI, sourceUsername, mostRecentDate, mostRecentData)
    // Sort processableHistory by date, ascending year, month, day first:
    processableHistory = sortTrackerObject(processableHistory)
    // Commit from processableHistory
    commitFromTrackerObject(processableHistory, sourceUsername, authorName, authorEmail, offsetHHMM)

    // Merge processableHistory with tracker
    // We don't use the tracker-formatted-from-api because it doesn't have the data from older days or other users
    tracker = mergeAPIHistoryWithTracker(tracker, processableHistory, sourceUsername)
    fs.writeFileSync('tracker.json', JSON.stringify(tracker, null, 2));

} catch (error) {
    core.setFailed(error.message);
}