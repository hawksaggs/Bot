const request = require('request')
    ;

exports.hitAPI = function (method,url,data,headers,callback) {
    var options = {
        method: method,
        url: process.env.API_URL + url,
        headers: headers,
        body: { 'rating': data },
        json:true
    };
    console.log(options);
    request(options, function (err, response, body) {
        if (err) {
            return callback(err);
        }
        console.log(body);
        // body = JSON.parse(body);
        callback(null, body);
    });
}