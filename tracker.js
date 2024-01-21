/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const getProcessableHistory = (tracker, trackerFormattedFromAPI, sourceUsername, mostRecentYear, mostRecentMonth, mostRecentDay, mostRecentData) => {
    // Early return if trackerFormattedFromAPI is empty
    if (!tracker) {
        return trackerFormattedFromAPI
    }

    // From trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername], get the number of contributions (if at all)
    let mostRecentContributions = 0
    if (trackerFormattedFromAPI?.[mostRecentYear]?.[mostRecentMonth]?.[mostRecentDay]?.[sourceUsername]) {
        // if it does exist, get the number of contributions
        mostRecentContributions = trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername];
    }

    // Minus the mostRecentData[sourceUsername] from the JSON file, if exists
    let mostRecentDataFromTracker = mostRecentData?.[sourceUsername] ?? 0;

    // Set the trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername] to the difference, if below 0, set to 0
    trackerFormattedFromAPI[mostRecentYear][mostRecentMonth][mostRecentDay][sourceUsername] = Math.max(0, mostRecentContributions - mostRecentDataFromTracker);

    return trackerFormattedFromAPI
}


const mergeAPIHistoryWithTracker = (tracker, processableHistory, sourceUsername) => {
    if (!tracker) {
        return processableHistory
    }

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

    return tracker
}

const sortTrackerObject = (trackerObject) => {
    const sortedTrackerObject = {};
    const years = Object.keys(trackerObject).sort();
    for (const year of years) {
        const months = Object.keys(trackerObject[year]).sort();
        sortedTrackerObject[year] = {};
        for (const month of months) {
            const days = Object.keys(trackerObject[year][month]).sort();
            sortedTrackerObject[year][month] = {};
            for (const day of days) {
                sortedTrackerObject[year][month][day] = trackerObject[year][month][day];
            }
        }
    }
    return sortedTrackerObject;
}

module.exports = { getProcessableHistory, mergeAPIHistoryWithTracker, sortTrackerObject };