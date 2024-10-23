import mongoose from 'mongoose';

import Env from './env.config';

const {
  //MONGODB_USER,
  //MONGODB_PASSWORD,
  MONGODB_DATABASE,
  SERVER_ENV,
  MONGODB_HOST,
  MONGODB_PORT,
} = Env;

let url = '';

if (SERVER_ENV === 'dev') {
  url = `mongodb+srv://islamohessin:P2pNusVupis6ze7h@cluster0.9f9mi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  // url = `mongodb://${MONGODB_HOST}/${MONGODB_DATABASE}`;
} else {
  url = `mongodb+srv://islamohessin:P2pNusVupis6ze7h@cluster0.9f9mi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
}

const connectToMongoDB = () => {
  mongoose.connect(url);
  mongoose.connection.on('connected', () => {
    console.log('Connected Successfully To Database ');
  });
  mongoose.connection.on('error', (err) => {
    console.error(`Failed To Database : ${err}`);
  });
};

// const connectToMongoDB = async () => {
//   console.log(`DB URL: ${url}`);
//   await mongoose.connect(url);
//   mongoose.connection.on('connected', () => {
//     console.log('Connected successfully to MongoDB ');
//   });
//   mongoose.connection.on('error', (err) => {
//     console.error(`Fail to connect to MongoDB : ${err}`);
//   });
// };

export const closeMongoDB = async () => {
  await mongoose.connection.close();
};

export default connectToMongoDB;
