// 라우터 만드는 법 (익스프레스)
var router = require('express').Router();

function middleWare(){

}

// app.use와 비슷하게 router파일 안에 있는 모든 route들에 미들웨어 적용
router.use(middleWare);

router.get('/shirts', function (요청, 응답) {
    응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function (요청, 응답) {
    응답.send('바지 파는 페이지입니다.');
});

// module.exports = 모듈에서 어떤 변수를 내보낼때 사용
module.exports = router;