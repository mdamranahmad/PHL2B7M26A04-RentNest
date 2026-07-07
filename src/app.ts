import express, { Application, Request, Response } from "express";

const app : Application = express();

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
});

export default app;






























// import express, { Application } from "express";

// const app: Application = express();

// app.get("/", () => {});

// export default app;
