const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient;
const URL = "mongodb+srv://daru0802:pokmn951@cluster0.jap1p.mongodb.net/todoapp?retryWrites=true&w=majority"
MongoClient.connect(URL, function(error, client){
    if(error){
        return console.log(error);
    };
    app.listen(8080, function(){
        console.log("listening on 8080");
    });
})

app.get('/pet', function(req, res){
    res.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


app.get('/wirte', function(req, res){
    res.sendFile(__dirname + '/write.html');
});

app.post('/add', function(req, res){
    res.send("전송완료");
    console.log(req.body);
    console.log(req.body.title);
    console.log(req.body.date);
});

