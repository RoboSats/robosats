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
The easiest way to run a RoboSats coordinator is by using our Docker image releases (see Github Release). That's it, there are no more guides at the moment so it requires a fair bit of technical knowledge as of now. The details of how to wire everything will vary depending on your existing infrastructure. You will find help on our [SimpleX Development Group](https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F6iIcWT_dF2zN_w5xzZEY7HI2Prbh3ldP07YTyDexPjE%3D%40smp10.simplex.im%2FKEkNLMlgM8vrrU3xjBt5emS7EsP0c4s1%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEABehx7Tgefl_vvOGOe2SThJCGACKRgSU2wiUdIJ5bQHw%253D%26srv%3Drb2pbttocvnbrngnwziclp2f4ckjq65kebafws6g4hy22cdaiv5dwjqd.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22gFi-9hvL3XgXXTgnlZPyJw%3D%3D%22%7D).

We are working to release three flavors of pre-configured orchestrations with decent defaults: 1) a well-tested docker-compose orchestration and 2) a [StartOS](https://github.com/Start9Labs/start-os) RoboSats Coordinator App, and lastly 3) an elegant, but little tested, Kubernetes orchestration. The infrastructure-as-code will be open source as well. You can find the repository holding the docker-compose and kubernetes orchestrations here [RoboSats-Deploy](https://github.com/RoboSats/robosats-deploy). The Kubernetes orchestration as wel as the StartOS app are still work in progress.

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

## New coordinator limits.
The RoboSats client app limits the size of order tha robots can place on newly joined coordinators. This way new coordinators can show their worth with smaller orders before handling all order sizes. The client allows orders of up to 250K Sats for completely new coordinators. The client will increase the size limite by 30% every 2016 blocks (that is, 2 weeks, same as the difficulty adjustment). After 6 months, a coordinator will be considered "mature" and able to host any order size. Coordinator that gained the "Founder" badge by joining before the v0.6.0 release are considered "mature".

## New Coordinator Order Size Limits
The RoboSats client application imposes limits on the order size that robots can place on newly established coordinators. This mechanism allows new coordinators to demonstrate their capabilities with progressively larger orders.

New coordinators are initially restricted to hosting orders of up to 250,000 Sats. Over time, the order size limit increases. Specifically, the limit grows by 30% every 2016 blocks (2 weeks), the same cadence of the Bitcoin mining difficulty adjustment.

After six months, or approximately 12,288 blocks, a coordinator reaches maturity and the app grants it the ability to handle orders of any size. Notably, coordinators that earned the "Founder" badge upon joining prior to the v0.6.0 release are considered mature and can process any order size immediately.

## Timeline

In a sense the RoboSats federation is already online. New coordinators can gradually join. Any coordinator that registers and gets his backend up and running integrated on the RoboSats client app **during 2023 will receive the Founder badge**.

## Security & Privacy

If coordinators want to prioritize their privacy ans security, there are some key considerations that should not pass under their radar.

### Security

A coordinator is a honeypot by definition. You should be aware of and responsible for its security, as there will always be someone trying to breach your system.

1. Make sure your Coordinator software runs on a single-purpose machine; more software means more attack vectors.
2. Configure your local network security. Coordinators can be attacked from the outside, but infected machines in your local network can also be used as attackers.
3. Configure SSH access to allow only specific PGP keys.
4. Ensure your server is configured to automatically manage attackers using tools like `ufw`, `fail2ban`, `lynis`, etc.
5. Your Bitcoin/LN setup is properly configured and secured.

### Privacy

The Robosats suite is configured to offer maximum privacy from the inside, but there are some external factors you should control and configure.

1. Coordinators are only accessible from Tor, but the host where you run the software still has clearnet access. Consider using a VPN with a kill switch  as the first line of defense.
2. Install and configure `torsocks` to be used in all commands. This can be achieved by adding `. torsocks on` to your `.bashrc`. Together with an external VPN, you'll have a Tor-over-VPN configuration, the best privacy oriented setup.
3. Install and configure `privoxy` for commands that are not compatible with SOCKS.
4. Docker builds its own network and can often bypass Tor and the VPN's kill switch, including pulling from docker.io and any requests made inside containers. Make sure to define and test proxy settings for Docker (test it with `docker run --rm curlimages/curl https://check.torproject.org`).
5. Possibly the best option to obtain the Robosats Docker image is to avoid using docker.io and instead build the releases locally.
