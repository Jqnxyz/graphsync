/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const exec = require('@actions/exec');

const commitFromTrackerObject = async (trackerObject, sourceUsername, authorName, authorEmail, offsetHHMM) => {
    /* For each day in trackerObject, call commit() with the date and number of contributions from sourceUsername */
    for (let year in trackerObject) {
        for (let month in trackerObject[year]) {
            for (let day in trackerObject[year][month]) {
                let dateString = year + "-" + month + "-" + day
                let contributionsForTheDay = trackerObject[year][month][day][sourceUsername]
                if (contributionsForTheDay == 0) {
                    continue
                }
                console.log("Committing " + contributionsForTheDay + " contributions for " + year + "-" + month + "-" + day)
                await commit(dateString, contributionsForTheDay, sourceUsername, authorName, authorEmail, offsetHHMM)
            }
        }
    }
}


const commit = async (dateString, contributionsForTheDay, sourceUsername, authorName, authorEmail, offsetHHMM) => {
    let dateFormatted = dateString + " 00:00:01 " + offsetHHMM
    let commitMessage = "Contribution sync from " + sourceUsername
    let options = {
        env: {
            GIT_AUTHOR_DATE: dateFormatted,
            GIT_COMMITTER_DATE: dateFormatted,
            GIT_AUTHOR_NAME: authorName,
            GIT_AUTHOR_EMAIL: authorEmail,
        }
    }

    for (let i = 0; i < contributionsForTheDay; i++) {
        await exec.exec("git", ["-c", "user.name=" + authorName, "-c", "user.email=" + authorEmail, "commit", "-m", commitMessage, "--allow-empty"], options)
    }
}

module.exports = { commitFromTrackerObject };