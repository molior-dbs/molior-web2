# Molior Web

## Configure nginx

cd molior-web2
sudo ln -sf `readlink -f molior-web.nginx.dev` /etc/nginx/sites-enabled/molior-web
sudo service nginx restart

## Run ng serve

PATH=node_modules/.bin:$PATH ng serve --host 127.0.0.1
