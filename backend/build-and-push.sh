#!/bin/bash
# Usage: ./build-and-push.sh <your-dockerhub-username>
# Example: ./build-and-push.sh sriramanand

set -e

DOCKER_USERNAME=${1:?"Usage: ./build-and-push.sh <dockerhub-username>"}
TAG="latest"

SERVICES=(
  "eureka-server"
  "config-server"
  "api-gateway"
  "auth-service"
  "user-service"
  "skill-service"
  "session-service"
  "mentor-service"
  "group-service"
  "review-service"
  "notification-service"
  "payment-gateway"
  "messaging-service"
)

echo "Logging in to Docker Hub..."
docker login

for SERVICE in "${SERVICES[@]}"; do
  IMAGE="$DOCKER_USERNAME/skillsync-$SERVICE:$TAG"
  echo ""
  echo "Building $IMAGE ..."
  docker build -t "$IMAGE" "./$SERVICE"
  echo "Pushing $IMAGE ..."
  docker push "$IMAGE"
  echo "$SERVICE done."
done

echo ""
echo "All images built and pushed successfully!"
echo "Images are available at: https://hub.docker.com/u/$DOCKER_USERNAME"
