import React, { Component } from "react";

export default class UserGenPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: this.genBase62Token(32),
    };
    this.getGeneratedUser();
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

  getGeneratedUser() {
    fetch('/api/usergen' + '?token=' + this.state.token)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
            nickname: data.nickname,
            bit_entropy: data.token_bits_entropy,
            shannon_entropy: data.token_shannon_entropy,
            bad_request: data.bad_request,
        });
      });
  }


  render() {
    return (
      <div>
        <p>This is the landing and user generator page</p>
        <p>Have a token of appreciation {this.state.token}</p>
        <p>Username is {this.state.nickname}</p>
        <p>Shannon entropy is {this.state.shannon_entropy}</p>
        <p>Entropy depth is {this.state.bit_entropy} bits</p>
        <p>Bad request: {this.state.bad_request}</p>
      </div>
    );
  }

}