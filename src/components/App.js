import React from 'react';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Delegate from './Delegate';
import PoolTotals from './PoolTotals';
import BackToTop from './BackToTop';
import './App.css';

const lisk = require('@liskhq/lisk-api-client');

const mainnetClient = lisk.APIClient.createMainnetAPIClient();
const defaultAmount = 1000;

let timeoutId = null;

class App extends React.Component {
  state = {
    delegates: [],
    pools: {},
    isLoading: true,
    liskAmount: defaultAmount,
    rewards: {}
  };

  componentDidMount() {
    // *** FETCH DELEGATE LIST
    const loadDelegates = mainnetClient.delegates
      .get({ limit: 100 })
      .then(res => res.data)
      .then(async delegates => {
        const lastDelegate = await mainnetClient.delegates
          .get({ limit: 1, offset: 100 })
          .then(res => res.data[0]);
        delegates.push(lastDelegate);
        return delegates;
      })
      .then(fullDelegateList => this.setState({ delegates: fullDelegateList }));

    // *** FETCH POOL LISTS
    const elite = fetch('https://api.lisk.support/v1/pools/elite').then(res => res.json());
    const gdt = fetch('https://api.lisk.support/v1/pools/gdt').then(res => res.json());
    const sherwood = fetch('https://api.lisk.support/v1/pools/sherwood').then(res => res.json());

    const loadPools = Promise.all([elite, gdt, sherwood]).then(res =>
      this.setState({
        pools: {
          elite: res[0],
          gdt: res[1],
          sherwood: res[2]
        }
      })
    );

    // *** LOAD CONSTANTS ***
    const calculateRewards = mainnetClient.node.getConstants().then(res => {
      const blocksForgedDaily = 8640;
      const forgers = 101;
      const blockReward = res.data.reward / 100000000;
      const rewardsPerDay = (blocksForgedDaily * blockReward) / forgers;
      const rewardsPerWeek = rewardsPerDay * 7;
      const rewardsPerYear = (blocksForgedDaily * 365 * blockReward) / forgers;
      const rewardsPerMonth = rewardsPerYear / 12;

      this.setState({
        rewards: {
          daily: rewardsPerDay,
          weekly: rewardsPerWeek,
          monthly: rewardsPerMonth,
          yearly: rewardsPerYear
        }
      });
    });

    // *** CHECK IF ALL UPDATES ARE COMPLETE ***
    Promise.all([loadDelegates, loadPools, calculateRewards]).then(() => {
      const { delegates } = this.state;
      const newDelegates = delegates.map(delegate =>
        fetch(`https://api.lisknode.io/api/accounts?username=${delegate.username}`)
          .then(res => res.json())
          .then(json => {
            return { ...delegate, balance: parseInt(json.data[0].balance) };
          })
      );

      Promise.all(newDelegates)
        .then(res => this.setState({ delegates: res }))
        .then(() => this.setState({ isLoading: false }));
    });
  }

  handleChange = event => {
    clearTimeout(timeoutId);

    const doDelayedChange = liskAmount => {
      const newTimeoutId = setTimeout(() => this.setState({ liskAmount }), 1000);
      timeoutId = newTimeoutId;
    };

    doDelayedChange(event.target.value);
  };

  render() {
    const {
      isLoading, //
      delegates,
      pools,
      liskAmount,
      rewards
    } = this.state;

    return (
      <>
        <Navbar bg="dark" variant="dark" className="shadow header">
          <Container>
            <Navbar.Brand>
              <span className="title">
                <i className="fas fa-poll-h text-info mr-2" />
                Lisk Delegate Payouts
              </span>
            </Navbar.Brand>
            <Navbar.Collapse className="justify-content-end">
              <h5 className="pr-2 align-middle mt-2 text-light">Amount</h5>
              <Form inline>
                <Form.Control
                  type="number"
                  size="lg"
                  placeholder={defaultAmount}
                  onChange={this.handleChange}
                  name="liskAmount"
                  className="font-weight-bold smaller"
                />
              </Form>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container>
          {!isLoading ? (
            <>
              <h1 className="text-center mt-5 mb-4">Pool Summaries</h1>
              <PoolTotals
                delegates={delegates}
                pools={pools}
                liskAmount={liskAmount}
                rewards={rewards}
              />

              <h1 className="text-center mb-4">Individual Delegates</h1>
              <Table striped bordered hover size="sm" className="shadow text-center">
                <thead>
                  <tr className="font-weight-bold">
                    <td>Rank</td>
                    <td>Name</td>
                    <td>Share</td>
                    <td>Vote Weight</td>
                    <td>Est. Daily Reward</td>
                    <td>Est. Weekly Reward</td>
                    <td>Est. Monthly Reward</td>
                    <td>Est. Annual Reward</td>
                  </tr>
                </thead>

                <tbody>
                  {delegates.map(delegate => (
                    <Delegate
                      key={delegate.account.address}
                      liskAmount={liskAmount}
                      delegate={delegate}
                      pools={pools}
                      rewards={rewards}
                    />
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <h1 className="text-center text-muted mt-5 display-4">Loading...</h1>
          )}
          <footer className="mt-5 p-4 border-top text-center">
            <p className="mt-2">
              Support Lisktools.eu by voting for my delegate{' '}
              <a href="lisk://delegates/vote?votes=lemii">lemii</a>, or donating to{' '}
              <a href="lisk://wallet?recipient=5222060513855166167L">5222060513855166167L</a>
            </p>
            <p>©2018-2019 Lisktools.eu</p>
          </footer>
        </Container>
        <BackToTop />
      </>
    );
  }
}

export default App;
