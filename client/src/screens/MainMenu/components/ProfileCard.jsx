import { mockProfile } from '../../../data/mockData'
import '../../../styles/ProfileCard.css'

// Компонент профиля пользователя
const ProfileCard = () => {
  const { username, balance, winRate, wins, losses } = mockProfile

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
            <div className="balance">
              <img
                src="/assets/diamond.png"
                alt="Crystal"
                className="balance-icon"
              />
              <span>{balance.toFixed(2)}</span>
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