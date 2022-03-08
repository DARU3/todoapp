// express 사용 - node.js의 핵심 라이브러리!
const express = require('express');
const res = require('express/lib/response');
const app = express();
// body-parser 사용 - req에서 body값을 읽을 수 있는 라이브러리
app.use(express.urlencoded({ extended: true }));
// method-override 사용 - app.put, app.delete를 사용가능하게 해주는 라이브러리
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// ejs 사용
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

// socket.io 사용 문법
const http = require('http').createServer(app);
const { Server, Socket } = require("socket.io");
const io = new Server(http);

// bcrypt - 암호화 라이브러리
const bcrypt = require('bcrypt');
// 암호화 설정
const saltRounds = 10;

// dotenv 사용 - 환경변수 제어 라이브러리
require('dotenv').config();

// multer - 파일 업로드 쉽게 해주는 라이브러리
let multer = require('multer');
var storage = multer.diskStorage({
    // 저장위치 설정
    destination : function(req, file, cb){
        cb(null, './public/image')
    },
    // 저장이름 설정
    // 이름을 원하는대로 정의하고싶으면 file.originalname에 원하는 문자 더하기
    filename : function(req, file, cb){
        cb(null, file.originalname)
    },
    // 파일 확장자 필터
    filefilter : function(req, file, cb){
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf') {
            return callback(new Error('PNG, JPG, PDF만 업로드하세요'))
        }
        callback(null, true)
    },
    // 파일사이즈 제한
    limits : function(req, file, cb){
        fileSize: 1024 * 1024
    }
});
var upload = multer({storage : storage});

// mongoDB 사용
var db;
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(process.env.DB_URL, function (error, client) {
    if (error) {
        return console.log(error);
    }

    db = client.db('todoapp');

    http.listen(process.env.PORT, function () {
        console.log('listening on 8080');
    });
});

// ObjectId 함수 사용하기
const {ObjectId} = require('mongodb');

// app.use = 전역 미들웨어 명령어
// 별개의 라우터로 저장해놓은 라우트들 불러오기
app.use('/shop', require('./routes/routes'));

// 홈으로 이동
app.get('/', function (req, res) {
    res.render('index.ejs');
});

// 글쓰기 페이지로 이동
app.get('/write', function (req, res) {
    res.render('write.ejs');
});



// db 콜렉션 내의 모든 정보를 list로 보내기. ejs활용
app.get('/list', function (req, res) {
    db.collection('post')
        .find()
        .toArray(function (error, result) {
            console.log(result);
            res.render('list.ejs', { posts: result });
        });
});



// 상세페이지로 이동
app.get('/detail/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        if (result === null) {
            res.render('error.ejs');
        } else {
            console.log(result);
            res.render('detail.ejs', { data: result });
        }
    });
});



// passport 사용 코드
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const { Passport } = require('passport');
const req = require('express/lib/request');

// passport 미들웨어
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// 에러페이지 이동
app.get('/fail', function (req, res) {
    res.render('error.ejs');
});

// 로그인페이지 이동
app.get('/login', function (req, res) {
    res.render('login.ejs');
});

// passport 사용
app.post(
    '/login',
    passport.authenticate('local', {
        failureRedirect: '/fail',
    }),
    function (req, res) {
        res.redirect('/');
    }
);

// passport 과정 코드 (복붙)
passport.use(
    new LocalStrategy(
        {
            usernameField: 'id',
            passwordField: 'pw',
            session: true,
            passReqToCallback: false,
        },
        function (입력한아이디, 입력한비번, done) {
            console.log(입력한아이디, 입력한비번);
            db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
                if (error) return done(error);
                if (!result) return done(null, false, { message: '아이디가 존재하지 않습니다.' });
                bcrypt.compare(입력한비번, result.pw, function (error, Match) {
                    console.log(입력한비번);
                    console.log(result.pw);
                    if (Match) {
                        return done(null, result);
                    } else {
                        return done(null, false, { message: '비밀번호가 틀렸습니다.' });
                    }
                });
            });
        }
    )
);

// passport 세션 생성
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// 세션데이터를 사용해 db에서 유저 찾기(마이페이지 접속시 발동)
passport.deserializeUser(function (userId, done) {
    // user.id로 디비에서 유저를 찾고 그 유저의 정보를 가지고 올 수 있음
    db.collection('login').findOne({ id: userId }, function (error, result) {
        done(null, { result });
    });
});

// 로그인체크 미들웨어
function loginCheck(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.send('로그인해주세요.');
    }
}

// 미들웨어는 2번째 자리에 삽입
app.get('/mypage', loginCheck, function (req, res) {
    // deserializeUser를 사용하여 마이페이지에 유저 정보를 가져옴
    console.log(req.user.result);
    if (req.user === null) {
        res.render('error.ejs');
    } else {
        res.render('mypage.ejs', { user: req.user.result });
    }
});

// 회원가입 페이지 이동
app.get('/join', function (req, res) {
    res.render('join.ejs');
});

// 회원가입
app.post('/join', function (req, res) {
    db.collection('login').findOne({ id: req.body.id }, function (error, result) {
        if (error) {
            return console.log(error);
        }
        if (result) {
            res.send('아이디가 중복되었습니다.');
        }
        if (!result) {
            bcrypt.hash(req.body.pw, saltRounds, function (err, hash) {
                db.collection('login').insertOne({ id: req.body.id, pw: hash, nickname: req.body.nickname }, function (error, result) {
                    console.log('회원가입 완료');
                    res.redirect('/');
                });
            });
        }
    });
});

// 폼에서 /add로 post요청
// 글 저장 기능
app.post('/add',loginCheck, function (req, res) {
    console.log(req.body);
    console.log(req.body.title);
    console.log(req.body.date);
    // DB.counter 내에서 총게시물 개수를 찾는다
    db.collection('counter').findOne({ name: '게시물갯수' }, function (error, result) {
        console.log(result.totalPost);
        // 총게시물 개수를 변수에 저장한다.
        var totalPost = result.totalPost;
        // DB.post에 새로운 게시물을 저장한다.
        db.collection('post').insertOne({ _id: totalPost + 1, 제목: req.body.title, 날짜: req.body.date, 작성자: req.user.result._id }, function (error, result) {
            console.log('저장완료');
            // DB.counter의 총게시물 개수를 1 증가시킨다.
            db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (error, result) {
                if (error) {
                    return console.log(error);
                } else {
                    return console.log('게시물증가');
                }
            });
        });
    });
    res.redirect('/');
});

// 삭제 기능
app.delete('/delete', function (req, res) {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne({ _id : req.body._id, 작성자 : req.user.result._id_}, function (error, result) {
        console.log('삭제완료');
        if (error){console.log(error)};
        res.status(200).send({ message: '성공했습니다' });
    });
});

// 글 수정 페이지로 이동
app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id), 작성자 : req.user.result._id }, function (error, result) {
        if (result === null) {
            res.render('error.ejs');
        } else {
            console.log(result);
            res.render('edit.ejs', { data: result });
        }
    });
});

// 글수정 기능
app.put('/edit', function (req, res) {
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title, 날짜: req.body.date } }, function (error, result) {
        if (result === null) {
            res.render('error.ejs');
        } else {
            console.log('수정완료');
            res.redirect('/list');
        }
    });
});

// 검색 기능 구현
app.get('/search', (req, res) => {
    // req.query -> 쿼리스트링을 담고 있음
    console.log(req.query.value);
    // /abc/ -> 정규식, abc가 포함된 모든 것을 찾음
    // text index를 통한 검색 기능 구현 문법
    // 빠른검색, or검색, 검색단어가 포함된 것 모두 검색, -제외검색, 정확히 일치하는 것만 검색 가능(""사용)
    // 문제점 : 띄어쓰기 기준으로 단어를 저장하기에 문장안의 일부 단어만 검색했을 때 검색 안됨
    // 한국어, 중국어, 일본어에는 어울리지 않음
    // 해결법 1 : text index를 쓰지말고 검색할 문서의 양을 제한하기
    // 해결법 2 : text index 만들 때 설정을 다르게 하기, nGram 등(귀찮음)
    // 해결법 3 : 몽고db 아틀라스에서 제공하는 search index 생성 후 한국어 형태소분석기 적용
    // aggregate() 검색 조건은 길어서 따로 변수로 지정
    var 검색조건 = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: '제목', // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                },
            },
        },
        // sort 옵션도 줄 수 있다. 1 = 오름차순 -1 = 내림차순
        { $sort: { _id: -1 } },
        // limit : 제한주기 ex) 열개만 검색
        { $limit: 10 },
        // project : 검색결과에서 필터 주기(검색결과 더주기)
        { $project: { 제목: 1, _id: 0, score: { $meta: 'searchScore' } } },
    ];
    db.collection('post')
        .aggregate(검색조건)
        .toArray((error, result) => {
            // aggregate() : search index에서 사용, 파이프라인을 통해 검색
            console.log(result);
            res.render('search.ejs', { search: result, searchWord: req.query.value });
        });
});

app.get('/upload', function(req, res){
    res.render('upload.ejs')
})

// upload.single(name) - multer 미들웨어 사용문법
// upload.array(name, 개수) - 여러개 업로드
app.post('/upload', upload.single('프로필'), function(req, res){
    res.send('업로드 완료');
})

app.get('/image/:imageName', function(req, res){
    res.sendFile(__dirname + '/public/image/' + req.params.imageName)
})



app.post('/chat', loginCheck, function(req, res){
    console.log(req.body)
    var 저장할거 = {
        title : '채팅방1',
        member : [ObjectId(req.body.채팅당한사람id), req.user.result._id],
        date : new Date()
    }
    db.collection('chatroom').insertOne(저장할거).then((result)=>{
        res.send('성공')
    })
})

app.get('/chat',loginCheck, function(req, res){
    db.collection('chatroom').find({member : req.user.result._id}).toArray().then((result)=>{
        res.render('chat.ejs', { data : result})
    })
})

app.post('/message',loginCheck,function(req, res){
    var 저장할거 = {
        parent : ObjectId(req.body.parent),
        content : req.body.content,
        userId : req.user.result._id,
        date : new Date(),
    }
    db.collection('message').insertOne(저장할거).then((result)=>{
        res.send(result)
    })
})


// 실시간 요청 채널 열기
app.get('/message/:id', loginCheck, function(req, res){

    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    });

    db.collection('message').find({ parent : ObjectId(req.params)}).toArray().then((result)=>{
        res.write('event: test\n')
        res.write('data: '+ JSON.stringify(result) +'\n\n');
    })

    // db change stream => db에 변경이 생길때마다 바로바로 서버에 전달 = 실시간
    // 서버 -> 유저 일방적 통신
    const 찾을문서 = [
        { $match: { 'fullDocument.parent' : ObjectId(req.params)} }
    ];
    console.log(찾을문서)
    
    const changeStream = db.collection('message').watch(찾을문서);
    console.log(changeStream)
    changeStream.on('change', function (result) {
            res.write('event: test\n');
            res.write('data: ' + JSON.stringify([result.fullDocument]) + '\n\n');
        });
});

app.get('/socket', function(req, res){
    res.render('socket.ejs')
})

io.on('connection', function(socket){
    console.log('유저접속됨');

    // 채팅방 생성 및 유저 참여시킴
    socket.on('joinroom', function(data){
        socket.join('room1');
    });

    // 채팅방1에게만 메세지 보내기
    socket.on('room1-send', function(data){
        io.to('room1').emit('broadcast', data)
    })


    // 유저가 서버로 보낸 메세지 받기
    socket.on('user-send', function(data){
        // 서버가 유저에게 메세지 보내기
        io.emit('broadcast', data)
        // io.to(socket.id).emit('broadcast', data)
        // => 서버가 특정 유저에게만 메세지 보내게 하고 싶을 때
    })
})