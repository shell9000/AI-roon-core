var RoonApi = require("node-roon-api");
var RoonApiBrowse = require("node-roon-api-browse");
var fs = require("fs");

console.log("🎵 Roon 音樂庫索引工具 v2");
console.log("========================\n");

let browse = null;
let music_library = {
    albums: [],
    artists: [],
    genres: [],
    indexed_at: new Date().toISOString(),
    stats: {}
};

var roon = new RoonApi({
    extension_id: 'com.aimusicbox.indexer',
    display_name: "Music Library Indexer",
    display_version: "2.0.0",
    publisher: 'AI Music Box',
    email: 'support@aimusicbox.com',
    
    core_paired: function(core) {
        console.log("✅ 連接到 Roon Core:", core.display_name);
        browse = core.services.RoonApiBrowse;
        
      setTimeout(function() {
            console.log("\n🔍 開始索引音樂庫...\n");
            indexLibrary();
        }, 2000);
    },
    
    core_unpaired: function(core) {
        console.log("❌ 斷開連接");
    }
});

roon.init_services({
    required_services: [ RoonApiBrowse ]
});
function indexLibrary() {
    console.log("📚 索引專輯...");
    loadItems('albums', 0, function() {
        console.log("✅ 專輯索引完成:", music_library.albums.length, "張\n");
        
      console.log("🎤 索引藝術家...");
        loadItems('artists', 0, function() {
            console.log("✅ 藝術家索引完成:", music_library.artists.length, "位\n");
            
       console.log("🎼 索引類型...");
            loadItems('genres', 0, function() {
             console.log("✅ 類型索引完成:", music_library.genres.length, "個\n");
                saveIndex();
            });
      });
    });
}

function loadItems(hierarchy, offset, callback) {
    var opts = {
        hierarchy: hierarchy,
        offset: offset,
        set_display_offset: offset
    };
    
    browse.load(opts, function(err, result) {
        if (err) {
            console.error("❌ 錯誤:", err);
       callback();
            return;
        }
        
        if (!result || !result.items || result.items.length === 0) {
            callback();
       return;
     }
        
        var items = result.items;
        console.log("  載入", items.length, "項 (offset:", offset + ")");
     
        items.forEach(function(item) {
            if (hierarchy === 'albums') {
                music_library.albums.push({
           title: item.title,
                    subtitle: item.subtitle,
             image_key: item.image_key
                });
        } else if (hierarchy === 'artists') {
              music_library.artists.push({
          title: item.title,
              subtitle: item.subtitle,
                    image_key: item.image_key
                });
         } else if (hierarchy === 'genres') {
                music_library.genres.push({
       title: item.title
                });
            }
        });
        
        // 繼續載入下一頁
        if (result.list && result.list.count > offset + items.length) {
            loadItems(hierarchy, offset + items.length, callback);
        } else {
      callback();
        }
    });
}

function saveIndex() {
    var filename = 'music-library-index.json';
    
    music_library.stats = {
        albums: music_library.albums.length,
        artists: music_library.artists.length,
        genres: music_library.genres.length
    };
    
    console.log("💾 保存索引到", filename);
    fs.writeFileSync(filename, JSON.stringify(music_library, null, 2));
    
    console.log("\n✅ 索引完成！");
    console.log("==============");
    console.log("專輯:", music_library.albums.length, "張");
    console.log("藝術家:", music_library.artists.length, "位");
    console.log("類型:", music_library.genres.length, "個");
    console.log("文件:", filename);
    console.log("大小:", (fs.statSync(filename).size / 1024 / 1024).toFixed(2), "MB");
    
    process.exit(0);
}

console.log("🔍 開始搜索 Roon Core...\n");
roon.start_discovery();

setTimeout(function() {
    console.log("\n⏱️ 超時，退出");
    process.exit(1);
}, 600000);
