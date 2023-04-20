<div align="center">
  <h1>Usher Core</h1>
	<div>
		<span>
			<a href="https://www.npmjs.com/package/prisma"><img src="https://img.shields.io/badge/-web3-blue" /></a>
		</span>
		<span>
			<a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg" /></a>
		</span>
	</div>
</div>

![Usher Banner](https://camo.githubusercontent.com/4a4439986d28507dd8b0e89e1855eaf5d362ce08c2de16223c0af6f5917f1313/68747470733a2f2f75736865722d7075622e73332e616d617a6f6e6177732e636f6d2f6d6973632f62616e6e6572732f42616e6e65722e6a7067)

<div align="center">
   <a href="https://www.usher.so">Website</a>
   <span> | </span>
   <a href="https://docs.usher.so">Documentation</a>
   <span> | </span>
   <a href="https://go.usher.so/discord">Discord</a>
   <span> | </span>
   <a href="https://go.usher.so/twitter">Twitter</a>
</div>

## 👋 Introduction

Usher is an Open Source Partnerships Platform that enables Brands to grow through performance-based marketing.

Start a Partner, Affiliate, Ambassador, or Reseller Program by deploying Usher, or engaging a managed Usher network.

### For Brands

1. Create a Partnership Campaign that defines conversion events and their associated incentives.
   These events are triggered within your Web App, infrastructure, and even [Smart Contracts](https://www.investopedia.com/terms/s/smart-contracts.asp).
2. Fund the Campaign to ensure partners are aware of available funds and therefore remaining incentives.
3. When a conversion event is triggered off the back of a referral, the referrer _(aka. Partner)_ accrues rewards accordingly.

#### Note on Decentralisation

Usher is being designed to interopate with decentralised systems to enable orchestration of human interactions that yields the fairest outcomes.
Nonetheless, the user experience will remain familiar and inspired by traditional web applications we know and love - as to minimise user complexity.
The goal is to ensure **any Brand can leverage Usher** whether they're a [DeFi](https://www.investopedia.com/decentralized-finance-defi-5113835) Protocol, an [eCommerce](https://sell.amazon.com/learn/what-is-ecommerce) store, or even a Content Creator!

### For Partners

_Partners can be affiliates, ambassadors, influencers, publishers, etc._

1. Learn and understand a Campaign to know if it's suitable for your audience, community, or clients.
2. Engage the Campaign and get a shareable invite link.
3. Share your link to refer people to the Brand's service.
4. Earn rewards when referred people trigger conversion events within the Brand's service.
5. Claim your rewards

### For Operators

_An Operator is an entity or individual responsible for deploying and managing an Usher instance._
_This can be the Brand looking to offer a white-labelled partner/affiliate experience, or a third-party, such as a Marketing Agency, Marketplace, or [DAO](https://www.investopedia.com/tech/what-dao/), seeking to elevate its community into evangelists._

1. Deploy the Usher Stack.
2. Invite your community to your Usher instance to seed the partner network.
3. _(Optionally)_ Yield a commission when partners claim their rewards.

## 🚏 Navigation

[Homepage →](https://usher.so/)

[Documentation →](https://docs.usher.so/)

[Create Campaigns & Embed Usher in your Application →](https://github.com/usherlabs/programs)

[Track Conversion Events in Web Apps with Usher.js →](https://docs.usher.so/integrating-with-usherjs/what-is-usherjs)

## 🌟 Features

Usher Core encompasses the necessary code to run:

- An application to deliver a user-friendly front-end interface, and server-side operations
- Database migrations to ensure smooth deployment and updates
- Command-line tools for administrative support
- A Listener service that facilitates conversions based on Smart Contract events.

## 📐 Core architecture

![Usher core architecture](images/docs/CoreArchitecture.png)

- **Core Web App**: Usher Core's central component is a **[NextJS](https://nextjs.org/)**-based Application that provides an accessible and user-friendly interface for managing campaigns. It also ensures smooth interaction with other services by employing deployed serverless functions.
- **User-owned Database**: By leveraging **[Ceramic](https://ceramic.network/)**'s decentralized data storage network, Usher Core provides a secure and user-centric data management solution. Ceramic schemas ensure organized and consistent data storage for elements like partnerships, campaign details, and advertiser profiles while allowing users to maintain control over their data.
- **Sybil Resistance**: Employs **[Humanode](https://humanode.io/)**'s [Sybil Resistance](https://blog.humanode.io/attack-on-sybil/) and OAuth systems to maintain the integrity of user interactions within the platform, ensuring that only genuine users can participate in the ecosystem and preserving the security and trustworthiness of user accounts.
- **Graph Database**: Centralized storage using **[ArangoDB](https://arangodb.com/)**, a multi-mode graph database. It holds data about user interactions, partnerships, campaigns, and more.

## 📦 Packages Overview

| Package Name                             | Description                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [packages/admin](./packages/admin)       | CLI for executing administrative functions on the Usher node.                                           |
| [packages/app](./packages/app)           | Next.js app provides a user-friendly interface for managing and interacting with Usher functionalities. |
| [packages/graph](./packages/graph)       | Manages ArangoDB structure (migration files) and provides serverless utilities for scalability.         |
| [packages/listener](./packages/listener) | Monitors and processes smart-contract-based conversion events in blockchain ecosystems.                 |

## 🏁 Getting started

1. Ensure your system meets the requirements:

- Node.js (v14 or higher)
- Yarn (v1)
- docker-compose (v1.25.5 or higher)

1. Clone the repository:

```bash
git clone https://github.com/usherlabs/usher.git
cd usher
```

2. To install dependencies, run `yarn install` in the root directory.

   > Usher Core is a monorepo with multiple packages in the `packages` directory. Each package has its own `package.json` and scripts. Learn more about [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

3. For package overviews and instructions to start services, refer to the respective package documentation.

## **🚀** Usage and Deployment

Users can interact with your deployed Usher Core node in two ways:

- By using the frontend interface deployed by the same node
- By integrating directly with your servers, utilizing [User Programs](https://github.com/usherlabs/programs) to achieve
  seamless integration.

Deploying each of the packages is a straightforward process. You may find more information about each of them in their respective README files. But here we'll get an overview of the process.

### Setting up our Core Next.js application

[This guide provided at `packages/app`](./packages/app/README.md#how-to-run-it) will help you set up the Next.js application for Usher Core.

By following it, you will be able to:

- Run the Next.js application locally
- Deploy this application to Vercel

### Setting up ArangoDB

[This guide provided at `packages/graph`](./packages/graph/README.md#setting-up-an-arangodb-instance) will help you set up ArangoDB for Usher Core.

By following it, you will be able to:

- Set up an ArangoDB instance on ArangoDB Cloud or on-premise, even at your local machine
- Set up a database and a database user for Usher Core usage

### Setting up migrations with ArangoMiGO

[This guide provided at `packages/graph`](./packages/graph/README.md#using-arangomigo-to-manage-migrations) will help you set up ArangoMiGO to manage migrations on your ArangoDB instance.

By following it, you will be able to:

- Install Golang and necessary dependencies to run ArangoMiGO
- Install ArangoMiGO
- Run the migration files to create and update the database structure required by Usher Core

### Setting up the Listener Node (Optional)

[This guide provided at `packages/listener`](./packages/listener/README.md#deploy) will help you set up the Listener Node for Usher Core.

It will help you to either:

- Use the Listener Node locally
- Deploy the Listener Node using docker
- Manually deploy the Listener Node to a VPS (e.g. Ubuntu)

You may want to deploy the Listener Node if you want to track conversions on blockchain ecosystems or other smart contracts.

### During these steps you may find it helpful to:

- **[Create a Vercel account](https://vercel.com/signup)** to support the deployment of the `app` package.
- **[Set up ArangoDB Cloud or On-Premise](https://www.arangodb.com/)** to handle Usher's data. Refer to the `graph`
  package to learn more.
- **[Create a Sentry account](https://sentry.io/signup/)** to enable error tracking and monitoring for your Usher Core
  deployment. This will help you identify and resolve issues more efficiently, ensuring a smoother user experience.

But bear in mind that these are not mandatory steps. You may choose to deploy Usher Core using other preferred services as well.

## 😵‍💫 Troubleshooting

- Don’t forget to check if our [Documentation](https://docs.usher.so/) already covers you
- For questions, support, and discussions:[Join the Usher Discord →](https://go.usher.so/discord)
- For bugs and feature requests:[Create an issue on Github →](https://github.com/usherlabs/core/issues)

## 🤔 **Missing Something Important to You?**

We know that everyone has different needs, and we want Usher to be as helpful and adaptable as possible. If you think
we're missing a feature that would make a big difference for you, we're all ears!

To suggest a new feature, just head over to our **[GitHub repository](https://github.com/usherlabs/usher)** and create a
new issue. Remember to add the `suggestion` tag to your issue, so we can find and prioritize your request.

Our team is always working to enhance and grow Usher, and your input is super valuable in guiding the project's future.
By sharing your suggestions, you're helping to improve the Usher community and make the product even better for
everyone. So, if you have a cool idea, don't hesitate to let us know!

## 💚 Contributing

There are many ways you can contribute to taking Usher’s mission to empower partnerships even further.

- Open issues for bugs, typos, any kind of errors you encountered, or features you missed
- Submit pull requests for something you are able to tackle (tests are always great ways to start it out)
- Engage with our community on our [Discord server](https://go.usher.so/discord) or
  our [Twitter profile](https://twitter.com/usher_web3)
- What about writing an article and exposing it somewhere? How great would be to help people know there is Usher out
  there desiring to help them build strong communities? Spread the word!

## 🛣️ **Roadmap to Decentralisation**

Usher, in it's current state, is considered semi-decentralised. While user-data associated to partners/users are managed by the Ceramic data network, cryptocurrency & event-data management are centralised. In time, the following technologies will be integrated to deliver a version of Usher whereby Operators, like yourself, will only need to manage the deployment of the Next.js App, leaving all data and cryptocurrency to be managed by autonomous protocols operated on decentralised systems.

### **ComposeDB**

As part of our future roadmap, we're evaluating the possibility of migrating
to [ComposeDB](https://composedb.js.org/docs/0.4.x/graph-structure), a graph structure built for managing data on
Ceramic. This transition aims to streamline our data handling processes by utilizing a decentralized graph structure
that supports accounts and documents.

ComposeDB would enable us to manage Ceramic's Decentralized Identifiers (DIDs) and provide secure authentication for
various entities.

### Log Store

Rather than requiring your partner & brands network to trust that you're managing critical data correctly, Usher will neverage a [decentralized time series database for event management](https://www.usher.so/network/). By collecting referrals, conversions and other events into the Log Store Network, powered by Arweave's permanent storage, we enable a tamper-proof data store so that on-chain remittance cannot be manipulated, keeping all participants of the Usher partner network secure.

### Remittance Protocol

Usher is participating in the development and integration of a Remittance Protocol for decentralized funds management.

This protocol leverages the power of EVM smart contracts and the security of the Internet Computer platform to handle
the distribution of crypto deposited by Brands adopting performance-based marketing.

Our ultimate goal is to create a secure, transparent, and user-friendly way for Operators to manage an Usher instance, and Partner Network, leaving all security requirements involed in funds management to a secure autonomous decentralised system.

## 📜 License

Copyright (c) 2022 Usher Labs Pty Ltd & Ryan Soury

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see https://www.gnu.org/licenses/agpl-3.0.

Usher is a collaborative effort, and we want to extend our gratitude to all contributors who have helped shape and improve the software.
