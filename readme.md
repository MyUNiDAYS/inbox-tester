# inbox-tester

A simple node tool provide inbox testing functionality.

Can be run as a webserver or imported directly into Nightwatch (for example)

# Primary Use Cases

You want to test your website's reset-password mechanism automatically.

You have a Nightwatch (or similar) automated process which submits the reset password form on-site.
You then want access to the reset URL contained within the contents of the email.

This tool helps you retrieve that URL.

You can provide a regex to filter the URLs - allowing you to search for a specific url, as well as filter the searched emails based on the TO header.

The use case for TO filtering is address extensions, allowing you to use a single inbox for multiple users, e.g.

* test.user@gmail.com
* test.user+1@gmail.com
* test.user+2@gmail.com
* test.user+3@gmail.com

# Setup

Create a new gmail account

TODO: Auth instructions

run `node src/index.js`

The first time you run this, you'll see an authorization url output to the console. Copy this url, and visit it.
Follow the in-browser steps to authorize the action
Copy the provided token back into the console, as instructed.

# Usage

## Find urls in emails

### API

`tester.findUrls(toPrefix, urlRegex)`

### Web

Make a `GET` to `/emails/find-url?url=&to=`

### Params

* `url` - a regex to apply to each `href=""` found within the email body
* `to` - a string to match against the email address prefix (part before the @) in the TO header in the emails.

e.g.

`GET /emails/find-url?url=%5Ehttp%3A%2F%2Fwww.mydomain.com%2Freset-password`

(without URL encoding, for demonstrative purposes: `GET /emails/find-url?url=^http://www.mydomain.com/reset-password`)

## Delete an email

Once you've found the email with the URL you want, you should clean up after yourself.

### API

`tester.deleteMessage(msgId)`

### Web

Make a `DELETE` request to `/emails/<messageId>`

### Params

where `<messageId>` is a `msgId` value obtained from the results of making a GET to `/emails/find-urls`
