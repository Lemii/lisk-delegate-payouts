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
          The displayed sums are purely based off individual vote weight and sharing percentages.
          Due to rules and bonuses, actual payouts may turn out to be{' '}
          <u>
            <strong>higher</strong>
          </u>{' '}
          than shown here.
        </Tooltip>
      }
    >
      <i className="fas fa-info-circle text-secondary" />
    </OverlayTrigger>
  );
};

export default ToolTip;
