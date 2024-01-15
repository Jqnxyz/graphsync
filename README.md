# GraphSync

Synchronise a GitHub account's contribution graph into your own. (Additive, not replacement)

## Inputs

### `source-graph-username`

**Required** The username of the person whose contribution graph you'd like replicated on your account.

## Outputs

### `message`

Success or failure message.

## Example usage

```yaml
uses: actions/graphsync@latest
with:
  source-graph-username: 'Jqnxyz'
```
