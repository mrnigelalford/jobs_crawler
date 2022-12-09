import fetch from 'node-fetch';
import { JobPost } from './JobPost.type';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv'

dotenv.config();

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt');

const setPost = async (jobPost: JobPost, companyName: string) => {
  const buff = Buffer.from(process.env.username + ":" + process.env.password);
  let base64data = buff.toString('base64');

  return fetch(process.env.wp_endpoint || '', {
    method: 'post',
    body: JSON.stringify(jobPost),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + base64data
    }
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      db.collection(companyName).updateOne({ url: jobPost.meta._application }, { $set: { "published": true } })
    }
  })
}

export {
  setPost
}