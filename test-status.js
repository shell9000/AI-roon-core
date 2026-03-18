// 測試 status API
var http = require('http');

http.get('http://192.168.0.22:9876/api/status', function(res) {
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
        var json = JSON.parse(data);
        console.log("狀態:", json.state);
        console.log("歌曲:", json.now_playing ? json.now_playing.line1 : '無');
        console.log("封面 URL:", json.image_url || '無');
    });
});
