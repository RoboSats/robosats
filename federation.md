_RoboSats Federation Basis v0.6.0~1_

## Introduction
RoboSats is a Free and Open Source project, anyone can spin up a new RoboSats backend instance. This is in fact ideal, given that the more backend instances there are, the more decentralized RoboSats becomes and the harder it is to stop. However, this decentralization creates some challenges:

1. **Fragmented liquidity** - Spinning up new instances fragments the already thin peer-to-peer market liquidity.
2. **Discovery problems** - It's difficult for users to find and connect to new instances.
3. **Trust issues** - Users may not know whether a coordinator can be trusted. Shady coordinators could potentially scam users.
4. **Lost DevFund revenue** - With decentralized instances, revenue is detached from code development. This results in lost capacity to improve the platform and maintain the codebase.

The **RoboSats Federation aims to solve these 4 key issues!** The Federation is a set of rules that allow multiple RoboSats instances to work together under a unified client app. The federated client app joins the order book of every coordinator, users can seamlessly interact with any coordinator, track the coordinator reputation, verify transparently devFund donations, and more. 

The goal is to release the federated app in version **v0.6.0** as the new standard RoboSats client.

## Key Terminology
- **RoboSats** - The peer-to-peer bitcoin exchange app with cool robots.
- **Coordinator** (aka, Host) - The party in charge of allowing matchmaking and communication. Creates the invoices. Maintains the RoboSats backend and lightning infrastructure. Source of trust. Collects the trade revenue and any possible profit. Solves disputes. _You might see the term "Host" being used in the RoboSats app UI for its simplicity instead of "Coordinator"._
- **Federation** - The set of all coordinators of RoboSats.
- **Devs** - Contributors to the RoboSats codebase.
- **DevFund** - Donations used for developing RoboSats.

## How to become a RoboSats Federation Coordinator

### Who can become a RoboSats coordinator in the federation?
**Anyone**. However, bear in mind it's a market, you will need to gain the trust of robots and failing to satisfy users of your instance might exclude you.

### Requirements of a Coordinator
Becoming a RoboSats coordinator is not just "easy passive income" and does require significant knowledge and ongoing effort. Before taking on this role, please ensure you meet the necessary requirements and are prepared for the responsibilities involved.

- Extensive systems administration experience - You will need strong skills in managing servers, networks, docker, kubernetes, etc.
- Expertise running a Lightning node - Hands-on experience with node software like LND or CLN is critical. You will need to be able to configure, monitor, and troubleshoot your node.
- Understanding the regulations in your jurisdiction.
- Solid operational security skills.
- Customer service skills - You will need to provide support to your robots and resolve any issues they encounter. Strong written and verbal communication is key.
- In-depth knowledge of RoboSats - Fully understand how the service works at both a user and technical level. This will allow you to properly manage operations.

A RoboSats coordinator is not too capital intensive. In fact, incoming payments are matched with outgoing payments, so only a small balance is needed to cover channel reserves and some extra. However, if you plan to enable "onchain payouts," more liquidity will be required, and you'll need to become familiar with balancing lightning/onchain.

### What is a coordinator expected to do?
Short list of what a coordinator is expected to do: 

- Run RoboSats Coordinator in a production environment. 
- Build reputation and gain users trust. 
- Keep a well maintained LN node (Note: Sats at risk, Lightning and the RoboSats backend are not hack proof).
- Provide user support for any order hosted by the coordinator backend.
- Solve user disputes fairly and timely.
- Maintain a top OpSec and respect the privacy of the robots.
- Be informed about their jurisdiction regulation.
- Compete with other RoboSats operators on a free market (e.g. compete on fees, user support, transparency, awesomeness, reachability, outreach, etc).
- Earn Sats from trade revenue (stack sats!) for bringing easy and private p2p to the masses!
- Voluntarily stream Sats to the RoboSats devFund to make RoboSats even more awesome.

### How to become part of the Federation and be included in the RoboSats app?
Simply open a new issue in GitHub and select the form "Coordinator Registration". You can **preview the [Coordinator Registration form here](https://github.com/RoboSats/robosats/blob/main/.github/ISSUE_TEMPLATE/coordinator_registration.yaml)** .

Coordinator registrations are **always OPEN** . All fields can be updated or completed later through pull requests. Don't worry about getting everything perfect initially. It's okay if your data policy, privacy policy, node ids, and endpoints aren't fully defined or are subject to change.

### How to run a RoboSats Coordinator?
The easiest way to run a RoboSats coordinator is by using our Docker image releases (see Github Release). That's it, there are no more guides at the moment so it requires a fair bit of technical knowledge as of now. The details of how to wire everything will vary depending on your existing infrastructure. You will find help on our [Matrix Development group](https://matrix.to/#/#robosats:matrix.org).

We are working to release three flavors of pre-configured orchestrations with decent defaults: 1) a well-tested docker-compose orchestration and 2) a [StartOS](https://github.com/Start9Labs/start-os) RoboSats Coordinator App, and lastly 3) an elegant, but little tested, Kubernetes orchestration. The infrastructure-as-code will be open source as well.

### Can a RoboSats coordinator be profitable?
There are many nuances, but the short answer is: Yes. 

Bitcoin exchanges are the single biggest revenue makers in the space. In addition, coordinating robosats has low running cost (hardware / energy) and development cost (open source, donation based). There is no reason why coordinating RoboSats would not be profitable even if at a very small scale. A RoboSats coordinator should be able to outcompete in fees any other P2P or centralized exchange and still be profitable.

### What are the risks of running a RoboSats coordinator
Running a Lightning routing node is by itself a risky endeavour. On top of that, think that a RoboSats coordinator will expose to the public many of the critical functionality of your node (e.g., create invoice, pay invoices, send Sats onchain, etc). While the RoboSats backend has been already been in production for a year and a half and many possible exploits have been ironed out already, there is always a chance that 1) new bugs are discovered on your node implementation or 2) malicious actors find exploits on the RoboSats codebase and abuse them instead of reporting them.

As discussed above, a lightning node capable of coordinating hundreds of RoboSats orders in a day does not need much liquidity. In that regard, the funds at risk are relatively low.

### Funding development

Donations to the Development Fund (DevFund) are voluntary with no minimum amount. The default donation rate in the Coordinator backend is 20%, however, you can freely set this value to 0%. Regardless of the amount a coordinator donates for development, all coordinators will be included in the client app.

The coordinators that chose to stick with the default donation rate or higher will get to display a cool badge on their profiles. The RoboSats client app randomly sorts coordinators weighted by their DevFund donation value ([implementation here](https://github.com/RoboSats/robosats/blob/2262dc2af7110e86bb529f5075a19a50e16ade45/frontend/src/utils/federationLottery.ts#L27-L30)). Thus, the orders of the coordinators that contribute to the development have a higher chance to appear first in the Order book. Coordinators who contribute to the DevFund are also more likely to receive support if needed (note that unless the devs are under time constraints support is unlikely to be denied). These patron perks are the way developers say "thank you for your contribution!". 

The RoboSats development team has an exciting roadmap ahead. However, once RoboSats is fully decentralized, the only source of funding for further development and maintaining the codebase will be donations (we do not accept venture-capital investments). Some of the exciting roadmap ahead:
- [RoboSats PRO app](https://github.com/RoboSats/robosats/issues/177) (Intended for professional market makers. This client can manage many orders/robots in many coordinators at once.)
- [Onchain private Taproot/MAST contracts](https://github.com/RoboSats/robosats/issues/230)
- Fully functional Android torified App. Eventually, iOS app as well (we'll try :D)
- Keep up to date with Lightning development, overall polishing of UX and improve tooling for coordinators.

### Coordinator Profiles
Each RoboSats coordinator has a profile in the RoboSats app. The profile contains an avatar, a motto, description, coordinator settings, node id, fees, privacy and data policy among others. The coordinator will also be able to cool and colorful badges that should help users distinguish quickly what coordinator they can trust.

**Currently implemented badges**
- Founder - Joined the Federation from the beginning.
- Loved by Robots -  Robots leave good reviews online.
- Good OpSecs -  Protects his privacy and that of Robots.
- Large Limits -  Can host orders with large limits.
- DevFund donator - Donates to the DevFund the default amount or more.

Some of these badges can be objectively measured and awarded. Other badges rely on the subjectivity of the development team. These will be generously awarded and only taken away after a warning.

We also envision more badges in the future, for example milestones by number of trades coordinated (200, 1K, 5K, 25K, 100K, etc).

## Timeline

In a sense the RoboSats federation is already online. New coordinators can gradually join. Eventually, the RoboSats "Experimental" coordinator that is run by the development team will be phased out. The RoboSats Federated client app can be used already in `robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion`. You can also run a pre-release of the v0.6.0 selfhosted client.

Any coordinator that registers and gets his backend up and running integrated on the RoboSats client app **during 2023 will get the badge reward 

verall the [Mash](https://mash.com/consumer-experience/) wallet works end2end with Robosats on both selling & receiging with all details in the notes for the invoices showin. The details of the flows in the app are shown. When the transactions are complete, they open in the mobile app on both sender/receiver sides to highlight that the transactions are completed.The one UX hick-up is that the pending invoices list doesn't explicitly show HOLD invoices (they are filtered), but will open a bug to fix this issue shortly (this note is from Aug 21st 2023). 