import express, { Request, Response } from 'express';
import DeepSquareClient from "@deepsquare/deepsquare-client";
import { BigNumber } from "@ethersproject/bignumber";
import dotenv from 'dotenv'
import cors from 'cors';
import { createJob } from './job'
dotenv.config()

const deepSquareClient = new DeepSquareClient(
  process.env.PRIVATE_KEY as string,
  process.env.METASCHEDULER_ADDR as string,
  process.env.CREDIT_ADDR as string,
  process.env.ENDPOINT as string);

const ROOT_PATH = process.env.ROOT_PATH as string | "/";

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

//router.use('/styles.css', express.static('public/styles.css', { type: 'text/css' } as any));[]

router.use(express.static('public'))


router.get('/', (req: Request, res: Response) => {
  res.render('index');
});

router.get('/get', async (req: Request, res: Response) => {
  const job_id = padJobId(req.query.job_id as string);
  const methods = deepSquareClient.getLogsMethods(job_id);
  const logStream = await methods.fetchLogs();
  const decoder = new TextDecoder();
  let take_next = false;
  const fetchLogstream = async () => {
    for await (const log of logStream) {
      const lineStr = decoder.decode(log.data);
      if (take_next) {
        take_next = false;
        return lineStr;
      }
      if (lineStr.includes("Click on this link to preview your results:")) {
        take_next = true;
      }
    }
  }

  const image_url = await fetchLogstream().catch(console.error) as string;
  console.log(image_url)
  methods.stopFetch();
  res.json({
    image_url: `${image_url?.replace('transfer.deepsquare.run/', 'transfer.deepsquare.run/get/')}`
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
    "STEPS": 250,
    "SIZE": 512,
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

  // PROMPT : ${parameters["PROMPT"]}<br />
  // SEED : ${parameters["SEED"]}<br />
  // SIZE : ${parameters["SIZE"]}x${parameters["SIZE"]}<br />
});


const app = express();
// Allow requests from any origin
app.use(cors());

app.use(ROOT_PATH, router);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
