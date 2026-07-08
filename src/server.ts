import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

async function main() {
    try {
        await prisma.$connect();    // Check if database connection is ok
        console.log("Database Connected Successfully.");
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    } catch (error) {
        console.error("Error starting the server: ", error);
        await prisma.$disconnect();     // App disconnects for database connection error
        process.exit(1);
    }
}

main();
