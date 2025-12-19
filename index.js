import express from 'express';
import morgan from "morgan";
import "dotenv/config.js"

import { connectDB } from './DB/config.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4001;

connectDB()
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan("dev"))

import rootRouter from './routes/root.routes.js';
app.use("/api/v1", rootRouter)


// Routes
app.get('/api', (req, res) => {
    res.send('Welcome to College Nerd');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
