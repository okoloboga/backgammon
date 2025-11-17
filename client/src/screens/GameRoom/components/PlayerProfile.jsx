import PropTypes from 'prop-types';
import './PlayerProfile.css';

const PlayerProfile = ({ player, align = 'left' }) => {
  const displayName = player?.username || 'Player';
  const displayAvatar = player?.avatar || '/assets/player1.png';

  const avatar = (
    <img src={displayAvatar} alt="player avatar" className="profile-avatar" />
  );
  const name = <h3 className="profile-name">{displayName}</h3>;

  return (
    <div className={`player-profile-gameroom ${align}`}>
      {align === 'left' ? (
        <>
          {avatar}
          {name}
        </>
      ) : (
        <>
          {name}
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
};

export default PlayerProfile;
