# GraphSync
![GitHub Tag](https://img.shields.io/github/v/tag/Jqnxyz/graphsync?label=Latest%20version)
![GitHub License](https://img.shields.io/github/license/Jqnxyz/graphsync)

Synchronise a GitHub account's contribution graph into your own.


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
  * Your GitHub PAT should be created with `read:user` scope only. Create a new PAT [here](https://github.com/settings/tokens/new).

## Template
You can use the `graphsync-template` repository to easily set up a repository with the required workflow. Make sure to update the `action.yml` file with your own parameters, and to use the latest version of this action.

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github)](https://github.com/Jqnxyz/graphsync-template/generate)

## Usage
This action is meant to run in a dedicated empty repository. You should create a private repository in order to hide the source of the generated commits, and enable displaying private repository commits on your contribution graph.

When the action runs, empty commits will have been created, and the tracker file will be created but not committed. Both are not pushed yet either.
You **must** use another action to commit the changed tracker file, and push all changes to the repo. I recommend `stefanzweifel/git-auto-commit-action@v5`
(just use the template repo, really.)
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
        uses: Jqnxyz/graphsync@v1.2.0
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
