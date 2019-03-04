const localJwt = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models/index');
require('dotenv').config();
module.exports = (passport) => {
    localJwt(passport);
    kakao(passport);
}
