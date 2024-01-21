
const getProcessableHistory = (tracker, trackerFormattedFromAPI, sourceUsername, mostRecentDate) => {
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
    return trackerFormattedFromAPI
}


const mergeAPIHistoryWithTracker = (tracker, processableHistory, sourceUsername) => {
    if (tracker) {
        for (let year in processableHistory) {
            for (let month in processableHistory[year]) {
                for (let day in processableHistory[year][month]) {
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
                    tracker[year][month][day][sourceUsername] += processableHistory[year][month][day][sourceUsername]
                }
            }
        }
    } else {
        tracker = processableHistory
    }
    return tracker
}

module.exports = { getProcessableHistory, mergeAPIHistoryWithTracker };