// express 사용
const express = require('express');
const app = express();
// body-parser 사용
app.use(express.urlencoded({extended: true}));
// ejs 사용
app.set('view engine', 'ejs');

// mongoDB 사용
var db;
const MongoClient = require('mongodb').MongoClient;
const URL = "mongodb+srv://daru0802:pokmn951@cluster0.jap1p.mongodb.net/todoapp?retryWrites=true&w=majority"

MongoClient.connect(URL, function(error, client){
    if(error){
        return console.log(error);
    };

    db = client.db('todoapp');

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


app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html');
});

// 폼에서 /add로 post요청
app.post('/add', function(req, res){
    res.send("전송완료");
    console.log(req.body);
    console.log(req.body.title);
    console.log(req.body.date);
    // DB.counter 내에서 총게시물 개수를 찾는다
    db.collection('counter').findOne({name : '게시물갯수'}, function(error, result){
        console.log(result.totalPost);
        // 총게시물 개수를 변수에 저장한다.
        var totalPost = result.totalPost;
        // DB.post에 새로운 게시물을 저장한다.
        db.collection('post').insertOne({ _id : totalPost + 1,제목 : req.body.title, 날짜 : req.body.date},function(error, result){
            console.log('저장완료');
            // DB.counter의 총게시물 개수를 1 증가시킨다.
            db.collection('counter').updateOne({name : '게시물갯수'},{$inc : {totalPost : 1}},function(error, result){
                if(error){
                    return console.log(error);
                }else{
                    return console.log('게시물증가');
                }
            })
        });
    });
});

// db 콜렉션 내의 모든 정보를 list로 보내기. ejs활용
app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(error, result){
        console.log(result);
        res.render('list.ejs', {posts : result});
    });
})

app.delete('/delete', function(req, res){
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne(req.body, function(error, result){
        console.log('삭제완료');
        res.status(200).send({ message : '성공했습니다' });
    })
})

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(error, result){
        if(result===null){ 
            res.sendFile('error.html')
        }else{
            console.log(result)
            res.render('detail.ejs', {data : result})}
    })
})