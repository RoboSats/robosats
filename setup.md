# Set up
## Django development environment
### Install Python and pip
`sudo apt install python3 python3 pip`

### Install virtual environments
```
pip install virtualenvwrapper
pip install python-decouple
```

### Add to .bashrc

```
export WORKON_HOME=$HOME/.virtualenvs
export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3
export VIRTUALENVWRAPPER_VIRTUALENV_ARGS=' -p /usr/bin/python3 '
export PROJECT_HOME=$HOME/Devel
source /usr/local/bin/virtualenvwrapper.sh
```

### Reload startup file
`source ~/.bashrc`

### Create virtual environment
`mkvirtualenv robosats_env`

### Activate environment
`workon robosats_env`

### Install Django and Restframework
`pip3 install django djangorestframework`

## Install Django admin relational links
`pip install django-admin-relation-links`

*Django 4.0 at the time of writting*

### Launch the local development node

```
python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py runserver
```

### Install python dependencies
```
pip install robohash
```

## React development environment
### Install npm
`sudo apt install npm`

npm packages we use
```
cd frontend
npm init -y
npm i webpack webpack-cli --save-dev
npm i @babel/core babel-loader @babel/preset-env @babel/preset-react --save-dev
npm i react react-dom --save-dev
npm install @material-ui/core
npm install @babel/plugin-proposal-class-properties
npm install react-router-dom@5.2.0
npm install @material-ui/icons
npm install material-ui-image
npm install @mui/system @emotion/react @emotion/styled
npm install react-native
npm install react-native-svg
npm install react-qr-code
```

### Launch the React render
from frontend/ directory
`npm run dev`