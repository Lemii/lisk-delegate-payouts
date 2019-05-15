import React from 'react';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Delegate from './Delegate';
import ToolTip from './ToolTip';
import BackToTop from './BackToTop';
import './App.css';

const lisk = require('@liskhq/lisk-api-client');
const payouts = require('../config/payouts.json');

const mainnetClient = lisk.APIClient.createMainnetAPIClient();
const defaultAmount = 1000;

let timeoutId = null;

class App extends React.Component {
  state = {
    delegates: [],
    pools: {},
    isLoading: true,
    liskAmount: defaultAmount,
    rewards: {},
    orderType: null,
    orderDesc: true
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
    Promise.all([loadDelegates, loadPools, calculateRewards])
      .then(() => {
        const { delegates } = this.state;
        const newDelegates = this.updateDelegates(delegates);
        this.setState({ delegates: newDelegates });
        return newDelegates;
      })
      .then(newDelegates => {
        const sumOfRewards = this.getSumOfRewards(newDelegates);
        this.setState({ isLoading: false, sumOfRewards });
      });
  }

  handleChange = event => {
    clearTimeout(timeoutId);

    const doDelayedChange = liskAmount => {
      const newTimeoutId = setTimeout(
        () =>
          this.setState({ liskAmount }, () => {
            const delegateUpdate = this.updateDelegates();
            const sumOfRewardsUpdate = this.getSumOfRewards(delegateUpdate);
            this.setState({ delegates: delegateUpdate, sumOfRewards: sumOfRewardsUpdate });
          }),
        1000
      );
      timeoutId = newTimeoutId;
    };

    doDelayedChange(event.target.value);
  };

  updateDelegates = () => {
    const {
      pools, //
      rewards,
      liskAmount,
      delegates
    } = this.state;

    const completeDelegates = delegates.map(oldDelegate => {
      const delegate = { ...oldDelegate };
      delegate.delegateShare = 0.0;

      // *** LOOK UP DELEGATE SHARING PERCENTAGE ***
      if (Object.keys(payouts).includes(delegate.username)) {
        delegate.delegateShare = parseFloat(payouts[delegate.username].sharingPercentage) / 100.0;
      } else if (pools.elite.includes(delegate.username)) {
        delegate.delegateShare += parseFloat(payouts.elite.sharingPercentage) / 100.0;
      } else if (pools.gdt.includes(delegate.username)) {
        delegate.delegateShare += parseFloat(payouts.gdt.sharingPercentage) / 100.0;
      } else if (pools.sherwood.includes(delegate.username)) {
        delegate.delegateShare += parseFloat(payouts.sherwood.sharingPercentage) / 100.0;
      }

      // *** CALCULATE USER SHARE OF TOTAL VOTERS ***
      delegate.voteWeight = delegate.vote / 100000000;
      delegate.userShare = liskAmount / delegate.voteWeight;
      delegate.dailyReward = rewards.daily * delegate.userShare * delegate.delegateShare;
      delegate.weeklyReward = rewards.weekly * delegate.userShare * delegate.delegateShare;
      delegate.monthlyReward = rewards.monthly * delegate.userShare * delegate.delegateShare;
      delegate.yearlyReward = rewards.yearly * delegate.userShare * delegate.delegateShare;

      return delegate;
    });

    return completeDelegates;
  };

  getSumOfRewards = delegates => {
    const rewards = delegates.reduce((previousValue, currentValue) => {
      return {
        dailyReward: previousValue.dailyReward + currentValue.dailyReward,
        weeklyReward: previousValue.weeklyReward + currentValue.weeklyReward,
        monthlyReward: previousValue.monthlyReward + currentValue.monthlyReward,
        yearlyReward: previousValue.yearlyReward + currentValue.yearlyReward
      };
    });
    return rewards;
  };

  sortData = type => {
    const { delegates, orderDesc } = this.state;

    function desc(a, b) {
      if (a[type] > b[type]) {
        return -1;
      }

      if (a[type] < b[type]) {
        return 1;
      }
      return 0;
    }

    function asc(a, b) {
      if (a[type] < b[type]) {
        return -1;
      }
      if (a[type] > b[type]) {
        return 1;
      }
      return 0;
    }

    delegates.sort(orderDesc ? asc : desc);

    this.setState({ delegates, orderDesc: !orderDesc, orderType: type });
  };

  scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
  };

  render() {
    const {
      isLoading, //
      delegates,
      pools,
      sumOfRewards,
      orderType,
      orderDesc
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
              <button type="button" onClick={this.scrollToBottom} className="btn btn-outline-info">
                DONATE
              </button>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container>
          {!isLoading ? (
            <>
              <div className="text-center align-middle mt-5 mb-5">
                <h3 className="d-inline align-middle mr-3">Enter LSK amount</h3>
                <Form.Control
                  type="number"
                  size="lg"
                  placeholder={defaultAmount}
                  onChange={this.handleChange}
                  className="font-weight-bold align-middle smaller d-inline"
                  disabled={isLoading}
                  min="0"
                />
              </div>
              <Table striped bordered hover size="sm" className="shadow text-center">
                <thead>
                  <tr className="font-weight-bold">
                    <th className="pointer" onClick={() => this.sortData('rank')}>
                      Rank{' '}
                      {orderType === 'rank' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('username')}>
                      Name{' '}
                      {orderType === 'username' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('delegateShare')}>
                      Share{' '}
                      {orderType === 'delegateShare' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('vote')}>
                      Vote Weight{' '}
                      {orderType === 'vote' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('dailyReward')}>
                      Est. Daily Reward{' '}
                      {orderType === 'dailyReward' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('weeklyReward')}>
                      Est. Weekly Reward{' '}
                      {orderType === 'weeklyReward' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('monthlyReward')}>
                      Est. Monthly Reward{' '}
                      {orderType === 'monthlyReward' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                    <th className="pointer" onClick={() => this.sortData('yearlyReward')}>
                      Est. Annual Reward{' '}
                      {orderType === 'yearlyReward' && (
                        <i className={`fas fa-caret-${!orderDesc ? 'up' : 'down'}`} />
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {delegates.map(delegate => (
                    <Delegate key={delegate.account.address} delegate={delegate} pools={pools} />
                  ))}

                  <tr>
                    <td colSpan="4" className="font-weight-bold text-right">
                      Sum <ToolTip name="sum" />
                    </td>
                    <td className="font-weight-bold">
                      {sumOfRewards.dailyReward.toFixed(3)} -{' '}
                      {(sumOfRewards.dailyReward * 1.2).toFixed(3)} LSK
                    </td>
                    <td className="font-weight-bold">
                      {sumOfRewards.weeklyReward.toFixed(3)} -{' '}
                      {(sumOfRewards.weeklyReward * 1.2).toFixed(3)} LSK
                    </td>
                    <td className="font-weight-bold">
                      {sumOfRewards.monthlyReward.toFixed(3)} -{' '}
                      {(sumOfRewards.monthlyReward * 1.2).toFixed(3)} LSK
                    </td>
                    <td className="font-weight-bold">
                      {sumOfRewards.yearlyReward.toFixed(3)} -{' '}
                      {(sumOfRewards.yearlyReward * 1.2).toFixed(3)} LSK
                    </td>
                  </tr>
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
