# Roon HTTP API Server

A lightweight HTTP API server for controlling Roon music player with Web UI and RESTful API.

## Features

- ✅ **Playback Control**: Play, pause, next, previous
- ✅ **Volume Control**: Adjust volume
- ✅ **Status API**: Get current playback status
- ✅ **Music Library Indexing**: Index albums, artists, genres
- ✅ **Search API**: Search albums and artists
- ✅ **Album Art**: Retrieve album cover images
- ✅ **Web UI**: Simple web interface for playback control
- 🚧 **Artist Drill-down**: Work in progress (experimental)

## Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (Web UI)      │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  Node.js Server │
│  (Express API)  │
└────────┬────────┘
         │ Roon API
         ↓
┌─────────────────┐
│   Roon Core     │
│  (Music Server) │
└─────────────────┘
```

## Requirements

- Node.js v20+
- Roon Core (running on local network)
- Roon account with active subscription

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/roon-http-api.git
cd roon-http-api

# Install dependencies
npm install

# Copy config example
cp config.json.example config.json

# Edit config (optional)
nano config.json
```

## Configuration

Edit `config.json`:

```json
{
  "extension_id": "com.vvaudiolab.roon.webui.v2",
  "display_name": "Roon HTTP API",
  "token": null
}
```

The `token` will be automatically generated after first pairing with Roon Core.

## Usage

### Start Server

```bash
node server.js
```

The server will start on `http://localhost:9876`

### Pair with Roon Core

1. Start the server
2. Open Roon app
3. Go to **Settings → Extensions**
4. Find "Roon HTTP API" (or your configured display_name)
5. Click **Enable**

### Web UI

Open browser: `http://localhost:9876/`

Features:
- Current playback status
- Album cover display
- Play/Pause button
- Next/Previous buttons
- Real-time status updates

## API Endpoints

### Playback Control

#### Play/Pause
```bash
curl -X POST http://localhost:9876/api/control \
  -H "Content-Type: application/json" \
  -d '{"action":"play"}'
```

#### Next Track
```bash
curl -X POST http://localhost:9876/api/control \
  -H "Content-Type: application/json" \
  -d '{"action":"next"}'
```

#### Previous Track
```bash
curl -X POST http://localhost:9876/api/control \
  -H "Content-Type: application/json" \
  -d '{"action":"previous"}'
```

### Status

#### Get Playback Status
```bash
curl http://localhost:9876/api/status
```

Response:
```json
{
  "success": true,
  "state": "playing",
  "now_playing": {
    "line1": "Track Title",
    "line2": "Artist Name",
    "line3": "Album Name"
  },
  "image_url": "/api/image/abc123..."
}
```

### Music Library

#### Index Library
```bash
curl -X POST http://localhost:9876/api/index
```

This will index all albums, artists, and genres. Takes 2-5 minutes for large libraries.

Response:
```json
{
  "success": true,
  "stats": {
    "albums": 8822,
    "artists": 4619,
    "genres": 21,
    "indexed_at": "2026-03-18T10:00:00.000Z"
  }
}
```

#### Get Library
```bash
curl http://localhost:9876/api/library
```

#### Search
```bash
curl "http://localhost:9876/api/search?q=Beatles"
```

Response:
```json
{
  "success": true,
  "query": "Beatles",
  "results": {
    "albums": [
      {
        "title": "Abbey Road",
        "subtitle": "The Beatles",
        "image_key": "..."
      }
    ],
    "artists": [
      {
        "title": "The Beatles",
        "subtitle": "69 Albums"
      }
    ]
  }
}
```

### Album Art

#### Get Album Cover
```bash
curl http://localhost:9876/api/image/{image_key} > cover.jpg
```

## Systemd Service (Linux)

Create `/etc/systemd/system/roon-http-api.service`:

```ini
[Unit]
Description=Roon HTTP API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/roon-http-api
ExecStart=/usr/bin/node /opt/roon-http-api/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable roon-http-api
sudo systemctl start roon-http-api
sudo systemctl status roon-http-api
```

## Development

### Project Structure

```
roon-http-api/
├── server.js              # Main server
├── player.html            # Web UI
├── package.json           # Dependencies
├── config.json.example    # Config template
├── README.md              # This file
└── music-library.json     # Indexed library (generated)
```

### Dependencies

- `node-roon-api`: Roon API client
- `node-roon-api-transport`: Playback control
- `node-roon-api-image`: Album art
- `node-roon-api-browse`: Library browsing

## Troubleshooting

### Server won't start
- Check if port 9876 is available
- Verify Node.js version: `node --version` (should be v20+)

### Can't pair with Roon
- Ensure Roon Core is running
- Check network connectivity
- Verify firewall settings

### No playback control
- Check if a zone is selected in Roon
- Verify extension is enabled in Roon Settings

### Library indexing fails
- Large libraries may take time (be patient)
- Check server logs for errors

## Known Issues

- **Artist drill-down**: Currently experimental, may return incorrect data
- **Multi-zone**: Only supports first zone (single zone)
- **Playback queue**: Not yet implemented

## Roadmap

- [ ] Multi-zone support
- [ ] Playback queue management
- [ ] Playlist support
- [ ] Advanced search (filters)
- [ ] Artist drill-down (fix)
- [ ] Volume control API
- [ ] WebSocket for real-time updates

## License

MIT

## Credits

- Built with [Roon API](https://github.com/roonlabs/node-roon-api)
- Developed for VV Audio Lab

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/roon-http-api/issues)
- Email: shell9000@gmail.com
