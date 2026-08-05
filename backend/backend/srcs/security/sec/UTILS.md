# shell for prostgres :
docker compose exec postgres sh
then --> psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
	then --> \dt
		then --> SELECT * FROM users;

# registration flow
Signup.tsx sends POST /register
server.js receives it
registration.js validates it
registration.js hash password with bcrypt then call userRepository.js
userRepository.js sends SQL to Postgres
Postgres stores the row

# sign in flow
Login.tsx sends Post /signin
server.js receives it and send calls signin.js
signin.js sends it to userRepository.js
userRepository.js send SQL to Postgres
Postgres returns the row with user info
signin.js checks password with bcrypt
signin.js creates sessionId and call sessionRepository.js
sessionRepository.js send SQL to Postgres
Postgres stores row
server.js send cookie creation requestion to browers with sessionId
Longin.tsx connects user to socket

# log out flow
server.js send POST /logout
server.js retrieve cookie from browser
server.js calls deleteSessionById from sessionRepository.js
sessionRepository.js send SQL to Postgres
Postgres removes row from database
server.js send delete requests to browser
browser removes cookie

# refresh flow
on refresh server.js send POST /me
server.js receives it and calls getCurrentUser
getCurrentUser sends SQL to Postgres
Postgres returns user if sessionId exits
Players logs back in