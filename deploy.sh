#!/bin/bash

set -e;

# Env vars
: "${SSH_USER:?Need to set SSH_USER}"
: "${SSH_HOST:?Need to set SSH_HOST}"
: "${PROJECT_ID:?Need to set PROJECT_ID}"
: "${LOCATION:?Need to set LOCATION}"
: "${APP_PORT:?Need to set APP_PORT}"
# : "${DEPLOY_DIR:?Need to set DEPLOY_DIR}"
: "${GCP_SA_KEY:?Need to set GCP_SA_KEY}"
# : "${TELEGRAM_TOKEN:?Need to set TELEGRAM_TOKEN}"

deploy () {
  echo "Deploying to $DEPLOY_DIR"

  ssh $SSH_USER@$SSH_HOST << EOF
    set -e;

    # Authenticate with GCP
    gcloud auth activate-service-account --key-file=<(echo '$GCP_SA_KEY');
    gcloud auth configure-docker $LOCATION-docker.pkg.dev;

    # Navigate to the deployment directory
    # cd $DEPLOY_DIR;
    
    # Pull and run the latest image
    echo "Pulling and running the latest image"
    docker pull $LOCATION-docker.pkg.dev/$PROJECT_ID/artifacts/message-bot:latest
    docker stop message-bot || true
    docker rm message-bot || true
    docker run -d -v /home/user/data:/usr/src/app/data \
      --name message-bot \
      -p $APP_PORT:3000 $LOCATION-docker.pkg.dev/$PROJECT_ID/artifacts/message-bot:latest
EOF

echo "Deployment complete"
}

# Deploy the app
deploy;