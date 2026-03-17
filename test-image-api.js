// 測試圖片 API
var http = require('http');

// 測試 status
http.get('http://192.168.0.22:9876/api/status', function(res) {
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
        var json = JSON.parse(data);
      console.log("image_key:", json.image_key);
        
        if (json.image_key) {
            // 測試圖片
         http.get('http://192.168.0.22:9876/api/image/' + json.image_key, function(res2) {
             console.log("圖片 HTTP 狀態:", res2.statusCode);
                console.log("Content-Type:", res2.headers['content-type']);
            });
        }
    });
});
