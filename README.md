[BigRed//Hacks](http://www.bigredhacks.com)
==================
The greatest hackathon management app of all time.
 
###Setup Instructions
1. Make sure node.js and mongoDB are installed, with the latter running.
1. Fetch all dependencies by running:

        npm install
1. Setup any configuration variables. This can be done in two ways. The presence of a config file overrides the environment variable method.
  * Config file - Duplicate `config.template.json` in the root directory and name it `config.json`. Fill out all fields.
  * Environment variables - Open `config.template.json`. Use this file to input env variables of the same name. Ignore top level categories, and "_comment" fields. Note: you *must* update `config.template.json` with any additional global variables for them to be recognized.
1. Run the app! The entry point is at `/bin/www.js`.

### Admin Setup
In config.template.json, `admin.email` denotes the email address of the first admin user. The user created through the registration form with this email will automatically be assigned admin privileges. Therefore, it is recommended that this user be created before putting the app into production mode. Subsequent users can be added through the integrated role management system.

### APIs
The application uses the following APIs:

* AWS S3
* Mailchimp
* Mandrill

### Deployment
The app is configured to work with Heroku and Openshift hosting services. MongoDB is configured to work with MongoLab and Compose (`COMPOSE_URI`).
 
### Contact
The authors may be reached at [info@bigredhacks.com](info@bigredhacks.com).
