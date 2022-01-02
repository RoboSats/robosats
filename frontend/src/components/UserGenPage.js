import React, { Component } from "react";

export default class UserGenPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: this.genBase62Token(30),
    };
    this.token = this.genBase62Token(30);
  }
  // sort of cryptographically strong function to generate Base62 token client-side
  genBase62Token(length)
  {   
      return window.btoa(Array.from(
        window.crypto.getRandomValues(
          new Uint8Array(length * 2)))
          .map((b) => String.fromCharCode(b))
          .join("")).replace(/[+/]/g, "")
          .substring(0, length);
  }

  render() {
    return (
      <div>
        <p>This is the landing and user generator page</p>
        <p>Have a token of appreciation {this.state.token}</p>
      </div>
    );
  }

}