import PropTypes from 'prop-types';
import '../../../styles/ProfileCard.css';

// Функция для форматирования баланса с точностью до 2 знаков после запятой
const formatBalance = (num) => {
  // Округляем до 2 знаков после запятой
  const rounded = Math.round(num * 100) / 100;
  
  if (rounded >= 1000000000) {
    return (rounded / 1000000000).toFixed(2) + 'B';
  }
  if (rounded >= 1000000) {
    return (rounded / 1000000).toFixed(2) + 'M';
  }
  if (rounded >= 1000) {
    return (rounded / 1000).toFixed(2) + 'k';
  }
  
  // Для чисел меньше 1000 показываем с точностью до 2 знаков
  return rounded.toFixed(2);
};

// Компонент профиля пользователя
const ProfileCard = ({ user, balances }) => {
  const { ton, ruble, loading: balancesLoading, error: balancesError } = balances || { ton: 0, ruble: 0, loading: true, error: null };

  // Показываем заглушку, если данные пользователя еще не загружены
  if (!user) {
    return (
      <div className="profile-card">
        <div className="profile-header">
          <div className="user-info">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  const { username, winrate, wins, loses, avatar } = user;

  // Debug: Log avatar value to console
  console.log('[ProfileCard] Avatar value:', avatar);
  console.log('[ProfileCard] Full user object:', user);

  const truncatedUsername =
    username && username.length > 15 ? `${username.substring(0, 15)}...` : username;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-container">
          <img
            src={avatar || '/assets/player1.png'} // Используем аватар пользователя или заглушку
            alt="User Avatar"
            className="avatar"
          />
          <div className="user-info">
            <h2>{truncatedUsername || 'User'}</h2>
            <div className="balances-container">
              <div className="balance-item">
                <span className="currency-badge currency-ton">TON</span>
                <span className="balance-amount">
                  {balancesLoading ? '...' : formatBalance(ton)}
                </span>
              </div>
              <div className="balance-item">
                <span className="currency-badge currency-ruble">RUBLE</span>
                <span className="balance-amount">
                  {balancesLoading ? '...' : formatBalance(ruble)}
                </span>
              </div>
            </div>
            {balancesError && (
              <div className="balance-error">
                <small>Failed to load balances</small>
              </div>
            )}
          </div>
        </div>

        <div className="stats-horizontal">
          <div className="stat-item">
            <div className="stat-value">{parseFloat(winrate).toFixed(2)}</div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{wins}</div>
            <div className="stat-label">Wins</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{loses}</div>
            <div className="stat-label">Losses</div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProfileCard.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    avatar: PropTypes.string,
    winrate: PropTypes.number,
    wins: PropTypes.number,
    loses: PropTypes.number,
  }),
  balances: PropTypes.shape({
    ton: PropTypes.number,
    ruble: PropTypes.number,
    loading: PropTypes.bool,
    error: PropTypes.string
  })
};

export default ProfileCard;