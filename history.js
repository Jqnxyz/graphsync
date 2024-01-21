/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const fetchContributionHistory = async (sourceUsername, sourceToken) => {
    const githubGraphQLEndpoint = "https://api.github.com/graphql";
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

    try {
        const response = await fetch(githubGraphQLEndpoint, {
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
        });

        const data = await response.json();
        return data["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"];
    } catch (error) {
        console.error("Error fetching contribution history:", error);
        throw error; // rethrow the error for further handling
    }
};


const formatAPIContributionHistory = (contributionHistoryWeeks, sourceUsername, mostRecentDate) => {
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
    return trackerFormattedFromAPI
}


module.exports = { fetchContributionHistory, formatAPIContributionHistory };