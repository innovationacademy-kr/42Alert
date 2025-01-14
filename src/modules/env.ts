import path from "path";
import dotenv from "dotenv";

const { NODE_ENV } = process.env;

if (NODE_ENV === "development") {
    dotenv.config({ path: path.resolve(__dirname, "../../.env.dev") });
} else if (NODE_ENV !== "production") {
    throw new Error("process.env.NODE_ENV를 설정하지 않았습니다.");
}

const env = {
    port: parseInt(String(process.env.PORT), 10) || 5000,
    nodeEnv: process.env.NODE_ENV,
    ftConfig: {
        eventId: process.env.FT_EVENT_UID,
        eventSecret: process.env.FT_EVENT_SECRET,
        examId: process.env.FT_EXAM_UID,
        examSecret: process.env.FT_EXAM_SECRET,
        apiUrl: process.env.FT_API_URL,
    },
    slackConfig: {
        token: process.env.SLACK_TOKEN,
        channel: process.env.SLACK_CHANNEL,
    },
    dbConfig: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: parseInt(String(process.env.DATABASE_PORT), 10),
    },
};

export default env;
