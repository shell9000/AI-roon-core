var RoonApi = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");
var readline = require('readline');

console.log("🎵 Roon 控制器");
console.log("=========\n");

let transport = null;
let zone_id = null;

var roon = new RoonApi({
    extension_id: 'com.test.roon.control',
    display_name: "Roon 控制器",
    display_version: "1.0.0",
    publisher: 'Test',
    email: 'test@test.com',
    
    core_paired: function(core) {
        console.log("✅ 成功連接到 Roon Core:", core.display_name);
        
        transport = core.services.RoonApiTransport;
        
        // 訂閱 zones
        transport.subscribe_zones(function(cmd, data) {
      if (cmd === "Subscribed") {
                console.log("\n📍 可用的 Zones:");
            if (data.zones && data.zones.length > 0) {
                    data.zones.forEach(function(zone, index) {
                     console.log("   " + (index + 1) + ". " + zone.display_name + " (" + zone.state + ")");
              if (zone.now_playing) {
                     console.log("      播放中: " + zone.now_playing.three_line.line1);
                    }
                    });
                    
                  // 自動選擇第一個 zone
                    zone_id = data.zones[0].zone_id;
                  console.log("\n✅ 已選擇 Zone: " + data.zones[0].display_name);
                    showMenu();
                }
            } else if (cmd === "Changed") {
             if (data.zones_changed) {
             data.zones_changed.forEach(function(zone) {
             if (zone.zone_id === zone_id && zone.now_playing) {
                  console.log("\n🎵 " + zone.now_playing.three_line.line1);
                }
              });
        }
        }
        });
    },
    
    core_unpaired: function(core) {
        console.log("❌ 與 Roon Core 斷開連接");
        transport = null;
        zone_id = null;
    }
});

roon.init_services({
    required_services: [ RoonApiTransport ]
});

function showMenu() {
    console.log("\n==============");
    console.log("控制指令:");
    console.log("  1 - 播放");
    console.log("  2 - 暫停");
    console.log("  3 - 停止");
    console.log("  4 - 上一首");
    console.log("  5 - 下一首");
    console.log("  6 - 音量 +10");
    console.log("  7 - 音量 -10");
    console.log("  q - 退出");
    console.log("============");
}

// 讀取用戶輸入
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', function(input) {
    if (!transport || !zone_id) {
        console.log("❌ 未連接到 Roon");
        return;
    }
    
    switch(input.trim()) {
        case '1':
            console.log("▶️ 播放");
        transport.control(zone_id, 'play');
            break;
        case '2':
            console.log("⏸️ 暫停");
            transport.control(zone_id, 'pause');
            break;
        case '3':
            console.log("⏹️ 停止");
        transport.control(zone_id, 'stop');
            break;
        case '4':
            console.log("⏮️ 上一首");
            transport.control(zone_id, 'previous');
            break;
        case '5':
            console.log("⏭️ 下一首");
            transport.control(zone_id, 'next');
          break;
        case '6':
            console.log("🔊 音量 +10");
            transport.change_volume(zone_id, 'relative', 10);
            break;
      case '7':
       console.log("🔉 音量 -10");
            transport.change_volume(zone_id, 'relative', -10);
            break;
        case 'q':
            console.log("👋 再見");
            process.exit(0);
            break;
        default:
       console.log("❌ 無效指令");
            showMenu();
    }
});

console.log("🔍 開始搜索 Roon Core...\n");
roon.start_discovery();
