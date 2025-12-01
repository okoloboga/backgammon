import PropTypes from 'prop-types';
import './PlayerProfile.css';

const PlayerProfile = ({ player, align = 'left', bearOffCount = 0 }) => {
  const displayName = player?.username || 'Player';
  const displayAvatar = player?.avatar || '/assets/player1.png';

  const avatar = (
    <img src={displayAvatar} alt="player avatar" className="profile-avatar" />
  );

  const nameAndCount = (
    <div className="profile-details">
      <h3 className="profile-name">{displayName}</h3>
      <div className="bear-off-counter-profile">
        <span className="bear-off-chip-icon"></span>
        <span>{bearOffCount}</span>
      </div>
    </div>
  );

  return (
    <div className={`player-profile-gameroom ${align}`}>
      {align === 'left' ? (
        <>
          {avatar}
          {nameAndCount}
        </>
      ) : (
        <>
          {nameAndCount}
          {avatar}
        </>
      )}
    </div>
  );
};

PlayerProfile.propTypes = {
  player: PropTypes.shape({
    username: PropTypes.string,
    avatar: PropTypes.string,
  }),
  align: PropTypes.oneOf(['left', 'right']),
  bearOffCount: PropTypes.number,
};

export default PlayerProfile;
