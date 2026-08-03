# shell for prostgres :
docker compose exec postgres sh
then --> psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
	then --> \dt
		then --> SELECT * FROM users;


# front end connection with backend register function
try {
	const response = await fetch("/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: username.trim(),
			email: email.trim(),
			password,
		}),
	});

# registration flow
Signup.tsx sends POST /register
server.js receives it
auth.js validates it
auth.js calls db.js
db.js sends SQL to Postgres
Postgres stores the row