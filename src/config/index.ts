import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    app_url: process.env.APP_URL,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_secret_key: process.env.JWT_SECRET_KEY!,
    jwt_secret_key_expires_in: process.env.JWT_SECRET_KEY_EXPIRES_IN!,
    jwt_refresh_secret_key: process.env.JWT_REFRESH_SECRET_KEY!,
    jwt_refresh_secret_key_expires_in:
        process.env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN!,
    stripe_product_id: process.env.STRIPE_PRODUCT_ID,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY!,
    stripe_price_id: process.env.STRIPE_PRICE_ID!,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
};
