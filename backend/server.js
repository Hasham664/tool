// server.js
import express from 'express';
import cors from 'cors';
// import bodyParser from 'body-parser';
import imageRoutes from './routes/imageRoutes.js';

import 'dotenv/config.js';

const app = express();
const port = process.env.Port || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());



app.use('/api/images', imageRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('serp api key',process.env.SERP_API_KEY);
  
});
