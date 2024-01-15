const core = require('@actions/core');
const github = require('@actions/github');

try {
    // Load the inputs
    const sourceUsername = core.getInput('source-graph-username');
    const sourceToken = core.getInput('source-graph-token');

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
        .then(data => contributionHistoryWeeks = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"])

    console.log("Contribution history returned:", contributionHistoryWeeks)


    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}