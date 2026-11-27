import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";

async function main() {
    try {
        await prisma.$connect(); // Check if database connection is ok
        console.log("Database Connected Successfully.");
        await redisClient.connect();
        console.log("Redis Connected Successfully.");
        await transporter.verify();
        console.log("Nodemailer Connected Successfully.");
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    } catch (error) {
        console.error("Error starting the server: ", error);
        await prisma.$disconnect(); // App disconnects for database connection error
        process.exit(1);
    }
}

main();
