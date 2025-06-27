# Documentation

## Client

### Garage

The `Garage` contains users' tokens separated by `Slots`. Every `Slot` stores the core data generated with the token and a set of `Robots`. Each `Robot` fetches the information that a `Coordinator` has about that specific token. Tokens should always be sent to all coordinators upon creation or recovery to ensure consistency and a good user experience.

<div align="center">
  <img src="/development/assets/garage.png" width="500px">
</div>

### Federation

The `Federation` stores information from all available coordinators. All coordinators information is aggregated here: `book` for all orders and `exchange` for `Coordinator`'s meta data.

<div align="center">
  <img src="/development/assets/federation.png" width="500px">
</div>

### Coordinator

A `Coordinator` contains the main data obtained from its primary API endpoints: `/api/book`, `/api/limits` and `/api/info`, and provides functions for any necessary API calls related to this matter. It also stores some static data loaded from [federation.json](/frontend/static/federation.json).

<div align="center">
  <img src="/development/assets/coordinator.png" width="300px">
</div>

### Order

An `Order` contains the details obtained from the coordinator hosting it and all necessary functions to interact with it. The client also has the concept of `MakerForm`, which is none other than the necessary data for order creation before it is sent to the selected coordinator.

<div align="center">
  <img src="/development/assets/order.png" width="300px">
</div>
