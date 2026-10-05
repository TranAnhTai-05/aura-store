#!/bin/sh
# Runs once, when the MySQL container is created. Lets the application account create
# its own scratch databases (used by "npm test"), and nothing outside of them.
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\_%\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
