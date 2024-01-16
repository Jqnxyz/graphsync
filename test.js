
const sourceUsername = "jerome-wego";
const sourceToken = "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";

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
    .then(data => console.log("data returned:", data["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]))