# inbox-tester

A simple node web-server to provide inbox testing functionality.

# Primary Use Cases

You want to test your website's reset-password mechanism automatically.

You have a Nightwatch (or similar) automated process which submits the reset password form on-site.
You then want access to the reset URL contained within the contents of the email.

This tool helps you retrieve that URL.

# Setup

Create a new gmail account

TODO: Auth instructions

run `node src/index.js`

The first time you run this, you'll see an authorization url output to the console. Copy this url, and visit it.
Follow the in-browser steps to authorize the action
Copy the provided token back into the console, as instructed.

# Usage

Make a GET to /emails/find-url

pass the following querystring parameters

* `url` - a regex to apply to each `href=""` found within the email body

e.g.

GET /emails/find-url?url=%5Ehttp%3A%2F%2Fwww.mydomain.com%2Freset-password

(without URL encoding, for demonstrative purposes: GET /emails/find-url?url=^http://www.mydomain.com/reset-password)