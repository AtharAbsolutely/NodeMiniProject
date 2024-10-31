#creating base image of node with version alpine
FROM node:20.17.0

#Setting up working directory in container
WORKDIR /usr/src/app

#Coping package.json and package-lock.json file to working directory
COPY package*.json .

#Installing dependency through npm ci (similar with npm install)
RUN npm ci

RUN npm install -g nodemon
#Copying all file of project directory to container directory, skipping those file which are mentioned on .dockerignore like (./node_module, Dockerfile, etc.)
COPY . .

#Starting server
# CMD [ "npm","start" ]

#Starting server on with dev mode
CMD [ "npm","run","dev" ]