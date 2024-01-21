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

module.exports = { fetchContributionHistory };