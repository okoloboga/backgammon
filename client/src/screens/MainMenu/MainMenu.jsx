import ProfileCard from './components/ProfileCard'
import ActionButtons from './components/ActionButtons'
import RoomList from './components/RoomList'
import TonConnectButtonComponent from '../../components/TonConnectButton'
import '../../styles/MainMenu.css'

// Главное меню приложения
const MainMenu = () => {
  return (
    <div className="main-menu">
      <div className="container">
        <div className="ton-connect-header">
          <TonConnectButtonComponent />
        </div>

        <div className="menu-content">
          <ProfileCard />
          <ActionButtons />
          <RoomList />
        </div>
      </div>
    </div>
  )
}

export default MainMenu