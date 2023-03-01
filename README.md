# Installation 


```
	pnpm i
	pnpm run dev
```


# Description 

The code initializes an Express app with a single router that has two routes `/get` and `/draw`.

1. GET `/get`: 
This route takes a `job_id` query parameter and returns a JSON response with an image_url property. 
The `job_id` parameter is used to fetch the logs of a DeepSquare job and parse them to find a link to the generated image. The `image_url` property in the response is a modified version of the found link with a different domain name.

2. GET  `/draw`: 
This route takes a prompt query parameter and returns a JSON response with a num and a seed property.
The prompt parameter is used to create a DeepSquare job with specific parameters. 
The `job` is then submitted to the DeepSquare server using the DeepSquareClient API. 
The `num` property in the response is the job ID of the submitted job, and the seed property is a random seed used in the job parameters.

# Configuration

The environment variables used in this code are:

- `PRIVATE_KEY`: The private key to use for the DeepSquare client.
- `METASCHEDULER_ADDR`: The URL of the Metascheduler contract.
- `CREDIT_ADDR`: The address of the Credit contract.
- `ENDPOINT`: The endpoint URL of the Ethereum node to use for interacting with the blockchain.
- `ROOT_PATH`: The root path for the app. If not specified, the default value of / will be used.

These environment variables are loaded using the dotenv package from a .env file in the project directory. The .env file should contain the key-value pairs for each variable, like so:

```makefile 
PRIVATE_KEY=<private_key>
METASCHEDULER_ADDR=<metascheduler_address>
CREDIT_ADDR=<credit_address>
ENDPOINT=<ethereum_node_endpoint>
ROOT_PATH=<root_path>
```

Note that the values of these variables are specific to the user's configuration and should not be shared with others.


Default values can be found in .env.example


# Job management 

This is a TypeScript code that exports a function `createJob` that creates a job configuration object. The job configuration is passed to the job execution system of DeepSquare, that runs the job using the specified resources and environment variables.

The `createJob` function takes four parameters:

- `PROMPT`: a string that represents the input to a deep learning model for generating images.
- `SEED`: a number that represents the seed value for the random number generator used in the deep learning model.
- `STEPS`: a number that represents the number of steps to generate an image using the deep learning model.
- `SIZE`: a number that represents the size of the image to be generated using the deep learning model.
The job configuration object has several fields:

- enableLogging: a boolean that specifies whether to enable logging.
- resources: an object that specifies the resources required to run the job, including the number of tasks, CPUs per task, memory per CPU, and GPUs per task.
- env: an array of environment variables that are passed to the job as key-value pairs.
output: an object that specifies the output of the job, including the URL of the transfer service used to transfer the output files.
- continuousOutputSync: a boolean that specifies whether to enable continuous output synchronization.
- steps: an array of steps to execute the job. Each step contains a name and a run object that specifies the container to run, the resources required, the environment variables to set, the shell to use, and the command to execute.

The `createJob` function returns the job configuration object as a `Job` object, which is defined in a separate module imported from `@deepsquare/deepsquare-client/src/graphql/client/generated/graphql`.