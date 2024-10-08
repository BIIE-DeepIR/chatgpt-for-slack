# Latest ChatGPT model to support science on Slack

This app uses Slack's
[next-generation hosted platform](https://api.slack.com/future) to bring the
latest AI models from OpenAI available in a Slack conversation.

---

## Supported Workflows

- **Configure:** Configure what channels the app can respond to messages in
- **Quick Reply:** Runs when a user starts a discussion with ChatGPT or asks a
  simple question by mentioing the app's bot user
- **Discuss:** Runs when a user send a follow-up message in a discussion thread
  with ChatGPT

## Todo list
- A long response is currently split into multiple messages. This is not ideal
- If the API takes long to respond, the token is revoked
- Choice for user to select the model, or choose it based on the prompt complexity

## Setup

Before getting started, make sure you have a development workspace where you
have permissions to install apps. If you don’t have one set up, go ahead and
[create one](https://slack.com/create). Also, please note that the workspace
requires any of [the Slack paid plans](https://slack.com/pricing).

### Create Your OpenAI API Account

Also, this app needs a valid Open AI access key for ChatGPT API calls. Head to
[your OpenAI account page](https://platform.openai.com/account/api-keys) to
create a new API key. We will use the token string later.

### Install the Slack CLI

To use this template, you first need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/future/quickstart).

### Clone the Template

Start by cloning this repository:

```zsh
# Clone this project onto your machine
$ git clone https://github.com/BIIE-DeepIR/chatgpt-for-slack.git

# Change into this project directory
$ cd chagpt-for-slack
```

## Save Env Values

Copy [the OpenAI API key string](https://platform.openai.com/account/api-keys)
and save the value in `.env` file:

```
OPENAI_API_KEY=sk-...
```

When you deploy your app later, you can set the same value by running the
following command:

```bash
slack env add OPENAI_API_KEY sk-...
```

Also, if you already have the API access to GPT-4 model, you can switch to
`gpt-4` by having `OPENAI_MODEL=gpt-4` in the `.env` file for dev app and
running `slack env add OPENAI_MODEL gpt-4` for deployed app.

## Create a link trigger for configuring your app

[Triggers](https://api.slack.com/future/triggers) are what cause workflows to
run. These triggers can be invoked by a user, or automatically as a response to
an event within Slack.

A [link trigger](https://api.slack.com/future/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app). When creating a trigger, you must select
the Workspace that you'd like to create the trigger in. Each Workspace has a
development version (denoted by `(dev)`), as well as a deployed version.

If not selected when the app was first run/installed, create a link trigger for
the workflow that enables end-users to configure the ChatGPT workflow in this
template, run the following command:

```zsh
$ slack trigger create --trigger-def triggers/configure_link.ts
```

After selecting a Workspace, the output provided will include the link trigger
Shortcut URL. Copy and paste this URL into a channel as a message, or add it as
a bookmark in a channel of the Workspace you selected.

**Note: this link won't run the workflow until the app is either running locally
or deployed!** Read on to learn how to run your app locally and eventually
deploy it to Slack hosting.

**Creating further triggers**
Only one trigger can be specified from a file when installing the app. The current
setup installs the link trigger. When you run the workflow through the link shortcut
you will run the configuration. In `configuration.ts` file the respective triggers are
then created to keep track of @ mentions or direct messages.

## Running Your Project Locally

While building your app, you can see your changes propagated to your workspace
in real-time with `slack run`. In both the CLI and in Slack, you'll know an app
is the development version if the name has the string `(dev)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

Once running, click the
[previously created Shortcut URL](#create-a-link-trigger) associated with the
`(dev)` version of your app. This should create the direct message triggers for all the users.

To stop running locally, press `<CTRL> + C` to end the process.

You can also have a private chat with the ScienceBot by:
This is how it works:
1. Click on the @ScienceBot tag
2. Click "Message"
3. Now you have a private chat between just you and the ScienceBot. Write a message as a prompt.
4. You will shortly receive a reply to that message from ScienceBot
5. To continue the conversation, write the next message in the open thread
6. To start a new conversation, write a new prompt directly to the main chat

## Deploying Your App

Once you're done with development, you can deploy the production version of your
app to Slack hosting using `slack deploy`. Also, please don't forget setting the
OpenAI API key for the deployed app.

```zsh
$ slack deploy
$ slack env add OPENAI_API_KEY (your key here)
```

After deploying, [create a new link trigger](#create-a-link-trigger) for the
production version of your app (not appended with `(dev)`). Once the trigger is
invoked, the workflow should run just as it did in when developing locally.

### Viewing Activity Logs

Activity logs for the production instance of your application can be viewed with
the `slack activity` command:

```zsh
$ slack activity
```

### Other useful commands

Some commands that can come handy when managing the application:

```zsh
$ slack triggers list
$ slack trigger delete --trigger-id <ID HERE>
$ slack uninstall
$ slack env add OPENAI_MODEL o1-mini
```

## Project Structure

### `manifest.ts`

The [app manifest](https://api.slack.com/future/manifest) contains the app's
configuration. This file defines attributes like app name and description.

### `slack.json`

Used by the CLI to interact with the project's SDK dependencies. It contains
script hooks that are executed by the CLI and implemented by the SDK.

### `/functions`

[Functions](https://api.slack.com/future/functions) are reusable building blocks
of automation that accept inputs, perform calculations, and provide outputs.
Functions can be used independently or as steps in workflows.

### `/workflows`

A [workflow](https://api.slack.com/future/workflows) is a set of steps that are
executed in order. Each step in a workflow is a function.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/future/forms) before continuing
to the next step.

### `/triggers`

[Triggers](https://api.slack.com/future/triggers) determine when workflows are
executed. A trigger file describes a scenario in which a workflow should be run,
such as a user pressing a button or when a specific event occurs.

## Resources

To learn more about developing with the CLI, you can visit the following guides:

- [Creating a new app with the CLI](https://api.slack.com/future/create)
- [Configuring your app](https://api.slack.com/future/manifest)
- [Developing locally](https://api.slack.com/future/run)

To view all documentation and guides available, visit the
[Overview page](https://api.slack.com/future/overview).
