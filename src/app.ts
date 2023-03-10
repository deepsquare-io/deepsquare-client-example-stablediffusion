import express, { Request, Response } from 'express';
import { Server } from 'http';

import DeepSquareClient from "@deepsquare/deepsquare-client";
import { BigNumber } from "@ethersproject/bignumber";
import dotenv from 'dotenv'
import cors from 'cors';
import { createJob } from './job'
import { Server as SocketIOServer, Socket } from 'socket.io';


dotenv.config()

const deepSquareClient = new DeepSquareClient(
  process.env.PRIVATE_KEY as string,
  process.env.METASCHEDULER_ADDR as string,
  process.env.CREDIT_ADDR as string,
  process.env.ENDPOINT as string);

const ROOT_PATH = process.env.ROOT_PATH as string | "/";

const app = express();
const server = new Server(app);
const io = new SocketIOServer(server);

const padJobId = (num: string) => {
  const length = 64; // length of the fixed length hex string

  // Convert the number to a hex string with leading zeros
  const hexString = num.padStart(length, '0');

  // Add the '0x' prefix to the hex string
  const formattedHexString = `0x${hexString}`;
  return formattedHexString
}

const unpadJobId = (num: string) => {
  // Remove the '0x' prefix from the input string
  const hexString = num.substring(2);

  // Remove any leading zeros from the hex string
  const unpaddedHexString = hexString.replace(/^0+/, '');

  // Return the resulting string
  return unpaddedHexString;
}

const router = express.Router();

router.use(express.static('public'))


router.get('/', (req: Request, res: Response) => {
  res.render('index');
});

io.on('connection', async (socket) => {
  console.log('Client connected');

  const job_id = padJobId(socket.handshake.query.job_id as string);
  const logsMethods = deepSquareClient.getLogsMethods(job_id);
  const [read, stopFetch] = await logsMethods.fetchLogs();
  const decoder = new TextDecoder();
  let take_next = false;

  const fetchLogstream = async () => {
    try {

      for await (const log of read) {
        const lineStr = decoder.decode(log.data);
        //console.log(lineStr)
        const percentageMatch = lineStr.match(/\d+\.?\d*\s*%/);
        const percentage = percentageMatch ? percentageMatch[0] : null;
        if (percentage) {
          socket.emit('percentage', percentage);
        }
        else {
          socket.emit('data', lineStr);
        }
        if (take_next) {
          console.log("there is an image what")
          socket.emit('image_url', `${lineStr?.replace('transfer.deepsquare.run/', 'transfer.deepsquare.run/get/')}`);
          take_next = false;
          socket.emit('end');
          return;
        }
        if (lineStr.includes("Click on this link to preview your results:")) {
          take_next = true;
        }
      }

      // If we reach this point, the log stream has ended, so we emit the `end` event to the client
      socket.emit('end');
    } catch (err) {
      console.log("error")
      //console.error(err);

      // If the error is due to a broken iterator contract, we wait for a few seconds and try again
      if (err.message === 'iterator contract broken') {
        console.log('Retrying in 5 seconds...');
        setTimeout(fetchLogstream, 5000);
      }

      // If the error is due to cancellation by the client, we do not retry and emit the `error` event to the client
      else if (err.code === 'CANCELLED') {
        socket.emit('error', { message: err.message, code: err.code });
      }
    }
  }

  await fetchLogstream().catch(console.error);
  stopFetch();
});

router.get('/get', async (req: Request, res: Response) => {
  res.json({
    status: "job_launched"
  });
});

router.get('/draw', async (req: Request, res: Response) => {
  const prompt = req.query.prompt as string;
  if (!prompt) {
    res.render('index');
    return;
  }
  const depositAmount = BigNumber.from('10000000000000');
  await deepSquareClient.deposit(depositAmount);

  const parameters = {
    "SEED": Math.round(Math.random() * 100000),
    "PROMPT": `"${prompt}"`,
    "STEPS": 200,
    "SIZE": 768,
  }

  const myJob = createJob(
    parameters["PROMPT"],
    parameters["SEED"],
    parameters["STEPS"],
    parameters["SIZE"],
  )

  const job = await deepSquareClient.submitJob(myJob, 'mysuperfirstjob');
  res.json({
    num: `(${unpadJobId(job)})`,
    seed: `${parameters["SEED"]}`
  });
});

// Allow requests from any origin
app.use(cors());

app.use(ROOT_PATH, router);

io.on('connection', (socket: Socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
