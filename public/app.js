// const form = document.querySelector('form');
// const output = document.getElementById('output');

// form.addEventListener('submit', async (event) => {
//   event.preventDefault();

//   const prompt = document.getElementById('prompt').value;

//   const response = await fetch(`draw?prompt=${prompt}`);
//   const data = await response.json();

//   const image = document.createElement('img');
//   image.src = data.url;

//   output.innerHTML = '';
//   output.appendChild(image);
// });


const form = document.querySelector('form');
const output = document.getElementById('output');

const progressBar = document.querySelector('.progress-bar');

let socket = null;

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // prevent form submission

  const prompt = document.getElementById('prompt').value;
  const button = document.getElementById('generate-btn');
  button.disabled = true;

  output.innerHTML = '';
  progressBar.style.width = `0%`;
  progressBar.setAttribute('aria-valuenow', '0');
  $("#server_data").html("starting...")

  try {
    // Make a request to the server to start generating the image
    const response = await axios.get('draw', {
      params: { prompt }
    });

    const job_id = response.data.num.replace('(', '').replace(')', ''); // extract the job ID from the response
    console.log(`The job_id:${job_id}`);

    $("#server_data").html(`Queued, job id: ${job_id}`)

    // create a new WebSocket connection for this job_id if it doesn't exist yet
    if (!socket) {
      socket = io('http://localhost:3000', {
        query: { job_id },
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      socket.on('data', data => {
        //console.log(`${data}`);
        $("#server_data").html(data)
      });

      socket.on('percentage', percentage_str => {
        const percentage = percentage_str.split("%")[0];
        //console.log(`Percentage: ${percentage}`);
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
      });

      socket.on('image_url', imageUrl => {
        //console.log(`Image URL: ${imageUrl}`);
        button.disabled = false;
        const image = document.createElement('img');
        image.src = imageUrl;
        image.width = 250;
        image.height = 250;

        output.innerHTML = '';
        output.appendChild(image);
      });

      socket.on('end', () => {
        console.log("WebSocket disconnected");
        socket.close();
        socket = null;
      });

      socket.on('error', (error) => {
        console.log(error)
        if (error.code == "CANCELLED") {
          console.log("CANCELLED")
          socket.close();
          socket = null;
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
});