import { mockProfile } from '../../../data/mockData'
import '../../../styles/ProfileCard.css'

// Функция для форматирования баланса (1234 -> 1.2k, 1234567 -> 1.2M)
const formatBalance = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num
}

// Компонент профиля пользователя
const ProfileCard = () => {
  const { username, balanceTon, balanceRuble, winRate, wins, losses } = mockProfile

  const truncatedUsername = username.length > 15 ? `${username.substring(0, 15)}...` : username

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-container">
          <img
            src="/assets/player1.png"
            alt="User Avatar"
            className="avatar"
          />
          <div className="user-info">
            <h2>{truncatedUsername}</h2>
            <div className="balances-container">
              <div className="balance-item">
                <span className="currency-badge currency-ton">TON</span>
                <span className="balance-amount">{formatBalance(balanceTon)}</span>
              </div>
              <div className="balance-item">
                <span className="currency-badge currency-ruble">RUBLE</span>
                <span className="balance-amount">{formatBalance(balanceRuble)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-horizontal">
          <div className="stat-item">
            <div className="stat-value">{winRate}</div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{wins}</div>
            <div className="stat-label">Wins</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{losses}</div>
            <div className="stat-label">Losses</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard