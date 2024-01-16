const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fs = require('fs');

try {

    // Load the inputs
    const sourceUsername = core.getInput('source-graph-username');
    const sourceToken = core.getInput('source-graph-token');
    // const offsetHHMM = "+0800"
    const offsetHHMM = core.getInput('offset-hhmm');
    const authorEmail = core.getInput('git-author-email');
    const authorName = core.getInput('git-author-name');
    const authorString = authorName + " <" + authorEmail + ">"

    console.log(`Fetching graph from ${sourceUsername}`);

    const githubGraphQLEndpoint = "https://api.github.com/graphql"
    const contributionHistoryQuery = `query($sourceUsername:String!) { 
                                        user(login: $sourceUsername){
                                            contributionsCollection {
                                                contributionCalendar {
                                                    totalContributions
                                                    weeks {
                                                        contributionDays {
                                                            contributionCount
                                                            date
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }`

    let contributionHistoryWeeks = []
    fetch(githubGraphQLEndpoint, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + sourceToken,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            query: contributionHistoryQuery,
            variables: { sourceUsername },
        }),

    })
        .then(r => r.json())
        .then(data => {
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
            let trackerFormattedFromAPI = {}
            contributionHistoryWeeks.forEach(week => {
                week["contributionDays"].forEach(day => {
                    let splitDate = day["date"].split("-")
                    let splitYear = splitDate[0]
                    let splitMonth = splitDate[1]
                    let splitDay = splitDate[2]
                    let currentDate = new Date(splitYear, splitMonth, splitDay)
                    if (mostRecentDate && currentDate < mostRecentDate) {
                        // Skip days that are older than the most recent day in the tracker
                        return
                    }
                    if (!trackerFormattedFromAPI[splitYear]) {
                        trackerFormattedFromAPI[splitYear] = {}
                    }
                    if (!trackerFormattedFromAPI[splitYear][splitMonth]) {
                        trackerFormattedFromAPI[splitYear][splitMonth] = {}
                    }
                    if (!trackerFormattedFromAPI[splitYear][splitMonth][splitDay]) {
                        trackerFormattedFromAPI[splitYear][splitMonth][splitDay] = {}
                    }
                    trackerFormattedFromAPI[splitYear][splitMonth][splitDay][sourceUsername] = day["contributionCount"]
                })
            })
            if (tracker) {

                // From trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername], get the number of contributions (if at all)
                let mostRecentContributions = 0
                if (trackerFormattedFromAPI[mostRecentYear] && trackerFormattedFromAPI[mostRecentYear][mostRecentMonth] && trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay] && trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername]) {
                    // if it does exist, get the number of contributions
                    mostRecentContributions = trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername]
                }

                // Minus the mostRecentData[sourceUsername] from the JSON file, if exists
                let mostRecentDataFromTracker = 0
                if (mostRecentData && mostRecentData[sourceUsername]) {
                    mostRecentDataFromTracker = mostRecentData[sourceUsername]
                }

                // Set the trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername] to the difference, if below 0, set to 0
                trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername] = Math.max(0, mostRecentContributions - mostRecentDataFromTracker)
            }
            // Now trackerFormattedFromAPI is what we have to process
            commitFromTrackerObject(trackerFormattedFromAPI)

            // Merge trackerFormattedFromAPI with tracker
            // If there are any conflicts, merge the contributions
            // If there are no conflicts, add the new data
            // Then write to tracker.json
            if (tracker) {

                for (let year in trackerFormattedFromAPI) {
                    for (let month in trackerFormattedFromAPI[year]) {
                        for (let day in trackerFormattedFromAPI[year][month]) {
                            if (!tracker[year]) {
                                tracker[year] = {}
                            }
                            if (!tracker[year][month]) {
                                tracker[year][month] = {}
                            }
                            if (!tracker[year][month][day]) {
                                tracker[year][month][day] = {}
                            }
                            if (!tracker[year][month][day][sourceUsername]) {
                                tracker[year][month][day][sourceUsername] = 0
                            }
                            tracker[year][month][day][sourceUsername] += trackerFormattedFromAPI[year][month][day][sourceUsername]
                        }
                    }
                }
            } else {
                tracker = trackerFormattedFromAPI
            }

            fs.writeFileSync('tracker.json', JSON.stringify(tracker, null, 2));










            // Get the JSON webhook payload for the event that triggered the workflow
            const payload = JSON.stringify(github.context.payload, undefined, 2)
            console.log(`The event payload: ${payload}`);
        })


    function commitFromTrackerObject(trackerObject) {
        /* For each day in trackerObject, call commit() with the date and number of contributions from sourceUsername */
        setGitConfig()
        for (let year in trackerObject) {
            for (let month in trackerObject[year]) {
                for (let day in trackerObject[year][month]) {
                    let date = new Date(year, month, day)
                    let contributionsForTheDay = trackerObject[year][month][day][sourceUsername]
                    commit(date, contributionsForTheDay)
                }
            }
        }
    }
    function setGitConfig() {
        exec.exec("git", ["config", "user.email", authorEmail])
        exec.exec("git", ["config", "user.name", authorName])
    }


    function commit(date, contributionsForTheDay) {
        let dateFormatted = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + " 00:00:01 " + offsetHHMM
        let commitMessage = "Contribution sync from " + sourceUsername
        let options = {
            env: {
                GIT_AUTHOR_DATE: dateFormatted,
                GIT_COMMITTER_DATE: dateFormatted
            }
        }

        for (let i = 0; i < contributionsForTheDay; i++) {
            exec.exec("git", ["commit", "-m='" + commitMessage + "'", "--allow-empty", "--author='" + authorString + "'"], options)
        }
    }
} catch (error) {
    core.setFailed(error.message);
}