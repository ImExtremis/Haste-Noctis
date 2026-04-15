# Noctis Desktop

Electron desktop client for Noctis. Wraps the web application with native platform integrations including notifications, global shortcuts, screen sharing, passkeys, and auto-updates.

## Configuration

The desktop client reads an optional `settings.json` file from the user data directory on startup. If the file does not exist, defaults are used.

### User data directory locations

| Platform | Stable                                               | Canary                                                     |
| -------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Windows  | `%APPDATA%\noctis\settings.json`                     | `%APPDATA%\noctiscanary\settings.json`                     |
| macOS    | `~/Library/Application Support/noctis/settings.json` | `~/Library/Application Support/noctiscanary/settings.json` |
| Linux    | `~/.config/noctis/settings.json`                     | `~/.config/noctiscanary/settings.json`                     |

### Available options

| Key       | Type   | Default (Stable)         | Default (Canary)                | Description                         |
| --------- | ------ | ------------------------ | ------------------------------- | ----------------------------------- |
| `app_url` | string | `https://web.noctis.app` | `https://web.canary.noctis.app` | URL of the web application to load. |

### Example

```json
{
  "app_url": "https://my-instance.example.com"
}
```

When `app_url` is set, the desktop client loads that URL instead of the default and treats its origin as trusted for permissions, navigation, and the local RPC server.
