import ReactMarkdown from 'react-markdown'
import {Paper, Grid, CircularProgress, Button, Link} from "@mui/material"
import React, { Component } from 'react'

export default class InfoPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        info: null,
        loading: true,
    };
    this.getInfoMarkdown()
    }

  getInfoMarkdown() {
    fetch('/static/assets/info.md')
      .then((response) => response.text())
      .then((data) => this.setState({info:data, loading:false}));
    }

    render() {
        return (
          <Grid container spacing={1}>
                      {this.state.loading ? <Grid item xs={12} align="center">
                    <CircularProgress />
                    </Grid> : ""}
            <Paper elevation={12} style={{ padding: 10, width: 900, maxHeight: 500, overflow: 'auto'}}>
                <ReactMarkdown children={this.state.info} />
            </Paper>
            <Grid item xs={12} align="center">
              <Button color="secondary" variant="contained" to="/" component={Link}>
                  Back
              </Button>
          </Grid>
          </Grid>
        )
      }
    }