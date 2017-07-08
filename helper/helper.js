const request = require('request')
    ;

exports.hitAPI = function (method, url, data = '', headers = '', callback) {
    if (data.employeeRating) {
        delete data.employeeRating;
    }
    if (data.tlname) {
        delete data.tlname;
    }
    var options = {
        method: method,
        url: process.env.API_URL + url,
        headers: headers,
        body: data,
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