import React from 'react';
import PropTypes from 'prop-types';

const Delegate = props => {
  Delegate.propTypes = {
    delegate: PropTypes.object.isRequired,
    pools: PropTypes.object.isRequired
  };

  const { delegate, pools } = props;

  return (
    <>
      <tr key={delegate.account.address}>
        <td>
          <strong>{delegate.rank}</strong>
        </td>
        <td>
          <span className="mr-1">{delegate.username}</span>{' '}
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
        <td>{delegate.delegateShare * 100}%</td>
        <td>
          {(delegate.vote / 100000000).toLocaleString().slice(0, -4)}{' '}
          <small className="text-muted">({delegate.approval}%)</small>
        </td>
        <td>{delegate.dailyReward.toFixed(8)}</td>
        <td>{delegate.weeklyReward.toFixed(8)}</td>
        <td>{delegate.monthlyReward.toFixed(8)}</td>
        <td>{delegate.yearlyReward.toFixed(8)}</td>
      </tr>
    </>
  );
};

export default Delegate;
