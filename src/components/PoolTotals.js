import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';

const payouts = require('../config/payouts.json');

class PoolTotals extends React.Component {
  static propTypes = {
    liskAmount: PropTypes.number.isRequired,
    delegates: PropTypes.arrayOf(PropTypes.object).isRequired,
    pools: PropTypes.objectOf(PropTypes.array).isRequired,
    rewards: PropTypes.objectOf(PropTypes.number).isRequired
  };

  state = { totals: {}, userShares: { elite: 0.0, gdt: 0.0, sherwood: 0.0 }, isLoading: true };

  componentDidMount() {
    this.calculateTotals();
  }

  componentWillReceiveProps(nextProps) {
    const { liskAmount } = this.props;
    if (nextProps.liskAmount !== liskAmount) {
      this.setState({ isLoading: true }, () => this.calculateTotals());
    }
  }

  calculatePoolRewards = (members, sharePercentage) => {
    const { rewards } = this.props;

    return {
      daily: rewards.daily * members * sharePercentage,
      weekly: rewards.weekly * members * sharePercentage,
      monthly: rewards.monthly * members * sharePercentage,
      yearly: rewards.yearly * members * sharePercentage
    };
  };

  calculateTotals = () => {
    const { delegates, pools: rawPools, liskAmount } = this.props;
    const delegateNames = delegates.map(delegate => delegate.username);

    // *** ONLY STORE DELEGATES PRESENT IN 101 ***
    const pools = {
      gdt: rawPools.gdt.filter(delegate => delegateNames.includes(delegate)),
      elite: rawPools.elite.filter(delegate => delegateNames.includes(delegate)),
      sherwood: rawPools.sherwood.filter(delegate => delegateNames.includes(delegate))
    };

    let elite = 0.0;
    let gdt = 0.0;
    let sherwood = 0.0;

    let gdtLowest = 0;
    let eliteLowest = 0;
    let sherwoodLowest = 0;

    delegates.forEach(delegate => {
      if (pools.elite.includes(delegate.username)) {
        eliteLowest =
          eliteLowest === 0 || delegate.vote < eliteLowest ? delegate.vote : eliteLowest;
        elite += Object.keys(payouts).includes(delegate.username)
          ? parseFloat(payouts[delegate.username].sharingPercentage)
          : 25;
      } else if (pools.gdt.includes(delegate.username)) {
        gdtLowest = gdtLowest === 0 || delegate.vote < gdtLowest ? delegate.vote : gdtLowest;
        gdt += Object.keys(payouts).includes(delegate.username)
          ? parseFloat(payouts[delegate.username].sharingPercentage)
          : 6.25;
      } else if (pools.sherwood.includes(delegate.username)) {
        sherwoodLowest =
          sherwoodLowest === 0 || delegate.vote < sherwoodLowest ? delegate.vote : sherwoodLowest;
        sherwood += Object.keys(payouts).includes(delegate.username)
          ? parseFloat(payouts[delegate.username].sharingPercentage)
          : 66.66;
      }
    });

    const eliteAverage = elite / pools.elite.length / 100;
    const gdtAverage = gdt / pools.gdt.length / 100;
    const sherwoodAverage = sherwood / pools.sherwood.length / 100;

    const totals = {
      elite: {
        voteWeight: 0.0,
        rewards: this.calculatePoolRewards(pools.elite.length, eliteAverage)
      },
      gdt: {
        voteWeight: 0.0,
        rewards: this.calculatePoolRewards(pools.gdt.length, gdtAverage)
      },
      sherwood: {
        voteWeight: 0.0,
        rewards: this.calculatePoolRewards(pools.sherwood.length, sherwoodAverage)
      }
    };

    delegates.forEach(delegate => {
      const delegateBalance = delegate.balance / 100000000;

      if (pools.elite.includes(delegate.username)) {
        totals.elite.voteWeight += eliteLowest / 100000000;
        totals.elite.voteWeight -= delegateBalance * pools.elite.length;
      } else if (pools.gdt.includes(delegate.username)) {
        totals.gdt.voteWeight += gdtLowest / 100000000;
        totals.gdt.voteWeight -= delegateBalance * pools.gdt.length;
      } else if (pools.sherwood.includes(delegate.username)) {
        totals.sherwood.voteWeight += sherwoodLowest / 100000000;
        totals.sherwood.voteWeight -= delegateBalance * pools.sherwood.length;
      }
    });

    const userShares = {
      elite: (liskAmount * pools.elite.length) / totals.elite.voteWeight,
      gdt: (liskAmount * pools.gdt.length) / totals.gdt.voteWeight,
      sherwood: (liskAmount * pools.sherwood.length) / totals.sherwood.voteWeight
    };

    this.setState({ totals, userShares, isLoading: false });
  };

  render() {
    const { totals, userShares, isLoading } = this.state;

    const poolKeys = Object.keys(totals);

    return (
      <Row>
        {!isLoading &&
          poolKeys.map(pool => (
            <Col xs={12} sm={4} key={pool} className="mb-5">
              <Card text="dark" className="shadow">
                <Card.Body>
                  <Card.Title className="text-center">
                    {pool.toUpperCase()} Totals
                    <hr />
                  </Card.Title>
                  <p>
                    Daily:{' '}
                    <strong className="pl-2">
                      {(totals[pool].rewards.daily * userShares[pool]).toFixed(4)} -{' '}
                      {(totals[pool].rewards.daily * userShares[pool] * 1.2).toFixed(4)} LSK
                    </strong>
                  </p>
                  <p>
                    Weekly:{' '}
                    <strong className="pl-2">
                      {' '}
                      {(totals[pool].rewards.weekly * userShares[pool]).toFixed(4)} -{' '}
                      {(totals[pool].rewards.weekly * userShares[pool] * 1.2).toFixed(4)} LSK{' '}
                    </strong>
                  </p>
                  <p>
                    Monthly:{' '}
                    <strong className="pl-2">
                      {(totals[pool].rewards.monthly * userShares[pool]).toFixed(4)} -{' '}
                      {(totals[pool].rewards.monthly * userShares[pool] * 1.2).toFixed(4)} LSK{' '}
                    </strong>
                  </p>
                  <p>
                    Annually:{' '}
                    <strong className="pl-2">
                      {(totals[pool].rewards.yearly * userShares[pool]).toFixed(4)} -{' '}
                      {(totals[pool].rewards.yearly * userShares[pool] * 1.2).toFixed(4)} LSK{' '}
                    </strong>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
    );
  }
}

export default PoolTotals;
