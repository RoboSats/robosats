# Documentation

## Client

### Garage

The `Garage` contains user's tokens separated by `Slots` . Every `Slot` has the core data generated with the token and a set of `Robots`. Each `Robot` contains the information a `Coordinator` returns about that specific token. Tokens should be always sent to all coordinators on creation/recovery to ensure consistency and good UX. 

<div align="center">
  <img src="/development/assets/garage.png" width="500px">
</div>

### Federation

The `Federation` stores all available coordinators. A `Coordinator` has the main data obtained from its API: `/api/book`, `/api/limits` and `/api/info`. This information from coordinators is aggregated in the `Federation`: `book` for all orders and `exchange` for coordinator's meta data. 

<div align="center">
  <img src="/development/assets/federation.png" width="500px">
</div>
