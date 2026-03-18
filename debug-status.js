var RoonApi = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");

let current_zone_data = null;

var roon = new RoonApi({
    extension_id: 'com.test.debug',
    display_name: "Debug",
    display_version: "1.0.0",
    publisher: 'Test',
    email: 'test@test.com',
    
    core_paired: function(core) {
        console.log("✅ 連接");
        core.services.RoonApiTransport.subscribe_zones(function(cmd, data) {
            if (cmd === "Subscribed" && data.zones && data.zones.length > 0) {
             current_zone_data = data.zones[0];
           console.log("\n=== Zone Data ===");
                console.log("now_playing:", !!current_zone_data.now_playing);
             console.log("image_key:", current_zone_data.now_playing ? current_zone_data.now_playing.image_key : "無");
                
                // 測試返回 JSON
                var result = {
         state: current_zone_data.state,
          now_playing: current_zone_data.now_playing ? current_zone_data.now_playing.three_line : null,
                    image_key: current_zone_data.now_playing ? current_zone_data.now_playing.image_key : null
            };
        console.log("\n=== API 會返回 ===");
                console.log(JSON.stringify(result, null, 2));
             
                process.exit(0);
            }
        });
    },
    
    core_unpaired: function(core) {}
});

roon.init_services({
    required_services: [ RoonApiTransport ]
});

console.log("🔍 連接中...\n");
roon.start_discovery();
