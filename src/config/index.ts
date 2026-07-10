import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    app_url: process.env.APP_URL,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jet_secret_key: process.env.JWT_SECRET_KEY!,
    jet_secret_key_expires_in: process.env.JWT_SECRET_KEY_EXPIRES_IN!,
    jet_refresh_secret_key: process.env.JWT_REFRESH_SECRET_KEY!,
    jet_refresh_secret_key_expires_in:
        process.env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN!,
};
