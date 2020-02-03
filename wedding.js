var http = require("http");

http.createServer(function (req, res) {
    if (req.url.contains('cleveland')) {
        res.writeHead(301, {"Location": "https://docs.google.com/forms/d/e/1FAIpQLSeu9P5tKF0P4L8pBYb7q7U8AZbnUEcRE9-AxguHhqYOr4aKGA/viewform"});
    } else if (req.url.contains('pismo')) {
        res.writeHead(301, {"Location": "https://docs.google.com/forms/d/e/1FAIpQLSebCW_2RHvcyNVxR8vi0FNqsnzfng6_uHGD3f8OgjUNun7oSg/viewform"});
    } else {
        res.writeHead(301, {"Location": "https://withjoy.com/10ten20twenty"});
    }
    res.end();
}).listen(2020);