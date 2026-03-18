const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiImage = require("node-roon-api-image");
const RoonApiBrowse = require("node-roon-api-browse");
const http = require('http');
const url = require('url');
const fs = require('fs');

console.log("🎵 Roon HTTP API Server v3 (with Browse)");
console.log("===========\n");

let transport = null;
let image_api = null;
let browse_api = null;
let current_zone = null;
let current_state = {
    state: 'stopped',
    now_playing: null,
    image_key: null
};

let music_library = {
    albums: [],
    artists: [],
    genres: [],
    artists_detailed: [],
    indexed_at: null,
    indexing: false
};

const roon = new RoonApi({
    extension_id: 'com.vvaudiolab.roon.webui.v2',
    display_name: "AI-roon-core",
    display_version: "1.0.0",
    publisher: 'VV Audio Lab',
    email: 'shell9000@gmail.com',
    
    core_paired: function(core) {
        console.log("✅ 已連接到 Roon Core:", core.display_name);
        
     transport = core.services.RoonApiTransport;
        image_api = core.services.RoonApiImage;
     browse_api = core.services.RoonApiBrowse;
        
        transport.subscribe_zones(function(cmd, data) {
            if (cmd === "Subscribed") {
                if (data.zones && data.zones.length > 0) {
                    current_zone = data.zones[0];
                    updateState(current_zone);
                }
            } else if (cmd === "Changed") {
                if (data.zones_changed) {
           data.zones_changed.forEach(zone => {
             if (!current_zone || zone.zone_id === current_zone.zone_id) {
          current_zone = zone;
                       updateState(zone);
                 }
         });
              }
            }
      });
        
        console.log("✅ Browse API 已就緒");
    },
    
    core_unpaired: function(core) {
        console.log("❌ 已斷開 Roon Core");
        transport = null;
        image_api = null;
        browse_api = null;
    }
});

roon.init_services({
    required_services: [ RoonApiTransport, RoonApiImage, RoonApiBrowse ]
});

function updateState(zone) {
    if (!zone) return;
    current_state.state = zone.state || 'stopped';
    current_state.now_playing = zone.now_playing || null;
    current_state.image_key = zone.now_playing ? zone.now_playing.image_key : null;
}

function indexArtistsWithAlbums(limit, callback) {
    if (!browse_api) {
        callback(new Error("Browse API not available"));
        return;
    }
    
    if (music_library.indexing) {
        callback(new Error("Indexing already in progress"));
        return;
    }
    
    music_library.indexing = true;
    music_library.artists_detailed = [];
    
    console.log(`\n🔍 開始 drill down 索引 ${limit} 位藝術家...`);
    
    // 第零步：重置 browse session
    browse_api.browse({hierarchy: 'artists', pop_all: true}, function(err0) {
        if (err0) {
          console.log("⚠️  重置 session 失敗，繼續嘗試...");
        }
        
        // 第一步：load artists list
        browse_api.load({hierarchy: 'artists', offset: 0}, function(err, result) {
            if (err || !result || !result.items) {
           music_library.indexing = false;
             callback(new Error("Failed to load artists"));
                return;
            }
            
            const artists = result.items.slice(0, limit);
            let processed = 0;
        
         console.log(`✅ 載入 ${artists.length} 位藝術家`);
            
            // Drill down 每位 artist
            artists.forEach((artist, index) => {
                setTimeout(() => {
                    const sessionKey = `artist_${index}_${Date.now()}`;
             
                    // 第二步：用 browse() drill down 入去 artist
                browse_api.browse({
             hierarchy: 'artists',
            item_key: artist.item_key,
          multi_session_key: sessionKey
             }, function(err2, browseResult) {
                  if (err2 || !browseResult) {
                     console.log(`  ❌ ${artist.title} - browse 失敗:`, err2);
        processed++;
                    checkComplete();
                    return;
              }
                    
                 // 第三步：用 load() 拎 albums
                        browse_api.load({
                    hierarchy: 'artists',
                multi_session_key: sessionKey,
                      offset: 0
                }, function(err3, loadResult) {
              if (err3 || !loadResult) {
                 console.log(`  ❌ ${artist.title} - load 失敗:`, err3);
                processed++;
                    checkComplete();
                    return;
                  }
                          
                  const artistData = {
                      title: artist.title,
                    subtitle: artist.subtitle,
                     image_key: artist.image_key,
                   item_key: artist.item_key,
             albums: (loadResult.items || []).filter(item => item.hint === "list")
         };
                        
                  music_library.artists_detailed.push(artistData);
                       console.log(`  ✅ ${artist.title} - ${artistData.albums.length} 張專輯`);
                  
                          processed++;
                   checkComplete();
                });
                    });
                }, index * 300);
     });
            
        function checkComplete() {
                if (processed === artists.length) {
            music_library.indexed_at = new Date().toISOString();
            music_library.indexing = false;
                    
         fs.writeFileSync('/opt/roon-web-ui/artists-detailed.json',
           JSON.stringify(music_library.artists_detailed, null, 2));
                    
              console.log(`\n💾 已保存 ${music_library.artists_detailed.length} 位藝術家詳細資料`);
                    callback(null, music_library.artists_detailed);
             }
            }
      });
    });
}

function indexLibrary(callback) {
    if (!browse_api) {
        callback(new Error("Browse API not available"));
        return;
    }
    
    if (music_library.indexing) {
      callback(new Error("Indexing already in progress"));
        return;
  }
    
    music_library.indexing = true;
    music_library.albums = [];
    music_library.artists = [];
    music_library.genres = [];
    
    console.log("\n🔍 開始索引音樂庫...");
    
    loadItems('albums', 0, function() {
        console.log("✅ 專輯:", music_library.albums.length);
      
     loadItems('artists', 0, function() {
       console.log("✅ 藝術家:", music_library.artists.length);
            
            loadItems('genres', 0, function() {
            console.log("✅ 類型:", music_library.genres.length);
           
                music_library.indexed_at = new Date().toISOString();
                music_library.indexing = false;
                
        fs.writeFileSync('/opt/roon-web-ui/music-library.json', 
                    JSON.stringify(music_library, null, 2));
                
                console.log("💾 已保存到 music-library.json\n");
                callback(null, music_library);
            });
        });
    });
}

function loadItems(hierarchy, offset, callback) {
    const opts = {
        hierarchy: hierarchy,
        offset: offset
    };
    
    browse_api.load(opts, function(err, result) {
        if (err) {
            console.error("❌ Load 錯誤:", err);
            callback();
            return;
        }
    
        if (!result || !result.items || result.items.length === 0) {
            callback();
            return;
        }
        
        const items = result.items;
        console.log(`  載入 ${items.length} 項 (offset: ${offset})`);
        items.forEach(function(item) {
            const data = {
           title: item.title,
              subtitle: item.subtitle,
                image_key: item.image_key
          };
            
     if (hierarchy === 'albums') {
              music_library.albums.push(data);
          } else if (hierarchy === 'artists') {
                music_library.artists.push(data);
            } else if (hierarchy === 'genres') {
                music_library.genres.push(data);
       }
        });
        
        if (result.list && result.list.count > offset + items.length) {
            setTimeout(() => {
                loadItems(hierarchy, offset + items.length, callback);
            }, 100);
        } else {
            callback();
        }
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (pathname === '/api/index' && req.method === 'POST') {
        const limit = parsedUrl.query.limit ? parseInt(parsedUrl.query.limit) : null;
        
        if (limit) {
            // Drill down indexing
            indexArtistsWithAlbums(limit, function(err, data) {
                if (err) {
             res.writeHead(500, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({success: false, error: err.message}));
          } else {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({
                success: true,
                 type: "drill_down",
                stats: {
              artists: data.length,
          indexed_at: music_library.indexed_at
         }
               }));
          }
            });
      return;
        }
        
        // Normal indexing
        indexLibrary(function(err, data) {
            if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({success: false, error: err.message}));
            } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
          success: true,
            stats: {
                     albums: data.albums.length,
                artists: data.artists.length,
             genres: data.genres.length,
                 indexed_at: data.indexed_at
             }
        }));
         }
        });
        return;
    }
    
    if (pathname === '/api/library') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          success: true,
       library: music_library
        }));
        return;
    }
    
    if (pathname === '/api/search') {
        const query = parsedUrl.query.q || '';
        const results = {
            albums: music_library.albums.filter(a => 
              a.title.toLowerCase().includes(query.toLowerCase()) ||
                (a.subtitle && a.subtitle.toLowerCase().includes(query.toLowerCase()))
            ).slice(0, 20),
            artists: music_library.artists.filter(a => 
                a.title.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 20)
        };
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({success: true, query: query, results: results}));
        return;
    }
    
    if (pathname === '/api/status') {
        const response = {
            success: true,
            state: current_state.state,
            now_playing: current_state.now_playing,
            image_url: current_state.image_key ? `/api/image/${current_state.image_key}` : null
    };
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
    return;
    }
    
    if (pathname === '/api/control' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
        try {
         const data = JSON.parse(body);
                const action = data.action;
                
                if (!transport || !current_zone) {
                  res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: false, error: 'No zone'}));
                return;
                }
                
         if (action === 'play' || action === 'pause') {
             transport.control(current_zone, 'playpause');
                } else if (action === 'next') {
             transport.control(current_zone, 'next');
                } else if (action === 'previous') {
                    transport.control(current_zone, 'previous');
          }
            
            res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({success: true}));
            } catch (e) {
              res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, error: e.message}));
            }
        });
        return;
    }
    
    if (pathname.startsWith('/api/image/')) {
        const image_key = pathname.substring(11);
      
        if (!image_api || !image_key) {
            res.writeHead(404);
            res.end();
          return;
        }
        
        image_api.get_image(image_key, {scale: 'fit', width: 500, height: 500}, function(err, content_type, image) {
            if (err) {
                res.writeHead(404);
                res.end();
            } else {
      res.writeHead(200, {'Content-Type': content_type});
              res.end(image);
            }
        });
      return;
    }
    
    if (pathname === '/' || pathname === '/index.html') {
        fs.readFile('/opt/roon-web-ui/player.html', (err, data) => {
     if (err) {
                res.writeHead(404);
             res.end('Not found');
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data);
            }
        });
        return;
    }
    
    res.writeHead(404);
    res.end('Not found');
});

server.listen(9876, '0.0.0.0', () => {
    console.log("🌐 HTTP Server: http://192.168.0.220:9876");
    console.log("  - Web UI: http://192.168.0.220:9876/");
    console.log("  - API Status: http://192.168.0.220:9876/api/status");
    console.log("  - API Index: POST http://192.168.0.220:9876/api/index");
    console.log("  - API Library: http://192.168.0.220:9876/api/library");
    console.log("  - API Search: http://192.168.0.220:9876/api/search?q=xxx\n");
});

roon.start_discovery();
