*This project has been created as part of the 42 curriculum by alkuijte, eklymova, dbank & vsoulas*

# Description
The final 42 Core project allows for a lot of freedom. We decided to create a live multiplayer game. <NAME> is a medieval PvP game with nostalgic 2.5D graphics. It has fast paced matches with 2 to 4 players where the goal is to gather resources, defend your castle and release a siege engine on your opponent. 

The goal of this project was to develop a full-stack web application with a team to teach us about front-end development, teamwork and a work environment close to the real world.

## Instructions
To run <NAME> you must run Linux or macOS. There are a few dependencies that are required:
- GNU Make
- Docker
- Docker Compose
- OpenSSL

You can download these using your systems package manager, or if you are using Nix as a package manager run nix-shell in the directory.

Once all prerequisites have been installed a ````.secret```` file should be create. An example is provided in ````.secret.example````. This shows which fiels are required.

Run: ````make init````

Once it has completed run: ````make````

It may take a while (especially on first startup). If everything has gone correctly you will see: Game reachable at https://domainname/

## Resources
Extensive use was made of the TypeScript documentation, StackOverflow, documentation for Docker, Docker Compose, and much more.

AI was used for occasional debugging, explaining and in the assistence of creating unit tests. No code was blindly copied.

## Team Information

## Project Management
During most of the project we had biweekly meetings. Partly online and partly in person. For communication in between meetings we either used a shared Slack channel, private Slack messages or GitHub issues. When an issue was raised on GitHub someone would be assigned to it. Once done a Pull Request was made. A minimum of one review done on the code. If no changes were requested it would get merged into the main branch. Task distribution mostly went according to desire. All of us had particular interests and none overlapped too much. Later on as parts of the project were finished or if features required tight integration these lines blurred a bit (eg, a feature requiring both code in the frontend & backend) but ultimately we didn't stray too far from what we originally set out to do.

## Technical Stack

### Frontend
        "i18next": "^26.4.2",
        "pixi.js": "^8.19.0",
        "react": "^19.2.7",
        "react-dom": "^19.2.7",
        "react-i18next": "^17.0.15",
        "react-router-dom": "^7.18.4",
        "socket.io-client": "^4.8.3"
### Backend
        "@fastify/cookie": "^11.1.2",
        "@fastify/static": "^10.1.5",
        "@otplib/uri": "^13.4.1",
        "bcrypt": "^6.0.0",
        "fastify": "^5.11.3",
        "nodemailer": "^9.0.4",
        "otplib": "^13.4.1",
        "pg": "^8.22.0",
        "qrcode": "^1.5.4",
        "socket.io": "^4.8.3",
        "typescript": "^5.9.3"
### Database

## Database Schema

## Features List

## Modules

| Module                                                                | Points |  Justification             |  Implemented By  |
|-----------------------------------------------------------------------|--------|----------------------------|----------|
| Use a framework for both the frontend and backend.                    | 2      | React for the frontend, Fastify for the backend | everyone |
| Implement real-time features using WebSockets or similar technology   | 2      |   | b |

## Individual Contributions