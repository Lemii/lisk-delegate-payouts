import React from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const ToolTip = props => {
  ToolTip.propTypes = {
    name: PropTypes.string.isRequired
  };

  const { name } = props;

  return (
    <OverlayTrigger
      key={name}
      placement="top"
      overlay={
        <Tooltip id={`tooltip-${name}`} className="text-justify">
          Since it is impossible to accurately keep track of all additional group bonusses and
          contribtutions on top of their regular payouts, the calculations below do{' '}
          <u>
            <strong>not</strong>
          </u>{' '}
          include these. Therefore, actual payouts might be a little bit{' '}
          <u>
            <strong>higher</strong>
          </u>{' '}
          than shown below.
        </Tooltip>
      }
    >
      <i className="fas fa-info-circle text-secondary" />
    </OverlayTrigger>
  );
};

export default ToolTip;
