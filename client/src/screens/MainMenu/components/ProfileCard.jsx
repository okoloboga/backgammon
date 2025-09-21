import PropTypes from 'prop-types';
import '../../../styles/ProfileCard.css';
import { useWalletBalances } from '../../../hooks/useWalletBalances';

// Функция для форматирования баланса (1234 -> 1.2k, 1234567 -> 1.2M)
const formatBalance = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  // Округляем до 2 знаков после запятой для чисел меньше 1000
  if (num > 0 && num < 1000) {
    return parseFloat(num.toFixed(2));
  }
  return num;
};

// Компонент профиля пользователя
const ProfileCard = ({ user }) => {
  const { balanceTon, balanceRuble, isLoading } = useWalletBalances();

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
                  {isLoading ? '...' : formatBalance(balanceTon)}
                </span>
              </div>
              <div className="balance-item">
                <span className="currency-badge currency-ruble">RUBLE</span>
                <span className="balance-amount">
                  {isLoading ? '...' : formatBalance(balanceRuble)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-horizontal">
          <div className="stat-item">
            <div className="stat-value">{winrate.toFixed(2)}</div>
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
};

export default ProfileCard;
