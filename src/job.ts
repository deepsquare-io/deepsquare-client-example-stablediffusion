import { Job } from "@deepsquare/deepsquare-client/src/graphql/client/generated/graphql";

export const createJob = (PROMPT: string, SEED: number, STEPS: number, SIZE: number) => new Object({
    "enableLogging": true,
    "resources": {
        "tasks": 1,
        "cpusPerTask": 8,
        "memPerCpu": 8000,
        "gpusPerTask": 1
    },
    "env": [
        {
            "key": "STEPS",
            "value": `${STEPS}`
        },
        {
            "key": "HEIGHT",
            "value": `${SIZE}`
        },
        {
            "key": "WIDTH",
            "value": `${SIZE}`
        },
        {
            "key": "MODEL",
            "value": "sd-2-1"
        },
        {
            "key": "ITER",
            "value": "1"
        },
        {
            "key": "SAMPLES",
            "value": "1"
        },
        {
            "key": "PROMPT",
            "value": `${PROMPT}`
        },
        {
            "key": "SEED",
            "value": `${SEED}`
        }
    ],
    "output": {
        "http": {
            "url": "https://transfer.deepsquare.run/"
        }
    },
    "continuousOutputSync": true,
    "steps": [
        {
            "name": "generate-image",
            "run": {
                "container": {
                    "deepsquareHosted": true,
                    "apptainer": true,
                    "registry": "registry-1.deepsquare.run",
                    "image": "library/stable-diffusion:latest",
                    "mounts": [
                        {
                            "hostDir": "/data/beegfs/cache/persistent",
                            "containerDir": "/cache",
                            "options": "rw"
                        },
                        {
                            "hostDir": "/opt/models/stable-diffusion",
                            "containerDir": "/models",
                            "options": "ro"
                        }
                    ]
                },
                "resources": {
                    "tasks": 1,
                    "cpusPerTask": 8,
                    "memPerCpu": 8000,
                    "gpusPerTask": 1
                },
                "env": [
                    {
                        "key": "HF_HOME",
                        "value": "/cache"
                    }
                ],
                "shell": "/bin/bash",
                "command": `
          set -e
  
          params=(
            "--ckpt" "/models/$MODEL/model.ckpt"
            "--outdir" "$DEEPSQUARE_OUTPUT"
            "--H" "$HEIGHT"
            "--W" "$WIDTH"
            "--steps" "$STEPS"
            "--n_iter" "$ITER"
            "--device" "cuda"
            "--n_samples" "$SAMPLES"
            "--seed" "$SEED"
            "--prompt" "$PROMPT"
          )
          if [ -f "/models/$MODEL/config.yaml" ]; then
            params+=("--config" "/models/$MODEL/config.yaml")
          fi
  
          python /stablediffusion/scripts/txt2img.py "\${params[@]}"
  
          echo "##############################################################"
          echo
          echo "Click on this link to preview your results:"
          find "$DEEPSQUARE_OUTPUT" -name "grid*.png" -exec sh -c 'file="{}"; curl -sS --upload-file "$file" https://transfer.deepsquare.run/; rm "$file"' \\;
          echo
          echo
          echo "##############################################################"
  
          chmod -R 777 /cache/* 2>/dev/null || true
          `
            }
        }
    ]
}) as Job;