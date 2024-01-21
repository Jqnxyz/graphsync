# GraphSync
Synchronise a GitHub account's contribution graph into your own. (Additive, not replacement)

## Inputs
| Parameter               | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `source-graph-username` | Username of the source graph                                 |
| `source-graph-token`    | GitHub PAT for the source username                           |
| `offset-hhmm`           | Timezone offset in +/-HHMM format (eg. "+0830" for UTC+8:30) |
| `git-author-name`       | Name of the git author (for the generated commits)           |
| `git-author-email`      | Email of the git author (for the generated commits)          |

### Notes
* `git-author-*` parameters must be of the destination contribution graph user.
* `source-graph-token` should be stored in your repository's Actions's Secrets and accessed via `${{ secrets.SECRET_NAME }}`

## Usage
After the action runs, fake commits will have been created, and the tracker file will be created but not committed. Both are not pushed yet either.
You **must** use another action to commit the changed tracker file, and push all changes to the repo. I recommend `stefanzweifel/git-auto-commit-action@v5`

> [!IMPORTANT]  
> You must enable *write* permissions for Actions in your GitHub repository settings in order to commit the changes.

> [!TIP]
> To remove all the fake commits from your contribution graph, delete the repository you created. The graph will update within a couple days. Probably.


A full `action.yml` implementation might look like such:
```yaml
on: 
  # Use a cronjob to automate the synchronisation.
  schedule:
    - cron:  '39 0 * * *'
    # And/or use a push trigger for testing your implementation
  push:
    branches:
      - main

jobs:
  graphsync_job:
    runs-on: ubuntu-latest
    name: Sync Graph Data
    steps:
      # Checkout the git repository
      - name: Checkout
        uses: actions/checkout@v4
      # Run this action
      - name: GraphSync
        uses: Jqnxyz/graphsync@v1.1.0
        with:
          source-graph-username: 'Jqnxyz'
          source-graph-token: ${{ secrets.GRAPHSYNC_TOKEN }}
          offset-hhmm: "+0800"
          git-author-name: "Zen"
          git-author-email: "real@email.here"
      # At this point, fake commits would have been made to the git repo, and the updated tracking files needs to be committed separately
      - name: Commit and push all changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Graph data updated by GraphSync"
          commit_user_name: "Zen Quah"
          commit_author: "Zen Quah Bot <bot@zenquah.dev>" # Use a different author than the owner to avoid contributing to the owner's commit count
```
## Licensing
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
