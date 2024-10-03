<div align="center">
<img width="150" alt="saleor-app-template" src="./public/logo.png">
</div>

<div align="center">
  <h1>Saleor Fileprint App</h1>
</div>

<div align="center">
  <p>Saleor APP that allows you to upload files and order their printing.</p>
</div>

<div align="center">
  <a href="https://saleor.io/">Saleor</a>
  <span> | </span>
  <a href="https://docs.saleor.io/docs/3.x/">Docs</a>
</div>

### Setup

First install packages:
```
pnpm install
```

This application uses <a href="https://mupdf.com/">mupdf-tools</a> utility, so it must be installed in the runtime environment:
```
sudo apt install mupdf-tools
```

You must also have <a href="https://www.postgresql.org/download/">Postgres</a> DB installed.
Set DB connection string in DATABASE_URL

Run to generate prisma client:
```
prisma generate
```

For run locally:
```
pnpm run dev
```

### Environment variables

- DATABASE_URL="postgres://username:password@host:port/dbname?schema=public"
- SALEOR_API_URL="your-saleor-url/graphql/"
- NEXT_MEDIA_DIR="uploaded/files/dir"

### What is Saleor App

Saleor App is the fastest way of extending Saleor with custom logic using [asynchronous](https://docs.saleor.io/docs/3.x/developer/extending/apps/asynchronous-webhooks) and [synchronous](https://docs.saleor.io/docs/3.x/developer/extending/apps/synchronous-webhooks/key-concepts) webhooks (and vast Saleor's API). In most cases, creating an App consists of two tasks:

- Writing webhook's code executing your custom logic.
- Developing configuration UI to be displayed in Saleor Dashboard via specialized view (designated in the App's manifest).

### What's included?

- 🚀 Communication between Saleor instance and Saleor App
- 📖 Manifest with webhooks using custom query

### Why Next.js

You can use any preferred technology to create Saleor Apps, but Next.js is among the most efficient for two reasons. The first is the simplicity of maintaining your API endpoints/webhooks and your apps' configuration React front-end in a single, well-organized project. The second reason is the ease and quality of local development and deployment.

### Learn more about Apps

[Apps guide](https://docs.saleor.io/docs/3.x/developer/extending/apps/key-concepts)

## Development

### Requirements

Before you start, make sure you have installed:

- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/)
- [Saleor CLI](https://docs.saleor.io/docs/3.x/cli) - optional, but recommended

### With CLI

The easiest way to set up a Saleor app is by using the Saleor CLI.

[Saleor CLI](https://github.com/saleor/saleor-cli) is designed to save you from the repetitive chores around Saleor development, including creating Apps. It will take the burden of spawning new apps locally, connecting them with Saleor environments, and establishing a tunnel for local development in seconds.

[Full Saleor CLI reference](https://docs.saleor.io/docs/3.x/cli)

If you don't have a (free developer) Saleor Cloud account, create one with the following command:

```
saleor register
```

You will also have to login with:

```
saleor login
```

Now you're ready to create your first App:

```
saleor app template [your-app-name]
```

In this step, Saleor CLI will:

- clone this repository to the specified folder
- install dependencies
- ask you whether you'd like to install the app in the selected Saleor environment
- create `.env` file
- start the app in development mode

Having your app ready, the final thing you want to establish is a tunnel with your Saleor environment. Go to your app's directory first and run:

```
saleor app tunnel
```

Your local application should be available now to the outside world (Saleor instance) for accepting all the events via webhooks.

A quick note: the next time you come back to your project, it is enough to launch your app in a standard way (and then launch your tunnel as described earlier):

```
pnpm dev
```

### Without CLI

1. Install the dependencies by running:

```
pnpm install
```

2. Start the local server with:

```
pnpm dev
```

3. Expose local environment using tunnel:
Use tunneling tools like [localtunnel](https://github.com/localtunnel/localtunnel) or [ngrok](https://ngrok.com/).

4. Install the application in your dashboard:

If you use Saleor Cloud or your local server is exposed, you can install your app by following this link:

```
[YOUR_SALEOR_DASHBOARD_URL]/apps/install?manifestUrl=[YOUR_APP_TUNNEL_MANIFEST_URL]
```

This template host manifest at `/api/manifest`

You can also install application using GQL or command line. Follow the guide [how to install your app](https://docs.saleor.io/docs/3.x/developer/extending/apps/installing-apps#installation-using-graphql-api) to learn more.

### Generated schema and typings

Commands `build` and `dev` would generate schema and typed functions using Saleor's GraphQL endpoint. Commit the `generated` folder to your repo as they are necessary for queries and keeping track of the schema changes.

[Learn more](https://www.graphql-code-generator.com/) about GraphQL code generation.

### Storing registration data - APL

During the registration process, Saleor API passes the auth token to the app. With this token App can query Saleor API with privileged access (depending on requested permissions during the installation).
To store this data, app-template use a different [APL interfaces](https://github.com/saleor/saleor-app-sdk/blob/main/docs/apl.md).

The choice of the APL is made using the `APL` environment variable. If the value is not set, FileAPL is used. Available choices:

- `file`: no additional setup is required. Good choice for local development. It can't be used for multi tenant-apps or be deployed (not intended for production)
- `upstash`: use [Upstash](https://upstash.com/) Redis as storage method. Free account required. It can be used for development and production and supports multi-tenancy. Requires `UPSTASH_URL` and `UPSTASH_TOKEN` environment variables to be set

If you want to use your own database, you can implement your own APL. [Check the documentation to read more.](https://github.com/saleor/saleor-app-sdk/blob/main/docs/apl.md)
