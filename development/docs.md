# Documentation

## Client

### Garage

The `Garage` contains user's tokens separated by `Slots` . Every `Slot` stores the core data generated with the token and a set of `Robots`. Each `Robot` fetches the information a `Coordinator` has about that specific token. Tokens should be always sent to all coordinators on creation/recovery to ensure consistency and good UX.

<div align="center">
  <img src="/development/assets/garage.png" width="500px">
</div>

### Federation

The `Federation` stores information from all available coordinators. A `Coordinator` contains the main data obtained from its main API endpoints: `/api/book`, `/api/limits` and `/api/info`. This information is aggregated in the `Federation`: `book` for all orders and `exchange` for coordinator's meta data.

<div align="center">
  <img src="/development/assets/federation.png" width="500px">
</div>

### Coordinator

A `Coordinator` contains the main data obtained from its main API endpoints: `/api/book`, `/api/limits` and `/api/info` and provides functions for any necesary API call on this matter.

<div align="center">
  <img src="/development/assets/coordinator.png" width="300px">
</div>

### Order

An `Order` contains the details obtained from the coordinator hosting it and all necessary functions to interact with it. The client also has the concept of `MakerForm`, which is none other than the necessary data for order creation before it is sent to the selected coordinator.

<div align="center">
  <img src="/development/assets/order.png" width="300px">
</div>
