var express = require("express");
var router = express();
var port = process.env.PORT || 3000;

var mongo = require('mongodb').MongoClient;
var db = undefined;

var Bing = require('node-bing-api')({ accKey: "4bb46049ff674e6d99647a48dc5ad841" });

mongo.connect('mongodb://localhost:27017/local', (err, database) => {
    if(err) throw err;
    db = database;
});

router.get("/api/imagesearch/:searchString", (req,res) => {
    var searchString=req.params.searchString;
    var offset=req.query.offset;
    var date = new Date();
    date = date.toString();
    
    var collection = db.collection('latests');
    collection.insert({term: searchString, when: date});
    
    Bing.images(searchString, {
    top: offset
    }, function(error, body){
        var raw = JSON.parse(body.body);
        var values = [];
        var obj = {};
        for(var i=0; i<raw.value.length; i++) {
            obj.url = convertUrl(raw.value[i].contentUrl);
            obj.snippet = raw.value[i].name;
            obj.thumbnail = raw.value[i].thumbnailUrl;
            obj.context = convertUrl(raw.value[i].hostPageUrl);
            values.push(obj);
            obj = {};
        }
    res.send(values);
  });
});

router.get("/api/latest/imagesearch", (req,res) => {
    var collection = db.collection('latests');
    
    collection.find({},{_id: 0}).toArray((err,data) => {
            if (err) { 
                console.log(err); 
                return;
            }
    
            res.send(data);
    }); 
});

router.listen(port, () => {
    console.log("Server listening at port "+port);
})

function convertUrl(rawUrl) {
    var url = rawUrl.substring(rawUrl.search("&r=")+3,rawUrl.search("&p="));
    url = url.replace("%3a",":");
    url = url.replace(/%2f/g,"/");
    url = url.replace(/%3f/g,"?");
    url = url.replace(/%3d/g,"=");
    return url;
}