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

const countdownDuration = 85000; // Countdown duration in milliseconds
const canvas = document.getElementById('countdown-canvas');
const context = canvas.getContext('2d');
const radius = canvas.height / 2.5;
const center_x = canvas.width / 2;
const center_y = canvas.height / 2;

function drawCountdown(progress) {
  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background circle
  context.beginPath();
  context.arc(center_x, center_y, radius, 0, 2 * Math.PI);
  context.fillStyle = '#DDD4';
  context.fill();

  // Draw the progress arc
  context.beginPath();
  context.arc(center_x, center_y, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
  context.lineWidth = 10;
  context.strokeStyle = '#EEEC';
  context.stroke();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // prevent form submission

  const prompt = document.getElementById('prompt').value;
  const button = document.getElementById('generate-btn');
  button.disabled = true;
  button.style.backgroundColor = "#EEE4";
  button.style.borderColor = "#EEE4";
  canvas.style.display = "block"; // or "inline" depending on the element's default display value

  // Set up the interval to update the countdown
  const countdownDuration = 45000; // 10 seconds
  const startTime = Date.now();
  const endTime = startTime + countdownDuration;
  const interval = setInterval(() => {
    // Calculate the start time and end time of the countdown
    const timeRemaining = endTime - Date.now();
    const progress = timeRemaining / countdownDuration;

    // Draw the current state of the countdown
    drawCountdown(progress);

    if (timeRemaining <= 0) {
      clearInterval(interval);
      // Countdown has ended, do something here
    }
  }, 50);

  try {
    // Make a request to the server to start generating the image
    const response = await axios.get('draw', {
      params: { prompt }
    });

    // Draw the initial state of the countdown
    drawCountdown(1);

    const job_id = response.data.num.replace('(', '').replace(')', ''); // extract the job ID from the response
    console.log(`The job_id:${job_id}`);

    // Poll the server until the image is ready
    const response2 = await axios.get('get', {
      params: { job_id }
    });

    console.log(`Done: ${response2.data.image_url}`);
    button.disabled = false;
    const image = document.createElement('img');
    image.src = `${response2.data.image_url}`;
    image.width = 250;
    image.height = 250;

    output.innerHTML = '';
    output.appendChild(image);
    canvas.style.display = "none"; // or "inline" depending on the element's default display value
  } catch (error) {
    console.error(error);
  }
});