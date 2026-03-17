var RoonApi = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiBrowse = require("node-roon-api-browse");
var express = require("express");

console.log("🎵 AI Music Box - Roon Controller");
console.log("=============\n");

let transport = null;
let browse = null;
let zone_id = null;
let roon_core = null;
let current_zone_data = null;

var roon = new RoonApi({
    extension_id: 'com.aimusicbox.roon.v1',
    display_name: "AI Music Box",
    display_version: "1.0.0",
    publisher: 'AI Music Box',
    email: 'support@aimusicbox.com',
    
    core_paired: function(core) {
        console.log("✅ 連接到 Roon Core:", core.display_name);
        roon_core = core;
        transport = core.services.RoonApiTransport;
        browse = core.services.RoonApiBrowse;
        
        transport.subscribe_zones(function(cmd, data) {
            if (cmd === "Subscribed" && data.zones && data.zones.length > 0) {
                zone_id = data.zones[0].zone_id;
                current_zone_data = data.zones[0];
            console.log("✅ Zone:", data.zones[0].display_name);
        } else if (cmd === "Changed" && data.zones_changed) {
                data.zones_changed.forEach(function(zone) {
                    if (zone.zone_id === zone_id) {
               current_zone_data = zone;
             }
                });
            }
        });
    },
    
    core_unpaired: function(core) {
        console.log("❌ 斷開連接");
    }
});

roon.init_services({
    required_services: [ RoonApiTransport, RoonApiBrowse ]
});

var app = express();
app.use(express.json());

// 首頁
app.get('/', function(req, res) {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Music Box - Roon Controller</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; color: #4CAF50; }
        .status { background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .controls { text-align: center; margin: 20px 0; }
        .controls button { padding: 15px 30px; margin: 5px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .controls button:hover { background: #45a049; }
        .search { margin: 20px 0; }
        .search input { padding: 10px; width: 70%; font-size: 16px; border: none; border-radius: 4px; }
        .search button { padding: 10px 20px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        #now-playing { font-size: 18px; font-weight: bold; }
        #state { color: #4CAF50; font-size: 14px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 AI Music Box</h1>
        
        <div class="status">
            <h3>當前播放</h3>
            <div id="now-playing">載入中...</div>
      <div id="state"></div>
        </div>
        
        <div class="controls">
            <button onclick="control('previous')">⏮️ 上一首</button>
            <button onclick="control('play')">▶️ 播放</button>
            <button onclick="control('pause')">⏸️ 暫停</button>
            <button onclick="control('next')">⏭️ 下一首</button>
        </div>
        
        <div class="controls">
      <button onclick="control('volume_down')">🔉 音量 -</button>
            <button onclick="control('volume_up')">🔊 音量 +</button>
        </div>
        
     <div class="search">
         <input type="text" id="search-input" placeholder="搜索音樂（例如：Miles Davis）" />
            <button onclick="search()">🔍 搜索</button>
        </div>
        
        <div id="results"></div>
    </div>
    
    <script>
        function control(action) {
          fetch('/api/control', {
                method: 'POST',
            headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: action})
            }).then(() => {
                setTimeout(updateStatus, 500);
            });
        }
        
        function search() {
            const query = document.getElementById('search-input').value;
            if (!query) return;
            
            document.getElementById('results').innerHTML = '<p>搜索中...</p>';
            
            fetch('/api/search?q=' + encodeURIComponent(query))
                .then(r => r.json())
           .then(data => {
                let html = '<h3>搜索結果：</h3>';
                    if (data.items && data.items.length > 0) {
                 html += '<ul>';
                        data.items.forEach(item => {
                     html += '<li>' + item.title;
                 if (item.subtitle) html += ' - ' + item.subtitle;
                          html += '</li>';
              });
                   html += '</ul>';
                    } else {
                        html += '<p>搵唔到結果</p>';
                }
            document.getElementById('results').innerHTML = html;
                });
        }
        
        function updateStatus() {
        fetch('/api/status')
         .then(r => r.json())
              .then(data => {
               if (data.now_playing) {
               document.getElementById('now-playing').innerHTML = 
                        '🎵 ' + data.now_playing.line1 + '<br>' +
         '<small>' + (data.now_playing.line2 || '') + '</small>';
          document.getElementById('state').textContent = 
                            '狀態: ' + data.state;
                    } else {
             document.getElementById('now-playing').textContent = '未播放';
            document.getElementById('state').textContent = '';
                    }
              })
                .catch(err => {
         console.error('更新狀態失敗:', err);
              });
        }
        
        setInterval(updateStatus, 2000);
        updateStatus();
    </script>
</body>
</html>
    `);
});

// API: 控制
app.post('/api/control', function(req, res) {
    if (!transport || !zone_id) {
        return res.json({error: 'Not connected'});
    }
    
    var action = req.body.action;
    
    if (action === 'volume_up') {
        transport.change_volume(zone_id, 'relative', 5);
    } else if (action === 'volume_down') {
        transport.change_volume(zone_id, 'relative', -5);
    } else {
        transport.control(zone_id, action);
    }
    
    res.json({success: true});
});

// API: 狀態
app.get('/api/status', function(req, res) {
    console.log("=== /api/status called ===");
    if (!current_zone_data) {
        return res.json({error: 'Not connected', now_playing: null});
    }
    
    var image_url = null;
    if (current_zone_data.now_playing && current_zone_data.now_playing.image_key) {
        image_url = 'http://192.168.0.220:9330/api/image/' + 
                  current_zone_data.now_playing.image_key + 
                    '?scale=fit&width=150&height=150';
    }
    
    res.json({
        state: current_zone_data.state,
        now_playing: current_zone_data.now_playing ? current_zone_data.now_playing.three_line : null,
        image_url: image_url
    });
});

// API: 搜索
app.get('/api/search', function(req, res) {
    if (!browse) {
        return res.json({error: 'Not connected'});
    }
    
    var query = req.query.q;
    
    browse.load({
        hierarchy: 'search',
        input: query
    }, function(err, result) {
        if (err) return res.json({error: err, items: []});
     res.json({items: result.items || []});
    });
});

app.listen(9876, function() {
    console.log('✅ Web UI: http://192.168.0.22:9876');
});

console.log("🔍 開始搜索 Roon Core...\n");
roon.start_discovery();
