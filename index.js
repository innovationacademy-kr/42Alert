const express = require("express");
const path = require("path");
const axios = require("axios");
const http = require("http");
const cron = require("node-cron");
const { sequelize } = require("./models");
if (process.env.SERVER_ENV === "development") require("dotenv").config();

const getToken = require("./modules/getToken");
const sendAlert = require("./modules/sendAlert");
const newEvent = require("./modules/getNewData");

const PORT = process.env.PORT || 5000;
const app = express();

/*
    노드 크론으로 헤로쿠 서버를 잠들지 않게 20분 간격으로 깨워준다.
    헤로쿠 서버가 US 리전이여서 23시 - 14시 까지 돌려준다. (GMT 기준 08시 - 23시)
*/

if (process.env.SERVER_ENV === "production")
    cron.schedule("*/20 23,0-14 * * *", () => {
        console.log("node-cron");
        http.get("http://ftalert.herokuapp.com/");
    });

sequelize
    .sync({ force: false })
    .then(() => {
        console.log("데이터베이스 연결 성공");
    })
    .catch((err) => {
        console.log(err);
    });

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.get("/", (req, res) => res.render("index"));

/*
    42 API 토큰 발급 -> 이벤트 조회 -> 데이터 가공 -> 슬랙 출력

    최신 이벤트를 어떤식으로 알아내나?
    - 제일 최근 이벤트의 id값을 DB에서 최신 id와 비교해서 알아낸다
    - 서버가 꺼지거나 재시작 되어도 최신 이벤트 id값은 유지된다.

    실행을 3초 변경 -> 못잡는 이벤트 설정
*/

setInterval(() => {
    getToken()
        .then((accessToken) => {
            axios({
                method: "get",
                url: "https://api.intra.42.fr/v2/campus/29/events",
                headers: { Authorization: `Bearer ${accessToken.eventToken}` },
            })
                .then(async (value) => {
                    const newEventValue = await newEvent(value.data, "event");

                    if (newEventValue.length > 0)
                        newEventValue.map(async (event) => sendAlert(event, "event"));
                })
                .catch((err) => {
                    console.log(err);
                    console.log("\x1b[31m[Event] - 42 API 호출에 실패하였습니다.\x1b[m");
                });

            axios({
                method: "get",
                url: "https://api.intra.42.fr/v2/campus/29/exams",
                headers: { Authorization: `Bearer ${accessToken.examToken}` },
            })
                .then(async (value) => {
                    const newExamValue = await newEvent(value.data, "exam");

                    if (newExamValue.length > 0)
                        newExamValue.map(async (event) => sendAlert(event, "exam"));
                })
                .catch((err) => {
                    console.log(err);
                    console.log("\x1b[31m[Event] - 42 API 호출에 실패하였습니다.\x1b[m");
                });
        })
        .catch((err) => console.log(err));
}, 5000);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
