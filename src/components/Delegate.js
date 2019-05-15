import React from 'react';
import PropTypes from 'prop-types';

const payouts = require('../config/payouts.json');

class Delegate extends React.Component {
  static propTypes = {
    delegate: PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.number])
    ).isRequired,
    liskAmount: PropTypes.number.isRequired,
    pools: PropTypes.objectOf(PropTypes.array).isRequired,
    rewards: PropTypes.objectOf(PropTypes.number).isRequired
  };

  state = { userShare: 0.0, delegateShare: 0, isLoading: true };

  componentDidMount() {
    this.calculateShare();
  }

  componentWillReceiveProps(nextProps) {
    const { liskAmount } = this.props;
    if (nextProps.liskAmount !== liskAmount) {
      this.setState({ isLoading: true }, () => this.calculateShare());
    }
  }

  calculateShare = () => {
    const { delegate, pools, liskAmount } = this.props;

    let delegateShare = 0.0;

    // *** LOOK UP DELEGATE SHARING PERCENTAGE ***
    if (Object.keys(payouts).includes(delegate.username)) {
      delegateShare = parseFloat(payouts[delegate.username].sharingPercentage) / 100.0;
    } else if (pools.elite.includes(delegate.username)) {
      delegateShare += parseFloat(payouts.elite.sharingPercentage) / 100.0;
    } else if (pools.gdt.includes(delegate.username)) {
      delegateShare += parseFloat(payouts.gdt.sharingPercentage) / 100.0;
    } else if (pools.sherwood.includes(delegate.username)) {
      delegateShare += parseFloat(payouts.sherwood.sharingPercentage) / 100.0;
    }

    // *** CALCULATE USER SHARE OF TOTAL VOTERS ***
    const voteWeight = delegate.vote / 100000000;
    const userShare = liskAmount / voteWeight;

    this.setState({ userShare, delegateShare, isLoading: false });
  };

  render() {
    const { delegate, rewards, pools } = this.props;
    const { userShare, delegateShare, isLoading } = this.state;

    return (
      <>
        {!isLoading && (
          <tr key={delegate.account.address}>
            <td>
              <strong>{delegate.rank}</strong>
            </td>
            <td>
              {delegate.username}{' '}
              {pools.elite.includes(delegate.username) && (
                <span className="badge badge-warning text-light">Elite</span>
              )}
              {pools.gdt.includes(delegate.username) && (
                <span className="badge badge-primary text-light">GDT</span>
              )}
              {pools.sherwood.includes(delegate.username) && (
                <span className="badge badge-info text-light">Sherwood</span>
              )}
            </td>
            <td>{delegateShare * 100}%</td>
            <td>
              {(delegate.vote / 100000000).toLocaleString().slice(0, -4)}{' '}
              <small className="text-muted">({delegate.approval}%)</small>
            </td>
            <td>{(rewards.daily * userShare * delegateShare).toFixed(8)} LSK</td>
            <td>{(rewards.weekly * userShare * delegateShare).toFixed(8)} LSK</td>
            <td>{(rewards.monthly * userShare * delegateShare).toFixed(8)} LSK</td>
            <td>{(rewards.yearly * userShare * delegateShare).toFixed(8)} LSK</td>
          </tr>
        )}
      </>
    );
  }
}

export default Delegate;
