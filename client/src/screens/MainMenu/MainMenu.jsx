import ProfileCard from './components/ProfileCard'
import ActionButtons from './components/ActionButtons'
import RoomList from './components/RoomList'
import TonConnectButton from './components/TonConnectButton'
import '../../styles/MainMenu.css'

// Главное меню приложения
const MainMenu = () => {
  return (
    <div className="main-menu">
      <div className="container">
        <div className="menu-content">
          {/* TonConnect кнопка над ProfileCard */}
          <div className="flex justify-center mb-4">
            <TonConnectButton />
          </div>
          <ProfileCard />
          <ActionButtons />
          <RoomList />
        </div>
      </div>
    </div>
  )
}

export default MainMenu