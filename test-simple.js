var express = require("express");
var app = express();

var test_data = {
    state: "playing",
    now_playing: {
        line1: "Test Song",
        line2: "Test Artist",
        line3: "Test Album"
    },
    image_url: "http://192.168.0.220:9330/api/image/d7cfea48b7059812aec728e221b1ed58?scale=fit&width=150&height=150"
};

app.get('/api/status', function(req, res) {
    console.log("API called, returning:", test_data);
    res.json(test_data);
});

app.listen(9877, function() {
    console.log('Test server: http://192.168.0.22:9877');
});
