import React, { Component } from "react";

export default class BookPage extends Component {
    constructor(props) {
      super(props);
      this.state = {
        orders: null,
      };
      this.currency = 2;
      this.type = 1;
      this.getOrderDetails()
    }
    getOrderDetails() {
      fetch('/api/book' + '?currency=' + this.currency + "&type=" + this.type)
        .then((response) => response.json())
        .then((data) => console.log(data));
        // this.setState({orders: data}));
    }
    render() {
        return (
        <div className="col">
        <h1>Book</h1>
        {/* {this.state.orders.map(order => <div>{order.maker_nick}</div>)} */}
      </div>
      );
    }
}