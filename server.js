// express 사용
const express = require('express');
const res = require('express/lib/response');
const app = express();
// body-parser 사용
app.use(express.urlencoded({ extended: true }));
// method-override 사용
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// ejs 사용
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

// mongoDB 사용
var db;
const MongoClient = require('mongodb').MongoClient;
const URL = 'mongodb+srv://daru0802:pokmn951@cluster0.jap1p.mongodb.net/todoapp?retryWrites=true&w=majority';

MongoClient.connect(URL, function (error, client) {
    if (error) {
        return console.log(error);
    }

    db = client.db('todoapp');

    app.listen(8080, function () {
        console.log('listening on 8080');
    });
});

app.get('/pet', function (req, res) {
    res.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.get('/write', function (req, res) {
    res.render('write.ejs');
});

// 폼에서 /add로 post요청
app.post('/add', function (req, res) {
    res.send('전송완료');
    console.log(req.body);
    console.log(req.body.title);
    console.log(req.body.date);
    // DB.counter 내에서 총게시물 개수를 찾는다
    db.collection('counter').findOne({ name: '게시물갯수' }, function (error, result) {
        console.log(result.totalPost);
        // 총게시물 개수를 변수에 저장한다.
        var totalPost = result.totalPost;
        // DB.post에 새로운 게시물을 저장한다.
        db.collection('post').insertOne({ _id: totalPost + 1, 제목: req.body.title, 날짜: req.body.date }, function (error, result) {
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

app.delete('/delete', function (req, res) {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne(req.body, function (error, result) {
        console.log('삭제완료');
        res.status(200).send({ message: '성공했습니다' });
    });
});

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

app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        if (result === null) {
            res.render('error.ejs');
        } else {
            console.log(result);
            res.render('edit.ejs', { data: result });
        }
    });
});

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

// passport 사용 코드
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const { Passport } = require('passport');

// passport 미들웨어
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/fail', function (req, res) {
    res.render('error.ejs');
});

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
                if (입력한비번 == result.pw) {
                    return done(null, result);
                } else {
                    return done(null, false, { message: '비밀번호가 틀렸습니다.' });
                }
            });
        }
    )
);

// passport 세션 생성
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// 세션데이터를 사용해 db에서 유저 찾기(마이페이지 접속시 발동)
passport.deserializeUser(function (id, done) {
    done(null, {});
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
    res.render('mypage.ejs');
});

app.get('/join', function(req, res){
    res.render('join.ejs')
})

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
            db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw, nickname: req.body.nickname }, function (error, result) {
                console.log('회원가입 완료');
                res.redirect('/');
            });
        }
    });
});

