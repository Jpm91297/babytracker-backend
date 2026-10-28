import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb } from './db.js';

const port = Number(process.env.PORT ?? 3000);

try {
    await connectDb();
} catch {
    process.exit(1);
}

createApp().listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
